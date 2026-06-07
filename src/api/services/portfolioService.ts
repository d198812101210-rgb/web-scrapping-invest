import { supabaseAdmin } from './supabaseClient';

/**
 * Service for managing portfolio data in Supabase
 */
class PortfolioService {
  /**
   * Upsert item types to the database
   * Checks if symbol exists, if not creates new item type
   */
  async upsertItemTypes(portfolioItems: any[]): Promise<{
    success: boolean;
    createdCount: number;
    skippedCount: number;
    data?: any;
  }> {
    if (!portfolioItems || portfolioItems.length === 0) {
      return { success: true, createdCount: 0, skippedCount: 0 };
    }

    try {
      // Get unique item types
      const uniqueTypes = new Map();
      portfolioItems.forEach((item) => {
        if (item.symbol && item.name && item.type) {
          uniqueTypes.set(item.symbol, {
            name: item.name,
            symbol: item.symbol,
            type: item.type
          });
        }
      });

      if (uniqueTypes.size === 0) {
        console.log('No valid item types to upsert');
        return { success: true, createdCount: 0, skippedCount: 0 };
      }

      // Get existing symbols from item_types table
      const { data: existingTypes, error: fetchError } = await supabaseAdmin
        .from('item_types')
        .select('symbol');

      if (fetchError) {
        throw new Error(`Failed to fetch existing item types: ${fetchError.message}`);
      }

      const existingSymbols = new Set(existingTypes?.map((t: any) => t.symbol) || []);

      // Filter out items that already exist
      const newItems = Array.from(uniqueTypes.values()).filter(
        (item: any) => !existingSymbols.has(item.symbol)
      );

      if (newItems.length === 0) {
        console.log(`All ${uniqueTypes.size} item types already exist in database`);
        return { success: true, createdCount: 0, skippedCount: uniqueTypes.size };
      }

      // Insert new item types
      const { data, error } = await supabaseAdmin
        .from('item_types')
        .insert(newItems);

      if (error) {
        throw new Error(`Failed to upsert item types: ${error.message}`);
      }

      console.log(`Created ${newItems.length} new item types, skipped ${existingSymbols.size} existing`);
      return {
        success: true,
        createdCount: newItems.length,
        skippedCount: existingSymbols.size,
        data
      };
    } catch (error) {
      console.error('Error in upsertItemTypes:', error);
      throw error;
    }
  }

  /**
   * Saves portfolio items to the database
   */
  async savePortfolioItems(portfolioItems: any[]): Promise<{ success: boolean; data?: any }> {
    if (!portfolioItems || portfolioItems.length === 0) {
      throw new Error('No portfolio items to save');
    }

    console.log(`Saving ${portfolioItems.length} portfolio items to database...`);

    try {
      // First, upsert item types
      await this.upsertItemTypes(portfolioItems);

      // Prepare data for insertion
      const dataToInsert = portfolioItems.map((item) => ({
        name: item.name,
        symbol: item.symbol,
        type: item.type,
        last_price: item.last,
        bid_price: item.bid,
        ask_price: item.ask,
        open_price: item.open,
        high_price: item.high,
        low_price: item.low,
        change: item.change,
        change_percent: item.changePercent,
        volume: item.volume,
        time: item.time,
        scraped_at: item.scrapedAt
      }));

      // Insert data into the portfolio_items table
      const { data, error } = await supabaseAdmin
        .from('portfolio_items')
        .insert(dataToInsert);

      if (error) {
        throw new Error(`Failed to save portfolio items: ${error.message}`);
      }

      console.log(`Successfully saved portfolio items to database`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in savePortfolioItems:', error);
      throw error;
    }
  }

  /**
   * Gets the latest portfolio items from the database
   */
  async getLatestPortfolioItems(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('portfolio_items')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get portfolio items: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLatestPortfolioItems:', error);
      throw error;
    }
  }

  /**
   * Cleans up old portfolio data
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<{ success: boolean; data?: any }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabaseAdmin
        .from('portfolio_items')
        .delete()
        .lt('scraped_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to clean up old portfolio data: ${error.message}`);
      }

      console.log(`Successfully cleaned up portfolio data older than ${daysToKeep} days`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in cleanupOldData:', error);
      throw error;
    }
  }
}

export const portfolioService = new PortfolioService();