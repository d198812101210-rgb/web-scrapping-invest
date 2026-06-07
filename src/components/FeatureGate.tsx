import { ReactNode } from "react";
import { UserProfile } from "@/types/user";
import { hasPremiumAccess } from "@/lib/subscription";
import { useFeatureMatrix } from "@/hooks/useFeatureMatrix";
import { UpgradePrompt } from "./UpgradePrompt";

interface FeatureGateProps {
  userProfile?: UserProfile | null;
  featureKey?: string; // Database feature key (e.g., 'custom_avatar', 'fast_updates')
  feature?: string;   // Human-readable feature name for fallback message
  fallback?: ReactNode;
  fallbackVariant?: "card" | "alert" | "inline";
  children: ReactNode;
}

/**
 * FeatureGate component - Conditionally renders children based on feature availability
 * Uses feature_matrix table for authorization
 * 
 * @example
 * ```tsx
 * // Database-driven check (recommended)
 * <FeatureGate featureKey="custom_avatar" feature="Custom Avatars">
 *   <AvatarUploader />
 * </FeatureGate>
 * 
 * // Legacy: subscription-based check (backward compatible)
 * <FeatureGate userProfile={userProfile} feature="custom avatars">
 *   <AvatarUploader />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  userProfile = null,
  featureKey,
  feature = "this feature",
  fallback,
  fallbackVariant = "card",
  children,
}: FeatureGateProps) {
  const { isFeatureAvailable } = useFeatureMatrix();

  // If featureKey is provided, use database-driven check (preferred)
  if (featureKey) {
    const hasAccess = isFeatureAvailable(featureKey);
    if (!hasAccess) {
      return fallback || <UpgradePrompt feature={feature} variant={fallbackVariant} />;
    }
    return <>{children}</>;
  }

  // Fallback to legacy subscription-based check for backward compatibility
  const hasAccess = hasPremiumAccess(userProfile);
  if (!hasAccess) {
    return fallback || <UpgradePrompt feature={feature} variant={fallbackVariant} />;
  }

  return <>{children}</>;
}