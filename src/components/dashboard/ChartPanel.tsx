import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from "recharts";
import { RefreshCw, Clock, Calendar, Lock } from "lucide-react";
import type { MarketCategory } from "@/app/(dashboard)/dashboard/page";
import { motion } from "framer-motion";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useCustomizations } from "@/hooks/useCustomization";
import { useFeatureMatrix } from "@/hooks/useFeatureMatrix";
import { useAuth } from "@/contexts/AuthContext";
import type { ChartCategory } from "@/types/customization";
import { CustomTooltip } from "./CustomTooltip";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ChartPanelProps {
  category: MarketCategory;
}

// Market hours information
const MARKET_HOURS = {
  "brazilian-indices": {
    name: "B3 (Brazilian Stock Exchange)",
    openTime: "10:00",
    closeTime: "17:00",
    timezone: "BRT (UTC-3)",
    tradingDays: "Monday to Friday"
  },
  "us-indices": {
    name: "US Stock Markets (NYSE/NASDAQ)",
    openTime: "09:30",
    closeTime: "16:00",
    timezone: "EST (UTC-5) / EDT (UTC-4)",
    tradingDays: "Monday to Friday"
  },
  "commodities": {
    name: "CME Commodities",
    openTime: "17:00 Sun",
    closeTime: "16:00 Fri",
    timezone: "CT (UTC-6) / CDT (UTC-5)",
    tradingDays: "Sunday to Friday"
  },
  "brazilian-currency": {
    name: "Foreign Exchange",
    openTime: "22:00 Sun",
    closeTime: "20:00 Fri",
    timezone: "UTC",
    tradingDays: "Sunday to Friday"
  }
};

