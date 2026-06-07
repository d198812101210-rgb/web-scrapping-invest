/**
 * Type definitions for Customization data
 */

export type ChartCategory = "brazil-indices" | "us-indices" | "commodities" | "currency";

export interface TabCustomization {
  id: string;
  user_id: string;
  category: ChartCategory;
  tab_label: string;
  created_at: string;
  updated_at: string;
}

export interface TabCustomizationInput {
  category: ChartCategory;
  tab_label: string;
}

export interface FormulaItem {
  item: string; // Name of the item (e.g., "Bovespa", "S&P 500", "Gold")
  weight: number; // Weight for weighted calculation
}

export interface CustomizationFormula {
  items: FormulaItem[]; // Array of items and their weights
}

export interface Customization {
  id: string;
  user_id: string;
  category: ChartCategory;
  line_number: number; // 1-4
  formula: CustomizationFormula;
  style_color: string; // Hex color
  style_line_depth: number; // 1-5
  animation: "smooth" | "linear" | "step";
  created_at: string;
  updated_at: string;
}

export interface CustomizationInput {
  category: ChartCategory;
  line_number: number;
  formula: CustomizationFormula;
  style_color: string;
  style_line_depth: number;
  animation: "smooth" | "linear" | "step";
}