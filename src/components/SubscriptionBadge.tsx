import { Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types/user";
import {
  getSubscriptionTierName,
  getSubscriptionStatusDisplay,
  hasPremiumAccess,
} from "@/lib/subscription";

interface SubscriptionBadgeProps {
  userProfile: UserProfile | null;
  showIcon?: boolean;
  className?: string;
}

export function SubscriptionBadge({
  userProfile,
  showIcon = true,
  className = "",
}: SubscriptionBadgeProps) {
  if (!userProfile) return null;

  const isPremium = hasPremiumAccess(userProfile);
  const tierName = getSubscriptionTierName(userProfile.subscription_tier);
  const statusDisplay = getSubscriptionStatusDisplay(
    userProfile.subscription_status
  );

  // Show premium badge if user has access
  if (isPremium) {
    // Determine icon based on tier
    const icon = userProfile.subscription_tier === "pro" ? (
      <Crown className="h-3 w-3" />
    ) : (
      <Zap className="h-3 w-3" />
    );

    return (
      <Badge variant="default" className={`gap-1 ${className}`}>
        {showIcon && icon}
        {tierName}
      </Badge>
    );
  }

  // Show status badge for non-premium users
  return (
    <Badge variant={statusDisplay.variant} className={className}>
      {statusDisplay.label}
    </Badge>
  );
}