// Helper function to check if market is currently open
const isMarketOpen = (category: MarketCategory): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Get current time in the market's timezone
  let currentHour: number;
  let currentMinute: number;
  
  if (category === "brazilian-indices") {
    // Check if it's a weekend (Sat-Sun)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Convert to Brazil time (BRT - UTC-3)
    const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    currentHour = brazilTime.getHours();
    currentMinute = brazilTime.getMinutes();
    
    // B3: 10:00 - 17:00 BRT
    const openMinutes = 10 * 60; // 10:00
    const closeMinutes = 17 * 60; // 17:00
    const currentMinutes = currentHour * 60 + currentMinute;
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else if (category === "us-indices") {
    // Check if it's a weekend (Sat-Sun)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Convert to US Eastern time
    const usTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    currentHour = usTime.getHours();
    currentMinute = usTime.getMinutes();
    
    // US Markets: 09:30 - 16:00 EST/EDT
    const openMinutes = 9 * 60 + 30; // 09:30
    const closeMinutes = 16 * 60; // 16:00
    const currentMinutes = currentHour * 60 + currentMinute;
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else if (category === "commodities") {
    // CME Commodities: Sunday 17:00 CT to Friday 16:00 CT
    // Check if it's Saturday (closed on Saturday)
    if (dayOfWeek === 6) {
      return false;
    }
    
    const ctTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    currentHour = ctTime.getHours();
    currentMinute = ctTime.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    
    if (dayOfWeek === 0) {
      // Sunday: open from 17:00 onwards
      const openMinutes = 17 * 60; // 17:00
      return currentMinutes >= openMinutes;
    } else if (dayOfWeek === 5) {
      // Friday: close at 16:00
      const closeMinutes = 16 * 60; // 16:00
      return currentMinutes < closeMinutes;
    } else {
      // Monday-Thursday: open all day
      return true;
    }
  } else if (category === "brazilian-currency") {
    // Forex: Sunday 22:00 UTC to Friday 20:00 UTC
    // Check if it's Saturday (closed on Saturday)
    if (dayOfWeek === 6) {
      return false;
    }
    
    currentHour = now.getUTCHours();
    currentMinute = now.getUTCMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    
    if (dayOfWeek === 0) {
      // Sunday: open from 22:00 onwards
      const openMinutes = 22 * 60; // 22:00
      return currentMinutes >= openMinutes;
    } else if (dayOfWeek === 5) {
      // Friday: close at 20:00
      const closeMinutes = 20 * 60; // 20:00
      return currentMinutes < closeMinutes;
    } else {
      // Monday-Thursday: open all day
      return true;
    }
  }
  
  return true;
};

const ChartPanel = ({ category }: ChartPanelProps) => {
  const { userProfile } = useAuth();
  const { isFeatureAvailable: checkFeatureAvailable } = useFeatureMatrix();
  const [data, setData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"default" | "customize">("default");
  const [updateInterval, setUpdateInterval] = useState<"15secs" | "1min">("1min");
  const [marketOpen, setMarketOpen] = useState(isMarketOpen(category));

  // Map UI feature names to database feature keys
  const isFeatureAvailable = (feature: "customize" | "fast_updates" | "historical_data"): boolean => {
    // Map feature names to feature_key in database
    const featureKeyMap: Record<string, string> = {
      customize: "customize_charts",
      fast_updates: "fast_updates",
      historical_data: "historical_data",
    };

    const featureKey = featureKeyMap[feature];
    return featureKey ? checkFeatureAvailable(featureKey) : false;
  };
  
  // New state for time mode (Current vs Historical)
  const [timeMode, setTimeMode] = useState<"current" | "date">("current");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedHour, setSelectedHour] = useState<string>("12");
  const [selectedMinute, setSelectedMinute] = useState<string>("00");
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  // State to store random items for default view
  const [randomItems, setRandomItems] = useState<string[]>([]);
  
  // State for time range slider (in minutes: 30 to 360)
  // Default: 60 minutes (1 hour) - matches scraper interval of 15 seconds per record
  const [timeRange, setTimeRange] = useState<number>(60);

  // Convert interval to milliseconds
  const refetchIntervalMs = updateInterval === "15secs" ? 15000 : 60000;
  
  // Calculate the data retention limit (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Monitor connectivity
  const connectivity = useConnectivity();

  // Map MarketCategory to ChartCategory (always fetch customizations)
  const chartCategory: ChartCategory = 
    category === "brazilian-indices" ? "brazil-indices" :
    category === "us-indices" ? "us-indices" :
    category === "commodities" ? "commodities" :
    category === "brazilian-currency" ? "currency" :
    "brazil-indices"; // fallback

  // Fetch user customizations for the current category
  const { data: customizations, isLoading: customizationsLoading } = useCustomizations(chartCategory);

  // Fetch portfolio data with time range
  const { data: portfolioData, loading: portfolioLoading, error: portfolioError, allPortfolioItems } = usePortfolioData(timeRange, refetchIntervalMs);

  // Check market status periodically
  useEffect(() => {
    const checkMarketStatus = () => {
      setMarketOpen(isMarketOpen(category));
    };

    // Check immediately
    checkMarketStatus();

    // Check every minute
    const intervalId = setInterval(checkMarketStatus, 60000);

    return () => clearInterval(intervalId);
  }, [category]);

  // Validate timeMode - reset to "current" if user loses historical_data access
  useEffect(() => {
    if (timeMode === "date" && !isFeatureAvailable("historical_data")) {
      setTimeMode("current");
    }
  }, [isFeatureAvailable]);

  // Generate random items when switching to default view, when data changes, or when category changes
  useEffect(() => {
    if (viewMode === "default" && data && data.length > 0) {
      // Get all available item keys from the loaded data (filter out 'time' and metadata)
      const availableItems = Object.keys(data[0]).filter(
        key => key !== "time" && !key.endsWith("__data") && !key.endsWith("__metadata")
      );

      if (availableItems.length >= 2) {
        // Select 2 random items from available data
        const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
        setRandomItems(shuffled.slice(0, 2));
      } else if (availableItems.length > 0) {
        // If less than 2 items available, use what we have
        setRandomItems(availableItems);
      }
    }
  }, [viewMode, data, category]);

  // Helper function to calculate custom formula value for a data point
  const calculateFormulaValue = (
    dataPoint: any,
    formulaItems: Array<{ item: string; weight: number }>
  ): number => {
    if (!formulaItems || formulaItems.length === 0) return 0;

    let totalWeightedValue = 0;
    let totalWeight = 0;

    formulaItems.forEach(({ item, weight }) => {
      // Try to find the item by symbol (item could be a symbol like "USD", "AAPL", etc.)
      const value = dataPoint[item];
      if (value !== undefined && typeof value === 'number' && weight > 0) {
        totalWeightedValue += value * weight;
        totalWeight += weight;
      }
    });

    // Return weighted average
    return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
  };

  // Helper function to generate a formula string from formula items
  const generateFormulaString = (
    formulaItems: Array<{ item: string; weight: number }>
  ): string => {
    if (!formulaItems || formulaItems.length === 0) return "Empty Formula";

    // Calculate total weight for normalization
    const totalWeight = formulaItems.reduce((sum, { weight }) => sum + weight, 0);

    // If single item, just show the item name
    if (formulaItems.length === 1) {
      return formulaItems[0].item;
    }

    // For multiple items, show weighted formula
    return formulaItems
      .map(({ item, weight }) => {
        const normalizedWeight = weight / totalWeight;
        // Show weight as percentage if it's not 1, otherwise just show item name
        if (normalizedWeight === 1) {
          return item;
        } else if (normalizedWeight === Math.round(normalizedWeight * 100) / 100) {
          // If weight is simple (like 0.5, 0.33), show it
          return `${normalizedWeight.toFixed(2)}×${item}`;
        } else {
          return `${normalizedWeight.toFixed(2)}×${item}`;
        }
      })
      .join(" + ");
  };

  // Helper function to pass through data (backend now handles time range filtering)
  const filterDataByTimeRange = (dataToFilter: any[]) => {
    // Backend now fetches data for the correct time range, so we just return as-is
    return dataToFilter || [];
  };

  // Helper function to transform data with custom formulas
  const transformDataWithFormulas = (dataToTransform: any[]) => {
    if (!dataToTransform || dataToTransform.length === 0) return dataToTransform;

    return dataToTransform.map((dataPoint) => {
      const transformed: any = { time: dataPoint.time };
      
      // Store all portfolio item data for tooltip
      Object.keys(dataPoint).forEach(key => {
        if (key.endsWith('__data')) {
          transformed[key] = dataPoint[key];
        }
      });

      // Handle default view - show two random items directly
      if (viewMode === "default") {
        randomItems.forEach((item, index) => {
          const lineKey = `Line ${index + 1}`;
          const value = dataPoint[item];
          if (value !== undefined && typeof value === 'number') {
            transformed[lineKey] = value;
          }
        });
      }
      // Handle customize view - use customizations
      else if (viewMode === "customize" && customizations) {
        customizations.forEach((custom) => {
          // Only add lines that have items configured
          if (custom.formula.items && custom.formula.items.length > 0 && custom.line_number >= 1 && custom.line_number <= 4) {
            const lineKey = `Line ${custom.line_number}`;
            transformed[lineKey] = calculateFormulaValue(
              dataPoint,
              custom.formula.items
            );
          }
        });
      }

      return transformed;
    });
  };

  // Transform data to include custom formula lines - MUST be before yAxisDomain
  const transformedData = useMemo(() => {
    const filteredData = filterDataByTimeRange(data);
    return transformDataWithFormulas(filteredData);
  }, [data, customizations, chartCategory, viewMode, randomItems]);

  // Transform historical data with the same custom formulas
  const transformedHistoricalData = useMemo(() => {
    const filteredData = filterDataByTimeRange(historicalData);
    return transformDataWithFormulas(filteredData);
  }, [historicalData, customizations, chartCategory, viewMode, randomItems]);

  // Calculate dynamic Y-axis domain based on transformed data
  const yAxisDomain = useMemo(() => {
    // Use historical data if in date mode and it exists, otherwise use real-time data
    let dataToUse: any[] = [];
    
    if (timeMode === "date") {
      dataToUse = transformedHistoricalData && transformedHistoricalData.length > 0 
        ? transformedHistoricalData 
        : historicalData;
    } else {
      dataToUse = transformedData && transformedData.length > 0 ? transformedData : data;
    }
    
    if (dataToUse.length > 0) {
      // Get all numeric values from the data (excluding metadata and data keys)
      const allValues: number[] = [];
      dataToUse.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (key !== 'time' && !key.endsWith('__metadata') && !key.endsWith('__data') && typeof item[key] === 'number') {
            allValues.push(item[key] as number);
          }
        });
      });

      if (allValues.length === 0) return [-3, 3];

      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      
      // Add 20% padding to the range for better visualization
      const range = maxValue - minValue;
      const padding = range * 0.2;
      
      const domainMin = Math.floor((minValue - padding) * 10) / 10;
      const domainMax = Math.ceil((maxValue + padding) * 10) / 10;
      
      return [domainMin, domainMax];
    }
    
    // Default domains for different categories
    if (category === "commodities") return [-5, 10];
    if (category === "brazilian-currency") return [-2, 2];
    return [-3, 3];
  }, [transformedData, data, transformedHistoricalData, historicalData, category, timeMode]);

  // Helper function to calculate X-axis interval based on time range
  // Note: Data now has 15-second granularity (4 points per minute)
  // So 60-minute range = 240 data points
  const getXAxisInterval = (): number | "preserveStartEnd" => {
    if (timeRange <= 30) return 2; // 30m × 4 = 120 points; show every 2nd = 60 labels (every ~30 sec)
    if (timeRange <= 60) return 4; // 60m × 4 = 240 points; show every 4th = 60 labels (every min)
    if (timeRange <= 120) return 8; // 120m × 4 = 480 points; show every 8th = 60 labels (every 2 min)
    if (timeRange <= 240) return 16; // 240m × 4 = 960 points; show every 16th = 60 labels (every 4 min)
    return 20; // Show every 20th point for 6h max (1440 min × 4 = 5760 points; every 5 min)
  };

  // Auto-refresh data - use portfolio data
  useEffect(() => {
    if (portfolioData && portfolioData.length > 0) {
      setData(portfolioData);
    } else if (!portfolioLoading) {
      setData([]);
    }
  }, [portfolioData, portfolioLoading]);

  // Function to fetch historical data for a specific date/time
  const fetchHistoricalData = async (date: Date, hour: string, minute: string) => {
    try {
      setHistoricalLoading(true);
      setHistoricalError(null); // Clear previous errors
      
      // Create the center timestamp
      const centerTime = new Date(date);
      centerTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // Create 1 hour before range
      const startTime = new Date(centerTime.getTime() - 60 * 60 * 1000);
      const endTime = new Date(centerTime);
      
      const { supabase } = await import('@/lib/supabase');
      
      console.log(`[${category}] Fetching historical data from ${startTime.toISOString()} to ${endTime.toISOString()}`);
      
      // Query portfolio_items directly for unified data structure
      const { data: portfolioItems, error: fetchError } = await supabase
        .from('portfolio_items')
        .select('*')
        .gte('scraped_at', startTime.toISOString())
        .lte('scraped_at', endTime.toISOString())
        .order('scraped_at', { ascending: true });
      
      console.log(`[${category}] Database Response:`, { portfolioItems, fetchError });
      
      if (fetchError) {
        throw new Error(`Failed to fetch historical data: ${fetchError.message}`);
      }
      
      let fetchedData: any[] = [];
      
      if (portfolioItems && portfolioItems.length > 0) {
        // Group data by timestamp (same as usePortfolioData does)
        const groupedData = new Map<string, any>();
        
        portfolioItems.forEach((item: any) => {
          // Skip excluded items
          if (item.name === 'London Sugar') {
            return;
          }
          
          const timestamp = new Date(item.scraped_at);
          const timeKey = timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          if (!groupedData.has(timeKey)) {
            groupedData.set(timeKey, { time: timeKey });
          }
          
          const dataPoint = groupedData.get(timeKey)!;
          // Use symbol or name as key, prefer symbol (same as usePortfolioData)
          const key = item.symbol || item.name;
          if (key) {
            dataPoint[key] = item.change_percent || 0;
            // Store full item data for tooltip/metadata
            dataPoint[`${key}__data`] = item;
            // Also keep metadata for backward compatibility
            dataPoint[`${key}__metadata`] = {
              last_price: item.last_price,
              bid_price: item.bid_price,
              ask_price: item.ask_price,
              open_price: item.open_price,
              high_price: item.high_price,
              low_price: item.low_price,
              change: item.change,
              change_percent: item.change_percent,
              volume: item.volume
            };
          }
        });
        
        fetchedData = Array.from(groupedData.values()).sort((a, b) => {
          return (a.time as string).localeCompare(b.time as string);
        });
      }
      
      setHistoricalData(fetchedData);
      setHistoricalError(null);
      setHistoricalLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching historical data';
      console.error('Error fetching historical data:', err);
      setHistoricalData([]);
      setHistoricalError(errorMessage);
      setHistoricalLoading(false);
    }
  };

  // Removed automatic fetch - now triggered only by View button click

  // Helper function to render background zones for all categories
  const renderBackgroundZones = () => {
    // Show background zones for all categories
    const [minY, maxY] = yAxisDomain;
    
    return (
      <>
        {/* Vivid Red Zone (below -0.29) */}
        {minY < -0.29 && (
          <ReferenceArea
            y1={minY}
            y2={-0.29}
            fill="hsl(0, 70%, 25%)"
            fillOpacity={0.3}
            ifOverflow="extendDomain"
          />
        )}
        
        {/* Neutral Dark Red Zone (0 to -0.29) */}
        <ReferenceArea
          y1={Math.max(minY, -0.29)}
          y2={0}
          fill="hsl(0, 40%, 30%)"
          fillOpacity={0.2}
          ifOverflow="extendDomain"
        />
        
        {/* Neutral Dark Green Zone (0 to +0.29) */}
        <ReferenceArea
          y1={0}
          y2={Math.min(maxY, 0.29)}
          fill="hsl(120, 40%, 25%)"
          fillOpacity={0.2}
          ifOverflow="extendDomain"
        />
        
        {/* Vivid Green Zone (above +0.29) */}
        {maxY > 0.29 && (
          <ReferenceArea
            y1={0.29}
            y2={maxY}
            fill="hsl(120, 70%, 25%)"
            fillOpacity={0.3}
            ifOverflow="extendDomain"
          />
        )}
      </>
    );
  };

  // Helper function to render chart lines based on view mode
  const renderChartLines = () => {
    // Default view - render two random items
    if (viewMode === "default" && randomItems.length > 0) {
      const colors = ["hsl(210, 100%, 50%)", "hsl(0, 100%, 50%)"]; // Blue and Red
      return (
        <>
          {randomItems.map((item, index) => (
            <Line
              key={`Line ${index + 1}`}
              type="monotone"
              dataKey={`Line ${index + 1}`}
              stroke={colors[index]}
              name={item}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </>
      );
    }

    // Customize view - render customizations
    if (viewMode === "customize" && customizations && customizations.length > 0) {
      // Filter to only customizations with items
      const configuredCustomizations = customizations.filter(
        custom => custom.formula.items && custom.formula.items.length > 0
      );

      if (configuredCustomizations.length > 0) {
        return (
          <>
            {configuredCustomizations
              .sort((a, b) => a.line_number - b.line_number)
              .map((custom) => {
                const lineKey = `Line ${custom.line_number}`;
                // Generate formula string for legend display
                const formulaLabel = generateFormulaString(custom.formula.items);
                
                // Convert hex color to valid stroke color
                const strokeColor = custom.style_color;
                if (strokeColor.startsWith('#')) {
                  // Already hex, use as-is (Recharts supports hex colors)
                }

                // Get animation type
                const animationType = custom.animation === 'step' ? 'step' :
                                      custom.animation === 'linear' ? 'linear' :
                                      'monotone'; // smooth

                return (
                  <Line
                    key={lineKey}
                    type={animationType}
                    dataKey={lineKey}
                    stroke={strokeColor}
                    name={formulaLabel}
                    strokeWidth={custom.style_line_depth}
                    dot={false}
                    connectNulls
                  />
                );
              })}
          </>
        );
      }
    }

    // If no configured lines, show nothing
    return null;
  };

  return (
    <Card className="border-border relative">
      {/* Connectivity Indicator */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <div 
          className="relative group cursor-help"
          title={
            connectivity.status === 'good' 
              ? 'Good connection' 
              : connectivity.status === 'slow' 
              ? 'Slow connection' 
              : 'Offline'
          }
        >
          {/* Indicator Circle */}
          <div 
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              connectivity.status === 'good' 
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                : connectivity.status === 'slow' 
                ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse' 
                : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
            }`}
          />
          
          {/* Tooltip on hover */}
          <div className="absolute top-full right-0 mt-2 hidden group-hover:block">
            <div className="bg-popover text-popover-foreground text-xs px-3 py-2 rounded-md shadow-lg border border-border whitespace-nowrap">
              <div className="font-semibold mb-1">
                {connectivity.status === 'good' && 'Good Connection'}
                {connectivity.status === 'slow' && 'Slow Connection'}
                {connectivity.status === 'offline' && 'Offline'}
              </div>
              {connectivity.effectiveType && (
                <div className="text-muted-foreground">
                  Type: {connectivity.effectiveType}
                </div>
              )}
              {connectivity.downlink !== undefined && (
                <div className="text-muted-foreground">
                  Speed: {connectivity.downlink.toFixed(1)} Mbps
                </div>
              )}
              {connectivity.rtt !== undefined && (
                <div className="text-muted-foreground">
                  Latency: {connectivity.rtt}ms
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* View Mode Tabs - Switch between Default and Customize */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-wrap">
            <div className="relative flex items-start gap-2">
              <div className="relative flex-1">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "default" | "customize")}>
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="default" className="flex-1 sm:flex-none">
                      Default
                    </TabsTrigger>
                    <TabsTrigger 
                      value="customize" 
                      className="flex-1 sm:flex-none"
                      disabled={!isFeatureAvailable("customize")}
                    >
                      Customize
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {!isFeatureAvailable("customize") && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-popover px-2 py-1 rounded whitespace-nowrap mt-1">
                  <Lock className="h-3 w-3" />
                  Premium
                </div>
              )}
            </div>

            {/* Update Interval Tabs - Control refresh frequency */}
            <div className="relative flex items-start gap-2">
              <div className="relative flex-1">
                <Tabs value={updateInterval} onValueChange={(value) => setUpdateInterval(value as "15secs" | "1min")}>
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="15secs" className="flex-1 sm:flex-none text-xs sm:text-sm"
                      disabled={!isFeatureAvailable("fast_updates")}
                    >
                      15 secs
                    </TabsTrigger>
                    <TabsTrigger value="1min" className="flex-1 sm:flex-none text-xs sm:text-sm">
                      1 min
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {!isFeatureAvailable("fast_updates") && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-popover px-2 py-1 rounded whitespace-nowrap mt-1">
                  <Lock className="h-3 w-3" />
                  Pro
                </div>
              )}
            </div>

            {/* Time Mode Tabs - Switch between Current and Historical Data */}
            <div className="relative flex items-start gap-2">
              <div className="relative flex-1">
                <Tabs value={timeMode} onValueChange={(value) => setTimeMode(value as "current" | "date")}>
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="current" className="flex-1 sm:flex-none text-xs sm:text-sm">
                      Current
                    </TabsTrigger>
                    <TabsTrigger 
                      value="date" 
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                      disabled={!isFeatureAvailable("historical_data")}
                    >
                      Date
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {!isFeatureAvailable("historical_data") && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-popover px-2 py-1 rounded whitespace-nowrap mt-1">
                  <Lock className="h-3 w-3" />
                  Pro
                </div>
              )}
            </div>

            {/* Time Range Slider - Control data window display */}
            <div className="relative flex flex-col gap-2 w-full sm:w-48">
              <Label className="text-xs sm:text-sm font-medium">
                Time Range: {timeRange < 60 ? `${timeRange}m` : timeRange === 60 ? `1h` : `${Math.floor(timeRange / 60)}h`}
              </Label>
              <Slider
                min={30}
                max={360}
                step={30}
                value={[timeRange]}
                onValueChange={(value) => setTimeRange(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30m</span>
                <span>6h</span>
              </div>
            </div>
          </div>

          {/* Date/Time Picker - Only show when Date tab is selected */}
          {timeMode === "date" && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end p-4 bg-secondary rounded-lg">
              <div className="flex flex-col gap-2">
                <Label className="text-xs sm:text-sm font-medium">Select Date (Last 30 days)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto text-xs sm:text-sm"
                      disabled={historicalLoading}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setSelectedDate(date)}
                      disabled={(date) => {
                        // Disable dates older than 30 days
                        return date < thirtyDaysAgo || date > new Date();
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs sm:text-sm font-medium">Hour</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full sm:w-20 text-xs sm:text-sm h-10"
                  placeholder="HH"
                  disabled={historicalLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs sm:text-sm font-medium">Minute</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full sm:w-20 text-xs sm:text-sm h-10"
                  placeholder="MM"
                  disabled={historicalLoading}
                />
              </div>

              <Button
                onClick={() => fetchHistoricalData(selectedDate, selectedHour, selectedMinute)}
                disabled={historicalLoading || !selectedDate}
                className="w-full sm:w-auto text-xs sm:text-sm mt-6 sm:mt-0"
              >
                {historicalLoading ? (
                  <>
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  "View"
                )}
              </Button>
            </div>
          )}

          {/* Show error message if historical data fetch fails */}
          {timeMode === "date" && historicalError && (
            <div className="text-xs sm:text-sm text-destructive p-3 bg-destructive/10 rounded border border-destructive/20">
              <div className="font-semibold mb-1">Error loading historical data:</div>
              <div className="font-mono text-xs">{historicalError}</div>
            </div>
          )}

          {/* Show message when viewing historical data */}
          {timeMode === "date" && !historicalLoading && historicalData.length > 0 && selectedDate && (
            <div className="text-xs sm:text-sm text-muted-foreground p-2 bg-blue-500/10 rounded">
              Showing data from {selectedDate.toLocaleDateString('en-US')} at {selectedHour.padStart(2, '0')}:{selectedMinute.padStart(2, '0')} 
              <span className="text-blue-400"> (-1 hour)</span>
            </div>
          )}

          {/* Refresh Indicator */}
          {timeMode === "current" && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span>
                Updates every {updateInterval === "15secs" ? "15 seconds" : "1 minute"}
                {category === "brazilian-indices" ? " (B3 Market data)" : ""}
                {category === "us-indices" ? " (US Market data)" : ""}
                {category === "brazilian-currency" ? " (FX Market data)" : ""}
                {category === "commodities" ? " (24/5 CME data)" : ""}
              </span>
            </div>
          )}

          {/* Market Hours Information - For all categories */}
          {MARKET_HOURS[category] && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  marketOpen ? 'bg-green-500' : 'bg-amber-500'
                }`} />
                <span className="font-medium">
                  {marketOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
              <span className="hidden sm:inline text-border">•</span>
              <span>
                {MARKET_HOURS[category].openTime}-{MARKET_HOURS[category].closeTime}{MARKET_HOURS[category].timezone}
              </span>
              {!marketOpen && (
                <>
                  <span className="hidden sm:inline text-border">•</span>
                  <span className="text-amber-600 dark:text-amber-500">
                    Data updates paused
                  </span>
                </>
              )}
              <span className="hidden sm:inline text-border">•</span>
              <span>Market is closed on Saturdays and Sundays</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 md:p-6">
        <motion.div
          key={category}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Determine which data to display - real-time or historical */}
          {timeMode === "date" && historicalData.length === 0 && !historicalLoading && (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Clock className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-center">No data available for the selected date and time.</p>
              <p className="text-xs text-center mt-2">Try selecting a different date or time within the last 30 days.</p>
            </div>
          )}

          {!(timeMode === "date" && historicalData.length === 0 && !historicalLoading) && (
            <>
              {/* Responsive chart container with adaptive height */}
              <ResponsiveContainer 
                width="100%" 
                height={300}
                className="sm:hidden"
              >
                <LineChart 
                  data={timeMode === "date" ? (transformedHistoricalData.length > 0 ? transformedHistoricalData : historicalData) : (transformedData.length > 0 ? transformedData : data)} 
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              {renderBackgroundZones()}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "10px" }}
                interval={getXAxisInterval()}
                tickFormatter={(value) => {
                  // Format HH:MM:SS to HH:MM for display
                  const parts = value.split(':');
                  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value;
                }}
              />
              <YAxis 
                domain={yAxisDomain}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "10px" }}
                width={40}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: "11px" }}
                iconSize={10}
              />
              {renderChartLines()}
            </LineChart>
              </ResponsiveContainer>

              {/* Tablet view */}
              <ResponsiveContainer 
                width="100%" 
                height={400}
                className="hidden sm:block md:hidden"
              >
                <LineChart 
                  data={timeMode === "date" ? (transformedHistoricalData.length > 0 ? transformedHistoricalData : historicalData) : (transformedData.length > 0 ? transformedData : data)} 
              margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
            >
              {renderBackgroundZones()}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "11px" }}
                interval={getXAxisInterval()}
              />
              <YAxis 
                domain={yAxisDomain}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "11px" }}
                label={{ 
                  value: "% Movement", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: "11px" }
                }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {renderChartLines()}
            </LineChart>
              </ResponsiveContainer>

              {/* Desktop view */}
              <ResponsiveContainer 
                width="100%" 
                height={500}
                className="hidden md:block"
              >
                <LineChart data={timeMode === "date" ? (transformedHistoricalData.length > 0 ? transformedHistoricalData : historicalData) : (transformedData.length > 0 ? transformedData : data)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {renderBackgroundZones()}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                interval={getXAxisInterval()}
              />
              <YAxis 
                domain={yAxisDomain}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                label={{ 
                  value: "% Movement", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { fill: "hsl(var(--muted-foreground))" }
                }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {renderChartLines()}
            </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default ChartPanel;
