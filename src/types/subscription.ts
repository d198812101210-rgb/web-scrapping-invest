export type SubscriptionTier = 'free' | 'plus' | 'pro';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending' | 'suspended';

export type BillingPeriod = 'monthly' | 'quarterly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  billing_period: BillingPeriod;
  price: number;
  currency: string;
  paypal_plan_id: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  paypal_subscription_id: string | null;
  paypal_order_id: string | null;
  start_date: string | null;
  end_date: string | null;
  next_billing_date: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  paypal_subscription_id: string;
  paypal_order_id?: string;
}

export interface CancelSubscriptionRequest {
  subscription_id: string;
  reason?: string;
}

export interface FeatureMatrix {
  id: string;
  feature_key: string;
  feature_name: string;
  free: boolean;
  plus: boolean;
  pro: boolean;
  updated_at: string;
}

export interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  quantity: string;
  subscriber: {
    email_address: string;
    payer_id: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    next_billing_time: string;
    final_payment_time: string;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}