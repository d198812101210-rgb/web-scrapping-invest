import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureMatrix } from "@/hooks/useFeatureMatrix";
import type { MarketCategory } from "@/app/(dashboard)/dashboard/page";
import { useTabCustomizations } from "@/hooks/useTabCustomization";
import { useMemo, useEffect, useState } from "react";

interface TabsProps {
  activeTab: MarketCategory;
  onTabChange: (tab: MarketCategory) => void;
}

const allTabs = [
  { id: "brazilian-indices" as MarketCategory, defaultLabel: "Brazilian Indices" },
  { id: "brazilian-currency" as MarketCategory, defaultLabel: "Currency" },
  { id: "us-indices" as MarketCategory, defaultLabel: "U.S. Indices" },
  { id: "commodities" as MarketCategory, defaultLabel: "Commodities" },
];

// Mapping between MarketCategory and feature keys in the database
const categoryToFeatureKey: Record<MarketCategory, string> = {
  "brazilian-indices": "brazilian_indices",
  "brazilian-currency": "currency",
  "us-indices": "us_indices",
  "commodities": "commodities",
};

const Tabs = ({ activeTab, onTabChange }: TabsProps) => {
  const { userProfile } = useAuth();
  const { isFeatureAvailable } = useFeatureMatrix();
  const { data: tabCustomizations } = useTabCustomizations();
  const [validActiveTab, setValidActiveTab] = useState<MarketCategory>(activeTab);

  // Helper to get label for a tab, considering customizations
  const getTabLabel = (tabId: MarketCategory): string => {
    const customization = tabCustomizations?.find((t) => t.category === tabId);
    if (customization) {
      return customization.tab_label;
    }

    const defaultTab = allTabs.find((t) => t.id === tabId);
    return defaultTab?.defaultLabel || tabId;
  };

  // Filter tabs based on feature matrix
  const availableTabs = useMemo(() => {
    const role = userProfile?.role;

    // Admin users get all tabs
    if (role === "admin") {
      return allTabs;
    }

    // For regular users, filter based on feature availability from feature matrix
    return allTabs.filter((tab) => isFeatureAvailable(categoryToFeatureKey[tab.id]));
  }, [userProfile?.role, isFeatureAvailable]);

  // Validate and update activeTab if it's not in available tabs
  useEffect(() => {
    if (!availableTabs.find((tab) => tab.id === activeTab) && availableTabs.length > 0) {
      onTabChange(availableTabs[0].id);
    }
  }, [availableTabs, activeTab, onTabChange]);

  return (
    <div className="mb-6">
      <div className="flex space-x-1 bg-card p-1 rounded-lg border border-border">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex-1 px-4 py-2 text-sm font-medium rounded-md
              transition-colors duration-200
              ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-secondary rounded-md"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{getTabLabel(tab.id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
