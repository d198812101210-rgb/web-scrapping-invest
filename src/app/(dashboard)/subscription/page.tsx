'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import PayPalButtonsMount from '@/components/PayPalButtonsMount';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Check,
  Crown,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { SubscriptionPlan, BillingPeriod } from '@/types/subscription';
import { format } from 'date-fns';
import {
  formatSubscriptionPrice,
  calculateQuarterlySavings,
} from '@/lib/subscription';

type SubscriptionTierType = 'free' | 'plus' | 'pro';

interface TierUiConfig {
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

// UI-only configuration for tiers (not from database)
const TIER_UI_CONFIGS: Record<SubscriptionTierType, TierUiConfig> = {
  free: {
    description: 'Get started with basic features',
    icon: <Check className="h-5 w-5" />,
    color: 'border-muted',
  },
  plus: {
    description: 'Perfect for individual investors',
    icon: <Zap className="h-5 w-5" />,
    color: 'border-primary',
    badge: 'Most Popular',
  },
  pro: {
    description: 'For professional traders and advisors',
    icon: <Crown className="h-5 w-5" />,
    color: 'border-primary',
    badge: 'Best Plan',
  },
};

export default function Subscription() {
  const { userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const {
    subscription: currentSubscription,
    plans,
    isLoading: loading,
    hasActive,
    daysRemaining,
    refetch,
  } = useSubscription();

  // State for tier selection and payment frequency dialog
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierType | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<BillingPeriod | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const getPlansByTier = (tier: SubscriptionTierType) => {
    return plans.filter((plan) => plan.tier === tier);
  };

  const getPrice = (tier: SubscriptionTierType, billingPeriod: BillingPeriod): number => {
    const plan = plans.find(
      (p) => p.tier === tier && p.billing_period === billingPeriod
    );
    return plan?.price || 0;
  };

  const getFeatures = (tier: SubscriptionTierType): string[] => {
    const tierPlans = getPlansByTier(tier);
    if (tierPlans.length > 0) {
      return tierPlans[0].features || [];
    }
    return [];
  };

  const handleSubscribeTier = (tier: SubscriptionTierType) => {
    if (tier === 'free') {
      handleDowngradeToFree();
    } else {
      setSelectedTier(tier);
      setShowBillingDialog(true);
    }
  };

  const handleBillingPeriodSelect = (period: BillingPeriod) => {
    setSelectedBillingPeriod(period);
    setShowBillingDialog(false);
    setShowPaymentDialog(true);
  };

  const handleDowngradeToFree = async () => {
    if (!currentSubscription) {
      toast({
        title: 'Already on Free Plan',
        description: 'You are already using the free tier.',
      });
      return;
    }

    try {
      setProcessingPayment(true);

      const { data, error } = await supabase.functions.invoke(
        'cancel-subscription',
        {
          body: {
            subscription_id: currentSubscription.id,
            reason: 'User downgrading to free plan',
          },
        }
      );

      if (error) throw error;

      toast({
        title: 'Downgraded to Free',
        description:
          "Your subscription has been cancelled. You'll have access to free features immediately.",
      });

      await refetch();
      await refreshUserProfile();
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to downgrade. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentApproved = async ({
    orderId,
    captureId,
  }: {
    orderId: string;
    captureId?: string;
  }) => {
    if (!selectedTier || !selectedBillingPeriod) return;

    const amount = getPrice(selectedTier, selectedBillingPeriod);

    try {
      setProcessingPayment(true);

      const matchingPlan = plans.find(
        (plan) =>
          plan.tier === selectedTier &&
          plan.billing_period === selectedBillingPeriod
      );

      if (!matchingPlan) {
        throw new Error(
          `Plan not found for tier: ${selectedTier}, billing period: ${selectedBillingPeriod}`
        );
      }

      const amountCents = Math.round(amount * 100);

      const { data: result, error } = await supabase.functions.invoke(
        'paypal-capture',
        {
          body: {
            plan_id: matchingPlan.id,
            orderId,
            captureId,
            amountCents,
            currency: 'USD',
          },
        }
      );

      if (error) throw error;

      toast({
        title: 'Subscription Activated!',
        description: `Welcome to ${
          selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)
        }! Your subscription is now active.`,
      });

      setShowPaymentDialog(false);
      setSelectedTier(null);
      setSelectedBillingPeriod(null);
      await refetch();
      await refreshUserProfile();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description:
          'Failed to activate subscription. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  const currentTier = (userProfile?.subscription_tier || 'free') as SubscriptionTierType;

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Select the perfect plan for your financial analytics needs
          </p>
        </div>

      {currentSubscription && currentTier !== 'free' && (
        <Alert className="mb-8 border-primary bg-primary/5">
          <Crown className="h-4 w-4" />
          <AlertTitle>Your Current Plan</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {currentSubscription.plan?.name ||
                    currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                </span>
                <Badge variant="default">Active</Badge>
              </div>
              {currentSubscription.next_billing_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Next billing date:{' '}
                    {format(
                      new Date(currentSubscription.next_billing_date),
                      'PPP'
                    )}
                  </span>
                </div>
              )}
              {daysRemaining !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <span>
                    {daysRemaining} days remaining in your billing period
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 md:grid-cols-3 mb-8">
        {(['free', 'plus', 'pro'] as SubscriptionTierType[]).map((tier) => {
          const isCurrentPlan = currentTier === tier;
          const uiConfig = TIER_UI_CONFIGS[tier];
          const monthlyPrice = getPrice(tier, 'monthly');
          const quarterlyPrice = getPrice(tier, 'quarterly');
          const quarterlyDiscountAmount = calculateQuarterlySavings(
            monthlyPrice,
            quarterlyPrice
          );
          const features = getFeatures(tier);

          return (
            <Card
              key={tier}
              className={`relative flex flex-col transition-all hover:shadow-lg ${
                isCurrentPlan
                  ? `${uiConfig.color} border-2 shadow-lg`
                  : uiConfig.color
              }`}
            >
              {uiConfig.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge
                    className={
                      tier === 'pro'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-primary text-primary-foreground'
                    }
                  >
                    {tier === 'pro' && <Crown className="h-5 w-5 mr-1" />}
                    {uiConfig.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="flex-none">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-primary">{uiConfig.icon}</div>
                    <div>
                      <CardTitle className="text-2xl">
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </CardTitle>
                    </div>
                  </div>
                  {isCurrentPlan && (
                    <Badge variant="default" className="ml-2">
                      Current
                    </Badge>
                  )}
                </div>
                <CardDescription>{uiConfig.description}</CardDescription>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${monthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {tier !== 'free' && (
                    <div className="text-sm text-muted-foreground mt-1">
                      or ${quarterlyPrice.toFixed(2)}/quarter
                      {quarterlyDiscountAmount > 0 && (
                        <div className="flex items-center gap-1 text-primary font-semibold mt-1">
                          <Sparkles className="h-4 w-4" />
                          Save ${quarterlyDiscountAmount.toFixed(2)}/quarter
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <Separator className="my-6" />

              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex-none">
                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : tier === 'free' && currentTier !== 'free' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubscribeTier(tier)}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Downgrade
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribeTier(tier)}
                  >
                    {tier === 'free' ? 'Get Started' : 'Subscribe Now'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Billing Period Dialog */}
      <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Billing Period</DialogTitle>
            <DialogDescription>
              Choose how frequently you want to be billed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleBillingPeriodSelect('monthly')}
            >
              <span className="font-semibold">Monthly</span>
              <span className="ml-auto text-muted-foreground">
                ${selectedTier && getPrice(selectedTier, 'monthly').toFixed(2)}
                /mo
              </span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleBillingPeriodSelect('quarterly')}
            >
              <span className="font-semibold">Quarterly</span>
              <span className="ml-auto text-muted-foreground">
                ${selectedTier && getPrice(selectedTier, 'quarterly').toFixed(2)}
                /quarter
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Securely process your subscription payment
            </DialogDescription>
          </DialogHeader>
          <PayPalButtonsMount
            amount={String(
              selectedTier
                ? getPrice(selectedTier, selectedBillingPeriod || 'monthly')
                : 0
            )}
            description={`${selectedTier} plan - ${selectedBillingPeriod || 'monthly'} billing`}
            onApproved={handlePaymentApproved}
          />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}