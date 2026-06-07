'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomizations } from '@/hooks/useCustomization';
import { useTabCustomizations } from '@/hooks/useTabCustomization';
import { useFeatureMatrix } from '@/hooks/useFeatureMatrix';
import { useAuth } from '@/contexts/AuthContext';
import type { ChartCategory } from '@/types/customization';
import { CustomizationForm } from '@/components/settings/CustomizationForm';
import { TabCustomizationForm } from '@/components/settings/TabCustomizationForm';
import { UpgradePrompt } from '@/components/UpgradePrompt';

const Settings = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ChartCategory>('brazil-indices');

  const { data: customizations, isLoading, error } = useCustomizations();
  const { data: tabCustomizations } = useTabCustomizations();
  const { isFeatureAvailable } = useFeatureMatrix();

  const defaultLabels: Record<ChartCategory, string> = {
    'brazil-indices': 'Brazilian Indices',
    'us-indices': 'U.S. Indices',
    commodities: 'Commodities',
    currency: 'Currency',
  };

  const categoryToFeatureKey: Record<ChartCategory, string> = {
    'brazil-indices': 'brazilian_indices',
    'us-indices': 'us_indices',
    commodities: 'commodities',
    currency: 'currency',
  };

  const availableTabs = useMemo(() => {
    const role = userProfile?.role;

    if (role === 'admin') {
      return ['brazil-indices', 'us-indices', 'commodities', 'currency'] as ChartCategory[];
    }

    return (
      ['brazil-indices', 'us-indices', 'commodities', 'currency'] as ChartCategory[]
    ).filter((category) => isFeatureAvailable(categoryToFeatureKey[category]));
  }, [userProfile?.role, isFeatureAvailable]);

  const categoryLabel = (category: ChartCategory) => {
    const customTab = tabCustomizations?.find((t) => t.category === category);
    if (customTab) {
      return customTab.tab_label;
    }
    return defaultLabels[category] || 'Unknown';
  };

  const getCustomizationsByCategory = (category: ChartCategory) => {
    return customizations?.filter((c) => c.category === category) || [];
  };

  useEffect(() => {
    if (!availableTabs.includes(activeTab) && availableTabs.length > 0) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Chart Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your chart formulas and styles for each market category
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Error loading settings:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChartCategory)} className="w-full">
              <TabsList
                className={`grid w-full ${
                  availableTabs.length === 1
                    ? 'grid-cols-1'
                    : availableTabs.length === 2
                      ? 'grid-cols-2'
                      : availableTabs.length === 3
                        ? 'grid-cols-3'
                        : 'grid-cols-4'
                } mb-6`}
              >
                {availableTabs.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {categoryLabel(category)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {availableTabs.map((category) => (
                <TabsContent key={category} value={category} className="space-y-6">
                  {isFeatureAvailable('tab_customization') ? (
                    <TabCustomizationForm
                      category={category}
                      defaultLabel={categoryLabel(category)}
                    />
                  ) : (
                    <UpgradePrompt
                      feature="Tab Customization"
                      variant="alert"
                      className="mb-6"
                    />
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>{categoryLabel(category)}</CardTitle>
                      <CardDescription>
                        Configure up to 4 custom chart lines for{' '}
                        {categoryLabel(category).toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {[1, 2, 3, 4].map((lineNumber) => {
                          const customization = getCustomizationsByCategory(category).find(
                            (c) => c.line_number === lineNumber
                          );
                          return (
                            <motion.div
                              key={lineNumber}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: lineNumber * 0.05,
                              }}
                            >
                              <CustomizationForm
                                category={category}
                                lineNumber={lineNumber}
                                initialData={customization}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;