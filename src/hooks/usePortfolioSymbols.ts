import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PortfolioItem {
  symbol: string;
  name: string;
}

/**
 * Hook to fetch all item types/symbols from the database
 * Returns a list of unique item types with symbol and name for use in formula dropdowns
 * Queries the item_types table instead of deduplicating portfolio_items
 */
export const usePortfolioSymbols = () => {
  return useQuery({
    queryKey: ["portfolio-symbols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_types")
        .select("symbol, name")
        .not("symbol", "is", null)
        .not("symbol", "eq", "")
        .order("symbol");

      if (error) throw error;

      // Extract symbols and names, return sorted array
      const items = data
        ?.map((item) => ({
          symbol: item.symbol?.trim(),
          name: item.name?.trim(),
        }))
        .filter((item) => item.symbol && item.symbol !== "") as PortfolioItem[];

      return items?.sort((a, b) => a.symbol.localeCompare(b.symbol)) || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};