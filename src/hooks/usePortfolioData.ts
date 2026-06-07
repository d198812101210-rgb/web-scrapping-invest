import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PortfolioItem {
  name: string;
  symbol: string;
  type?: string;
  last_price?: number;
  bid_price?: number;
  ask_price?: number;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  change?: number;
  change_percent?: number;
  volume?: string;
  time?: string;
  scraped_at: string;
}

export interface PortfolioDataPoint {
  time: string;
  [key: string]: number | string; // symbol name -> change_percent value
}

/**
 * Hook to fetch portfolio items data from Supabase based on time range
 * @param rangeMinutes - Time range in minutes to fetch data for (e.g., 30, 60, 240, 1440)
 * @param refreshInterval - Auto-refresh interval in milliseconds (default: 5 minutes)
 */
export const usePortfolioData = (
  rangeMinutes: number = 30, 
  refreshInterval: number = 300000
) => {
  const [data, setData] = useState<PortfolioDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPortfolioItems, setAllPortfolioItems] = useState<PortfolioItem[]>([]);

  const fetchPortfolioHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate time range
      const now = new Date();
      const startTime = new Date(now.getTime() - rangeMinutes * 60 * 1000);

      // Fetch portfolio data from Supabase with time range
      const { data: portfolioData, error: fetchError } = await supabase
        .from('portfolio_items')
        .select('*')
        .gte('scraped_at', startTime.toISOString())
        .lte('scraped_at', now.toISOString())
        .order('scraped_at', { ascending: true });

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }
      
      if (!portfolioData || portfolioData.length === 0) {
        setData([]);
        setAllPortfolioItems([]);
        setLoading(false);
        return;
      }

      // Store all items for reference
      setAllPortfolioItems(portfolioData);

      // Group data by timestamp
      const groupedData = new Map<string, PortfolioDataPoint>();

      portfolioData.forEach((item: any) => {
        const timestamp = new Date(item.scraped_at);
        // Include seconds to preserve 15-second granularity from scraper
        // This prevents 4 data points per minute from collapsing into 1
        const timeKey = timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        if (!groupedData.has(timeKey)) {
          groupedData.set(timeKey, { time: timeKey });
        }

        const dataPoint = groupedData.get(timeKey)!;
        
        // Use symbol or name as the key, prefer symbol
        const key = item.symbol || item.name;
        if (key) {
          dataPoint[key] = item.change_percent || 0;
          // Store full item data for tooltip
          dataPoint[`${key}__data`] = item;
        }
      });

      // Convert map to array and sort by time
      const transformedData = Array.from(groupedData.values()).sort((a, b) => {
        const timeA = a.time as string;
        const timeB = b.time as string;
        return timeA.localeCompare(timeB);
      });

      setData(transformedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPortfolioHistory();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchPortfolioHistory();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [rangeMinutes, refreshInterval]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchPortfolioHistory,
    allPortfolioItems
  };
};