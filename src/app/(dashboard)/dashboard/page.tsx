'use client';

import { useState } from 'react';
import Tabs from '@/components/dashboard/Tabs';
import ChartPanel from '@/components/dashboard/ChartPanel';
import { motion } from 'framer-motion';

export type MarketCategory = 'brazilian-indices' | 'brazilian-currency' | 'us-indices' | 'commodities';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<MarketCategory>('brazilian-indices');

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor market trends and financial data in real-time
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
          <ChartPanel category={activeTab} />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;