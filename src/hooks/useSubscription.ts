import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionWithPlan,
} from "@/types/subscription";
import {
  hasActiveSubscription,
  hasPremiumAccess,
  getDaysRemaining,
} from "@/lib/subscription";

interface UseSubscriptionReturn {
  subscription: SubscriptionWithPlan | null;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  hasActive: boolean;
  hasPremium: boolean;
  daysRemaining: number | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to access subscription data and status
 * 
 * @example
 * ```tsx
 * const { hasActive, hasPremium, subscription, plans } = useSubscription();
 * 
 * if (hasPremium) {
 *   // Show premium features
 * }
 * ```
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user, userProfile } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(
    null
  );
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionData = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch active subscription
      // Note: Fetching all subscriptions first, then filtering in JS to avoid 406 error with .in()
      const { data: allSubs, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (subError) {
        throw subError;
      }

      // Filter for active or cancelled subscriptions in JavaScript
      const subData = allSubs?.find(sub => 
        sub.status === "active" || sub.status === "cancelled"
      ) || null;

      // If subscription exists, fetch the plan details separately
      if (subData) {
        const { data: planData, error: planError } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", subData.plan_id)
          .single();

        if (planError) {
          console.error("Error fetching plan:", planError);
          // Continue without plan data rather than failing completely
          setSubscription(null);
        } else {
          const subscriptionWithPlan: SubscriptionWithPlan = {
            ...subData,
            plan: planData,
          };
          setSubscription(subscriptionWithPlan);
        }
      } else {
        setSubscription(null);
      }

      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (plansError) throw plansError;

      setPlans(plansData || []);
    } catch (err) {
      console.error("Error fetching subscription data:", err);
      setError(err instanceof Error ? err.message : "Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user?.id]);

  // Subscribe to subscription changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("subscription_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSubscriptionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const hasActive = hasActiveSubscription(userProfile);
  const hasPremium = hasPremiumAccess(userProfile);
  const daysRemaining = getDaysRemaining(userProfile?.subscription_end_date || null);

  return {
    subscription,
    plans,
    isLoading,
    error,
    hasActive,
    hasPremium,
    daysRemaining,
    refetch: fetchSubscriptionData,
  };
}