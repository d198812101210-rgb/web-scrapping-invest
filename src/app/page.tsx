'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, LineChart, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Home = () => {
  const { user } = useAuth();

  // Trigger portfolio cron job when page loads (fire and forget)
  useEffect(() => {
    const triggerCronJob = async () => {
      try {
        await fetch('/api/portfolio/cron/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        // Silently fail - don't impact page load
        console.debug('Portfolio cron trigger request sent');
      }
    };

    triggerCronJob();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-base sm:text-xl font-bold text-foreground">
                Market Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="sm:h-10 sm:px-4">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="sm:h-10 sm:px-4"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="sm:h-10 sm:px-4">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            Real-Time Financial Analytics
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
            Track market movements, analyze asset performance, and make informed
            decisions with our professional-grade dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">
                  Live Market Data
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Real-time updates every 5 minutes with comprehensive market
                  coverage across Brazilian and U.S. indices.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <LineChart className="h-10 w-10 sm:h-12 sm:w-12 text-accent mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">
                  Advanced Analytics
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Custom formulas and models to analyze asset movements and
                  identify trading opportunities.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <PieChart className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">
                  Portfolio Tracking
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Monitor your investments and test different asset combinations
                  with powerful visualization tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-secondary border-border">
            <CardContent className="text-center py-8 sm:py-10 md:py-12 px-4 sm:px-6">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                Ready to elevate your trading?
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                Join thousands of investors using our platform to make
                data-driven decisions.
              </p>
              {user ? (
                <Link href="/dashboard" className="inline-block w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/signup" className="inline-block w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                  >
                    Create Your Account
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12 sm:mt-16 md:mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                © 2025 Market Dashboard. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;