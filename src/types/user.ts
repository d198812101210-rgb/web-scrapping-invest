import { SubscriptionTier, SubscriptionStatus } from './subscription';

export type UserRole = 'admin' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_blocked?: boolean;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}