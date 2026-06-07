'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { SubscriptionPlan, FeatureMatrix } from '@/types/subscription';

type SubscriptionTier = 'free' | 'plus' | 'pro';

interface PlanFormData {
  price: number;
  features: string;
}

const TIER_INFO: Record<SubscriptionTier, { label: string; color: string }> =
  {
    free: { label: 'Free', color: 'bg-gray-100' },
    plus: { label: 'Plus', color: 'bg-blue-100' },
    pro: { label: 'Pro', color: 'bg-purple-100' },
  };

export default function SubscriptionManagement() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [featureMatrix, setFeatureMatrix] = useState<FeatureMatrix[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDialogOpen, setEditingDialogOpen] = useState(false);
  const [showMatrixTab, setShowMatrixTab] = useState(false);
  const [matrixTouched, setMatrixTouched] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>({
    price: 0,
    features: '',
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('tier', { ascending: true })
        .order('billing_period', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Fetch feature matrix
      const { data: matrixData, error: matrixError } = await supabase
        .from('feature_matrix')
        .select('*')
        .order('feature_name', { ascending: true });

      if (matrixError) throw matrixError;
      setFeatureMatrix(matrixData || []);
      setMatrixTouched(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = (featureId: string, tier: SubscriptionTier) => {
    setFeatureMatrix((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? { ...feature, [tier]: !feature[tier] }
          : feature
      )
    );
    setMatrixTouched(true);
  };

  const saveFeatureMatrix = async () => {
    try {
      setIsSubmitting(true);

      // Update each feature in the feature_matrix table
      for (const feature of featureMatrix) {
        const { error } = await supabase
          .from('feature_matrix')
          .update({
            free: feature.free,
            plus: feature.plus,
            pro: feature.pro,
          })
          .eq('id', feature.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Feature matrix updated successfully',
      });
      await fetchData();
    } catch (error) {
      console.error('Error saving feature matrix:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feature matrix',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const discardChanges = async () => {
    await fetchData();
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setFormData({
      price: plan.price,
      features: plan.features.join('\n'),
    });
    setEditingDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingDialogOpen(false);
    setEditingId(null);
    setFormData({ price: 0, features: '' });
  };

  const handleSavePlan = async () => {
    try {
      if (editingId === null) return;

      setIsSubmitting(true);
      const features = formData.features
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f);

      const { error } = await supabase
        .from('subscription_plans')
        .update({
          price: formData.price,
          features,
        })
        .eq('id', editingId);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Subscription plan updated successfully',
      });
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save subscription plan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Subscription plan deleted successfully',
      });
      await fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subscription plan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group plans by tier
  const plansByTier = {
    free: plans.filter((p) => p.tier === 'free'),
    plus: plans.filter((p) => p.tier === 'plus'),
    pro: plans.filter((p) => p.tier === 'pro'),
  };

  // Don't render if not admin
  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Subscription Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage subscription features, pricing, and tiers
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b">
          <button
            onClick={() => setShowMatrixTab(false)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              !showMatrixTab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setShowMatrixTab(true)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              showMatrixTab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Feature Matrix
          </button>
        </div>

        {showMatrixTab ? (
          // Feature Matrix Tab
          <Card>
            <CardHeader>
              <CardTitle>Feature Matrix</CardTitle>
              <CardDescription>
                Enable or disable features for each subscription tier. Changes
                automatically sync to all subscription plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        Feature
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <span className="text-sm">Free</span>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <span className="text-sm">Plus</span>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <span className="text-sm">Pro</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureMatrix.map((feature) => (
                      <tr key={feature.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-sm">
                          {feature.feature_name}
                        </td>
                        {(
                          ['free', 'plus', 'pro'] as SubscriptionTier[]
                        ).map((tier) => (
                          <td key={tier} className="text-center py-3 px-4">
                            <Checkbox
                              checked={feature[tier]}
                              onCheckedChange={() =>
                                toggleFeature(feature.id, tier)
                              }
                              disabled={isSubmitting}
                              className="mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {matrixTouched && (
                <div className="mt-6 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={discardChanges}
                    disabled={isSubmitting}
                  >
                    Discard Changes
                  </Button>
                  <Button onClick={saveFeatureMatrix} disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Plans Tab
          <div className="grid gap-6">
            {(['plus', 'pro'] as SubscriptionTier[]).map((tier) => (
              <Card key={tier}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="capitalize">
                        {TIER_INFO[tier].label} Tier
                      </CardTitle>
                      <CardDescription>
                        Configure pricing and features for{' '}
                        {TIER_INFO[tier].label.toLowerCase()} plan
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {plansByTier[tier].length} plans
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    {plansByTier[tier].length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No plans configured for this tier
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plansByTier[tier].map((plan) => (
                          <div
                            key={plan.id}
                            className="flex flex-col justify-between p-4 rounded-lg border bg-card"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{plan.name}</h4>
                                <Badge variant="outline" className="capitalize">
                                  {plan.billing_period}
                                </Badge>
                                {!plan.is_active && (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                <span className="font-medium">{plan.price}</span>{' '}
                                {plan.currency}
                              </p>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                  <strong>Features:</strong> {plan.features.length}
                                </p>
                                <ul className="ml-4 space-y-0.5">
                                  {plan.features.slice(0, 3).map((feature, idx) => (
                                    <li key={idx}>• {feature}</li>
                                  ))}
                                  {plan.features.length > 3 && (
                                    <li>
                                      • +{plan.features.length - 3} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 flex-shrink-0">
                              <Dialog
                                open={
                                  editingDialogOpen &&
                                  editingId === plan.id
                                }
                                onOpenChange={(open) => {
                                  if (!open) handleCloseDialog();
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenEdit(plan)
                                    }
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Edit {plan.name}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Update pricing and features
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="price">
                                        Price ({plan.currency})
                                      </Label>
                                      <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            price: parseFloat(
                                              e.target.value
                                            ),
                                          })
                                        }
                                        placeholder="0.00"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="features">
                                        Features (one per line)
                                      </Label>
                                      <textarea
                                        id="features"
                                        value={formData.features}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            features: e.target.value,
                                          })
                                        }
                                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                        className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                      />
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                      <Button
                                        variant="outline"
                                        onClick={handleCloseDialog}
                                        disabled={isSubmitting}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleSavePlan}
                                        disabled={isSubmitting}
                                      >
                                        {isSubmitting && (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeletePlan(plan.id)}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}