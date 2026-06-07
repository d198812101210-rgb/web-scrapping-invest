import { TooltipProps } from 'recharts';

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    name: string;
    color: string;
    payload?: Record<string, any>; // Full data object from LineChart
  }>;
  label?: string;
}

/**
 * Custom tooltip component that displays detailed information about portfolio items
 * Shows portfolio data only for items used in the hovered line's formula
 */
export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Get the full data object from the first payload item (all items share the same data object)
  const dataObject = payload[0]?.payload as Record<string, any> | undefined;

  // Filter out data entries from payload and get only chart lines (not __data entries)
  const lineEntries = payload.filter((entry) => !entry.dataKey?.endsWith('__data'));

  if (lineEntries.length === 0) {
    return null;
  }

  /**
   * Extract symbols from a formula string
   * Examples: "PETR4" -> ["PETR4"]
   *           "0.33×PETR4 + 0.33×USD/NZD + 0.33×VX" -> ["PETR4", "USD/NZD", "VX"]
   */
  const extractSymbolsFromFormula = (formulaStr: string): string[] => {
    const symbols: Set<string> = new Set();
    
    // Simple approach: split by '+' and extract symbol after each coefficient
    // Pattern matches: optional number/decimal followed by × or x, then captures the symbol
    const terms = formulaStr.split('+');
    
    terms.forEach(term => {
      // Match pattern: "0.33×PETR4" or "0.5xUSD/NZD"
      const match = term.match(/[×x]\s*([A-Za-z0-9\/\.\-]+)/);
      if (match && match[1]) {
        symbols.add(match[1].trim());
      } else {
        // Fallback for simple symbols without coefficient (e.g., just "PETR4")
        const simpleTerm = term.trim();
        if (simpleTerm && /^[A-Za-z0-9\/\.\-]+$/.test(simpleTerm)) {
          symbols.add(simpleTerm);
        }
      }
    });
    
    return Array.from(symbols);
  };

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-lg p-3 w-max"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
        marginTop: '0px',
      }}
    >
      {/* Time/Label */}
      <div className="text-muted-foreground text-xs font-semibold mb-2">
        {label}
      </div>

      {/* Lines/Items */}
      <div className="space-y-1">
        {lineEntries.map((entry, index) => {
          // Extract symbols from the formula string (entry.name contains the formula like "0.33×PETR4 + 0.33×USD/NZD...")
          const formulaSymbols = extractSymbolsFromFormula(entry.name || '');
          
          // Get only the portfolio items that are part of this line's formula
          const portfolioItems: any[] = [];
          Object.keys(dataObject || {}).forEach(key => {
            if (key.endsWith('__data')) {
              const item = dataObject[key];
              if (item) {
                const itemSymbol = item.symbol || item.name;
                // Include if no symbols extracted (simple case) or if symbol is in the formula
                if (formulaSymbols.length === 0 || formulaSymbols.includes(itemSymbol)) {
                  portfolioItems.push(item);
                }
              }
            }
          });

          // Build inline display with JSX elements showing portfolio data
          const buildMetadataElements = () => {
            const elements: (string | JSX.Element)[] = [];

            // Display portfolio items with their data (excluding timestamps)
            portfolioItems.forEach((item, itemIdx) => {
              if (item && typeof item === 'object') {
                // Format: "Symbol (Name): field1=value1, field2=value2..."
                const symbol = item.symbol || item.name || 'Unknown';
                const name = item.name ? ` (${item.name})` : '';
                
                const itemData: string[] = [];
                
                // Add all fields except timestamps, id, and type
                if (item.last_price !== undefined && item.last_price !== null) {
                  itemData.push(`Last: ${typeof item.last_price === 'number' ? item.last_price.toFixed(2) : 'N/A'}`);
                }
                if (item.bid_price !== undefined && item.bid_price !== null) {
                  itemData.push(`Bid: ${typeof item.bid_price === 'number' ? item.bid_price.toFixed(2) : 'N/A'}`);
                }
                if (item.ask_price !== undefined && item.ask_price !== null) {
                  itemData.push(`Ask: ${typeof item.ask_price === 'number' ? item.ask_price.toFixed(2) : 'N/A'}`);
                }
                if (item.open_price !== undefined && item.open_price !== null) {
                  itemData.push(`Open: ${typeof item.open_price === 'number' ? item.open_price.toFixed(2) : 'N/A'}`);
                }
                if (item.high_price !== undefined && item.high_price !== null) {
                  itemData.push(`High: ${typeof item.high_price === 'number' ? item.high_price.toFixed(2) : 'N/A'}`);
                }
                if (item.low_price !== undefined && item.low_price !== null) {
                  itemData.push(`Low: ${typeof item.low_price === 'number' ? item.low_price.toFixed(2) : 'N/A'}`);
                }
                if (item.change !== undefined && item.change !== null) {
                  itemData.push(`Change: ${typeof item.change === 'number' ? item.change.toFixed(2) : 'N/A'}`);
                }
                if (item.volume !== undefined && item.volume !== null) {
                  itemData.push(`Volume: ${item.volume || 'N/A'}`);
                }
                
                // Add change_percent with color coding
                if (item.change_percent !== undefined && item.change_percent !== null) {
                  const changePercent = typeof item.change_percent === 'number' ? item.change_percent.toFixed(2) : 'N/A';
                  const isPositive = typeof item.change_percent === 'number' && item.change_percent >= 0;
                  itemData.push(`<span style="color: ${isPositive ? '#10b981' : '#ef4444'}">Change %: ${changePercent}%</span>`);
                }
                
                if (itemData.length > 0) {
                  const dataStr = itemData.join(' | ');
                  elements.push(`${symbol}${name}: ${dataStr}`);
                }
              }
            });

            return elements.map((elem, idx) => {
              // Handle HTML strings for colored change_percent
              if (typeof elem === 'string' && elem.includes('<span')) {
                // Create a container for HTML rendering
                const match = elem.match(/^(.+?): (.+)$/);
                if (match) {
                  const labelText = match[1];
                  const data = match[2];
                  return (
                    <div key={idx} className="text-xs mb-1">
                      <span className="font-semibold">{labelText}</span>
                      <span className="text-muted-foreground ml-1">
                        {data.split(' <span').map((part, pidx) => {
                          if (pidx === 0) return part;
                          const colorMatch = part.match(/style="color: ([^"]+)">([^<]+)<\/span>/);
                          if (colorMatch) {
                            return (
                              <span key={pidx} style={{ color: colorMatch[1] }}>
                                {' '}| {colorMatch[2]}
                              </span>
                            );
                          }
                          return <span key={pidx}>{part}</span>;
                        })}
                      </span>
                    </div>
                  );
                }
              }
              return (
                <div key={idx} className="text-xs">
                  {elem}
                </div>
              );
            });
          };

          const metadataElements = portfolioItems.length > 0 ? buildMetadataElements() : null;

          return (
            <div key={index} className="text-sm">
              <span
                className="font-semibold"
                style={{ color: entry.color }}
              >
                {entry.name}:
              </span>
              <div className="text-muted-foreground ml-2 mt-1">
                {metadataElements ? (
                  metadataElements
                ) : (
                  <div className="text-xs">
                    <span>Value: </span>
                    <span className="text-foreground font-medium">{entry.value?.toFixed?.(3)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};