import { UserProfile } from "@/types/user";
import { SubscriptionTier } from "@/types/subscription";

/**
 * Check if user has an active premium subscription
 */
export function hasActiveSubscription(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  
  return (
    (userProfile.subscription_tier === "plus" || userProfile.subscription_tier === "pro") &&
    userProfile.subscription_status === "active"
  );
}

/**
 * Check if user has access to premium features
 * This includes active subscriptions and grace period for recently cancelled
 */
export function hasPremiumAccess(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  
  // Active subscription
  if (hasActiveSubscription(userProfile)) return true;
  
  // Grace period: cancelled but not yet expired
  if (
    userProfile.subscription_status === "cancelled" &&
    userProfile.subscription_end_date
  ) {
    const endDate = new Date(userProfile.subscription_end_date);
    const now = new Date();
    return endDate > now;
  }
  
  return false;
}

/**
 * Get subscription tier display name
 */
export function getSubscriptionTierName(tier: SubscriptionTier): string {
  switch (tier) {
    case "pro":
      return "Pro";
    case "plus":
      return "Plus";
    case "free":
      return "Free";
    default:
      return "Unknown";
  }
}

/**
 * Get subscription status display name
 */
export function getSubscriptionStatusDisplay(
  status: string | null
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  switch (status) {
    case "active":
      return { label: "Active", variant: "default" };
    case "cancelled":
      return { label: "Cancelled", variant: "secondary" };
    case "expired":
      return { label: "Expired", variant: "destructive" };
    case "suspended":
      return { label: "Suspended", variant: "destructive" };
    case "pending":
      return { label: "Pending", variant: "outline" };
    default:
      return { label: "Free", variant: "outline" };
  }
}

/**
 * Calculate days remaining in subscription
 */
export function getDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Format subscription price
 */
export function formatSubscriptionPrice(
  price: number,
  currency: string = "USD",
  billingPeriod: "monthly" | "quarterly"
): string {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
  
  return `${formattedPrice}/${billingPeriod === "monthly" ? "month" : "quarter"}`;
}

/**
 * Calculate savings for quarterly plan compared to monthly
 */
export function calculateQuarterlySavings(
  monthlyPrice: number,
  quarterlyPrice: number
): number {
  return monthlyPrice * 3 - quarterlyPrice;
}

/**
 * Check if user should see upgrade prompt
 */
export function shouldShowUpgradePrompt(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  
  return (
    userProfile.subscription_tier === "free" ||
    userProfile.subscription_status === "expired" ||
    userProfile.subscription_status === "cancelled"
  );
}

/**
 * Get premium features list
 */
export function getPremiumFeatures(): string[] {
  return [
    "Access to all analytics dashboards",
    "Upload custom avatars",
    "Custom chart styles and themes",
    "Advanced data filtering",
    "Export data to CSV/Excel",
    "Priority customer support",
    "Real-time data updates",
    "Mobile app access",
  ];
}

/**
 * Get feature availability (Legacy - use useFeatureMatrix hook instead)
 * 
 * ⚠️ DEPRECATED: This uses hardcoded feature checking
 * 
 * Use the useFeatureMatrix hook for database-driven feature checking:
 * ```tsx
 * import { useFeatureMatrix } from "@/hooks/useFeatureMatrix";
 * 
 * const { isFeatureAvailable } = useFeatureMatrix();
 * const hasFeature = isFeatureAvailable('custom_avatar');
 * ```
 */
export function isFeatureAvailable(
  feature: string,
  userProfile: UserProfile | null
): boolean {
  // Define which features require premium (legacy - hardcoded)
  const premiumFeatures = [
    "custom_avatar",
    "custom_charts",
    "advanced_filters",
    "data_export",
    "priority_support",
    "realtime_updates",
  ];
  
  // If feature doesn't require premium, it's available to everyone
  if (!premiumFeatures.includes(feature)) {
    return true;
  }
  
  // Check if user has premium access
  return hasPremiumAccess(userProfile);
}