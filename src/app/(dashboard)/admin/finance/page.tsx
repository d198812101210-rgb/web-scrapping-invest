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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { DollarSign, TrendingUp, Users, CreditCard, Loader2 } from 'lucide-react';

interface RevenueStats {
  totalRevenue: number;
  annualRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalUsers: number;
  freeUsers: number;
}

interface SubscriptionData {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  cancelled_at: string | null;
  created_at: string;
  metadata: {
    amount_paid?: number;
    [key: string]: any;
  };
  plan: {
    name: string;
    tier: string;
    billing_period: string;
    price: number;
  };
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}

interface TierDistribution {
  name: string;
  value: number;
  revenue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function FinanceDashboard() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    annualRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    totalUsers: 0,
    freeUsers: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>([]);
  const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);
  const [loading, setLoading] = useState(true);

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
      fetchRevenueStats();
    }
  }, [userProfile]);

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*');

      if (usersError) throw usersError;

      // Fetch ALL subscriptions with plan details
      const { data: allSubscriptions, error: allSubsError } = await supabase
        .from('subscriptions')
        .select(
          `
          *,
          plan:subscription_plans(name, tier, billing_period, price)
        `
        );

      if (allSubsError) throw allSubsError;

      // Filter active subscriptions
      const subscriptions =
        allSubscriptions?.filter((sub) => sub.status === 'active') || [];

      // Calculate stats
      const totalUsers = users?.length || 0;
      const activeSubscriptions = subscriptions?.length || 0;
      const freeUsers =
        users?.filter((user) => user.subscription_tier === 'free').length || 0;

      // Calculate revenue
      let monthlyRecurringRevenue = 0;
      let yearlyRecurringRevenue = 0;
      const tierCounts: { [key: string]: { count: number; revenue: number } } =
        {
          free: { count: freeUsers, revenue: 0 },
        };

      subscriptions?.forEach((sub: SubscriptionData) => {
        const plan = sub.plan;
        if (plan) {
          const price = Number(plan.price);
          const tierName = plan.tier || 'subscription';
          const amountPaid = sub.metadata?.amount_paid
            ? Number(sub.metadata.amount_paid)
            : 0;

          if (plan.billing_period === 'monthly') {
            monthlyRecurringRevenue += price;
            yearlyRecurringRevenue += price * 12;
          } else if (plan.billing_period === 'yearly') {
            yearlyRecurringRevenue += price;
            monthlyRecurringRevenue += price / 12;
          }

          // Initialize tier if it doesn't exist
          if (!tierCounts[tierName]) {
            tierCounts[tierName] = { count: 0, revenue: 0 };
          }

          tierCounts[tierName].count += 1;
          // Use actual amount_paid if available, otherwise use annualized plan price
          tierCounts[tierName].revenue +=
            amountPaid > 0
              ? amountPaid
              : plan.billing_period === 'monthly'
                ? price * 12
                : price;
        }
      });

      // Calculate monthly revenue trend (last 6 months) - actual payments received per month
      const monthlyRevenue: MonthlyRevenueData[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59
        );
        const monthName = monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        // Sum monthly earnings from all subscriptions active during this month
        let monthRevenue = 0;
        const activeInMonth = allSubscriptions?.filter((sub: SubscriptionData) => {
          if (!sub.start_date) return false;
          const startDate = new Date(sub.start_date);
          const endDate = sub.end_date
            ? new Date(sub.end_date)
            : sub.cancelled_at
              ? new Date(sub.cancelled_at)
              : null;

          // Subscription was active if it started before/during this month and hadn't been cancelled/ended by the end of this month
          return startDate <= monthEnd && (!endDate || endDate > monthEnd);
        }) || [];

        activeInMonth.forEach((sub: SubscriptionData) => {
          const plan = sub.plan;
          if (plan) {
            const price = Number(plan.price);
            if (plan.billing_period === 'monthly') {
              monthRevenue += price;
            } else if (plan.billing_period === 'yearly') {
              monthRevenue += price / 12;
            }
          }
        });

        monthlyRevenue.push({
          month: monthName,
          revenue: Number(monthRevenue.toFixed(2)),
          subscriptions: activeInMonth.length,
        });
      }

      // Prepare tier distribution data
      const tierDist: TierDistribution[] = Object.entries(tierCounts).map(
        ([tier, data]) => ({
          name: tier.charAt(0).toUpperCase() + tier.slice(1),
          value: data.count,
          revenue: data.revenue,
        })
      );

      // Calculate total, annual, and current month revenue
      let totalRevenue = 0;
      let annualRevenue = 0;
      let currentMonthRevenue = 0;
      const currentYear = new Date().getFullYear();
      const today = new Date();
      const currentMonthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const currentMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      subscriptions?.forEach((sub: SubscriptionData) => {
        const amountPaid = sub.metadata?.amount_paid
          ? Number(sub.metadata.amount_paid)
          : 0;

        if (amountPaid > 0) {
          totalRevenue += amountPaid;

          if (sub.start_date) {
            const startDate = new Date(sub.start_date);
            if (startDate.getFullYear() === currentYear) {
              annualRevenue += amountPaid;
            }

            // Add to current month revenue if subscription started in current month
            if (startDate >= currentMonthStart && startDate <= currentMonthEnd) {
              currentMonthRevenue += amountPaid;
            }
          }
        }
      });

      setStats({
        totalRevenue,
        annualRevenue,
        monthlyRevenue: currentMonthRevenue,
        activeSubscriptions,
        totalUsers,
        freeUsers,
      });
      setMonthlyData(monthlyRevenue);
      setTierDistribution(tierDist);
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load revenue statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      description: 'Total collected since beginning',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Annual Revenue',
      value: `$${stats.annualRevenue.toFixed(2)}`,
      description: `Revenue collected in ${new Date().getFullYear()}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      description: 'Current Monthly Recurring Revenue',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Active Subscriptions',
      value: `${stats.activeSubscriptions}`,
      description: `${stats.totalUsers - stats.freeUsers} paid / ${stats.freeUsers} free`,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

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

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Revenue</h1>
          <p className="text-muted-foreground mt-2">
            Monitor subscription revenue and financial metrics
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {statCards.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Trend Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Monthly Recurring Revenue (last 6 months)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) =>
                        typeof value === 'number'
                          ? `$${value.toFixed(2)}`
                          : value
                      }
                      labelFormatter={(label: string) => `${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="MRR"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subscription Distribution Charts */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {/* User Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>
                    Breakdown by subscription tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tierDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => {
                          const total = tierDistribution.reduce(
                            (sum, item) => sum + item.value,
                            0
                          );
                          const percentage =
                            total > 0
                              ? Math.round((value / total) * 100)
                              : 0;
                          return `${name}: ${value} (${percentage}%)`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tierDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => {
                          if (typeof value === 'number') {
                            return `${value} users`;
                          }
                          return value;
                        }}
                        labelFormatter={(label: string) => `Tier: ${label}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Tier Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Tier</CardTitle>
                  <CardDescription>
                    Annual revenue contribution by subscription tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={tierDistribution.filter((tier) => tier.revenue > 0)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) =>
                          typeof value === 'number'
                            ? `$${value.toFixed(2)}`
                            : value
                        }
                        labelFormatter={(label: string) => `${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="revenue"
                        fill="#82ca9d"
                        name="Annual Revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Growth</CardTitle>
                <CardDescription>
                  Total active subscriptions at end of each month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => {
                        if (typeof value === 'number') {
                          return `${value} subscriptions`;
                        }
                        return value;
                      }}
                      labelFormatter={(label: string) => `${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="subscriptions"
                      fill="#8884d8"
                      name="Active Subscriptions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}