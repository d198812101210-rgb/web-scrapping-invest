import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureMatrix } from "@/types/subscription";

interface UseFeatureMatrixReturn {
  featureMatrix: FeatureMatrix[] | null;
  isLoading: boolean;
  error: string | null;
  isFeatureAvailable: (featureKey: string) => boolean;
  isFeatureAvailableForTier: (featureKey: string, tier: "free" | "plus" | "pro") => boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to access feature matrix and check feature availability
 * 
 * Uses the feature_matrix table as the single source of truth for features
 * Automatically checks against the current user's subscription tier
 * 
 * @example
 * ```tsx
 * const { isFeatureAvailable } = useFeatureMatrix();
 * 
 * if (isFeatureAvailable('fast_updates')) {
 *   // Show fast updates feature
 * }
 * ```
 */
export function useFeatureMatrix(): UseFeatureMatrixReturn {
  const { userProfile } = useAuth();
  const [featureMatrix, setFeatureMatrix] = useState<FeatureMatrix[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatureMatrix = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("feature_matrix")
        .select("*")
        .order("feature_name", { ascending: true });

      if (fetchError) throw fetchError;

      setFeatureMatrix(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load feature matrix";
      console.error("Error fetching feature matrix:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatureMatrix();
  }, []);

  // Subscribe to feature matrix changes for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("feature_matrix_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feature_matrix",
        },
        () => {
          fetchFeatureMatrix();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Check if a feature is available for the current user's tier
   * Admins always have access to all features
   */
  const isFeatureAvailable = (featureKey: string): boolean => {
    // Admin users have full access
    if (userProfile?.role === "admin") {
      return true;
    }

    // Determine tier (default to 'free' for non-authenticated users)
    const tier = (userProfile?.subscription_tier || "free") as "free" | "plus" | "pro";

    // Find the feature in the matrix
    const feature = featureMatrix?.find(f => f.feature_key === featureKey);
    if (!feature) {
      console.warn(`Feature '${featureKey}' not found in feature matrix`);
      return false;
    }

    // Check if available for tier
    return feature[tier] === true;
  };

  /**
   * Check if a specific feature is available for a specific tier
   * Useful for admin UI and billing pages showing what's available in each tier
   */
  const isFeatureAvailableForTier = (
    featureKey: string,
    tier: "free" | "plus" | "pro"
  ): boolean => {
    const feature = featureMatrix?.find(f => f.feature_key === featureKey);
    if (!feature) {
      console.warn(`Feature '${featureKey}' not found in feature matrix`);
      return false;
    }

    return feature[tier] === true;
  };

  return {
    featureMatrix,
    isLoading,
    error,
    isFeatureAvailable,
    isFeatureAvailableForTier,
    refetch: fetchFeatureMatrix,
  };
}