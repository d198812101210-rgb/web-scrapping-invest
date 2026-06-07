/**
 * Portfolio Scraper for investing.com data
 * 
 * Migrated from Express backend scraper.
 * Requires Puppeteer and Chrome to be installed on the system.
 */

import puppeteerCore from 'puppeteer-core';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let puppeteer: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  puppeteer = require('puppeteer');
} catch {
  console.warn('Full puppeteer package not available, will use puppeteer-core only');
}

/**
 * Finds the Chrome executable path based on the operating system
 */
function findChromeExecutable(): string {
  try {
    // Common Chrome paths for different operating systems
    const chromePaths = [
      // Windows paths
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      // macOS paths
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      // Linux paths
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];

    // Try to find Chrome using the common paths
    for (const chromePath of chromePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`Found Chrome at: ${chromePath}`);
        return chromePath;
      }
    }

    // If not found in common paths, try to detect using command
    try {
      // For Windows
      if (process.platform === 'win32') {
        try {
          const output = execSync('where chrome').toString().trim().split('\n')[0];
          if (output && fs.existsSync(output)) {
            console.log(`Found Chrome using 'where' command: ${output}`);
            return output;
          }
        } catch {
          // continue
        }

        // Try Edge as fallback
        try {
          const edgeOutput = execSync('where msedge').toString().trim().split('\n')[0];
          if (edgeOutput && fs.existsSync(edgeOutput)) {
            console.log(`Found Edge as fallback: ${edgeOutput}`);
            return edgeOutput;
          }
        } catch {
          // continue
        }
      }
      // For macOS and Linux
      else {
        const output = execSync('which google-chrome || which chromium-browser || which chromium')
          .toString()
          .trim();
        if (output && fs.existsSync(output)) {
          console.log(`Found Chrome using 'which' command: ${output}`);
          return output;
        }
      }
    } catch {
      console.log('Could not detect Chrome using command');
    }

    // If we still can't find Chrome, throw an error
    throw new Error('Chrome executable not found. Please install Chrome or specify the correct path.');
  } catch (error) {
    console.error('Error finding Chrome executable:', (error as Error).message);
    throw error;
  }
}

/**
 * Scrapes portfolio data from investing.com
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function scrapePortfolio(): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any = null;

  try {
    console.log('Starting portfolio scraper...');

    // Load cookies - either from file or environment variable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cookies: any[] = [];
    const isCloudEnvironment = process.env.RENDER || process.env.CLOUD_ENV;

    if (isCloudEnvironment && process.env.INVESTING_COOKIES) {
      // In cloud environments, we can store cookies in an environment variable
      console.log('Loading cookies from environment variable');
      try {
        cookies = JSON.parse(process.env.INVESTING_COOKIES);
        console.log(`Loaded ${cookies.length} cookies from environment variable`);
      } catch (err) {
        console.error('Error parsing cookies from environment variable:', (err as Error).message);
        throw new Error('Invalid cookie format in environment variable');
      }
    } else {
      // Try to load from file in local environment
      try {
        const cookiesPath = path.join(process.cwd(), 'cookie.json');
        if (fs.existsSync(cookiesPath)) {
          const cookiesString = fs.readFileSync(cookiesPath, 'utf8');
          cookies = JSON.parse(cookiesString);
          console.log(`Loaded ${cookies.length} cookies from file`);
        } else {
          console.warn('Cookie file not found at', cookiesPath);
        }
      } catch (error) {
        console.error('Error loading cookies from file:', (error as Error).message);
      }
    }

    // Find Chrome executable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const launchOptions: any = {
      headless: 'new',
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--mute-audio'
      ],
      ignoreHTTPSErrors: true,
      timeout: 120000
    };

    console.log('Running in headless mode');

    try {
      const chromePath = findChromeExecutable();
      console.log(`Using Chrome at: ${chromePath}`);
      launchOptions.executablePath = chromePath;
    } catch (error) {
      console.warn(`Warning: ${(error as Error).message}`);
      console.warn('Falling back to puppeteer-core default browser finding mechanism...');

      // If we're on Windows, try to use the default Chrome installation
      if (process.platform === 'win32') {
        const possiblePaths = [
          (process.env['PROGRAMFILES(X86)'] || '') + '\\Google\\Chrome\\Application\\chrome.exe',
          (process.env['PROGRAMFILES'] || '') + '\\Google\\Chrome\\Application\\chrome.exe',
          (process.env['LOCALAPPDATA'] || '') + '\\Google\\Chrome\\Application\\chrome.exe'
        ];

        for (const browserPath of possiblePaths) {
          if (browserPath && fs.existsSync(browserPath)) {
            console.log(`Found Chrome at: ${browserPath}`);
            launchOptions.executablePath = browserPath;
            break;
          }
        }
      }
    }

    if (isCloudEnvironment) {
      console.log('Detected cloud environment, attempting to use puppeteer with bundled Chromium');

      if (puppeteer) {
        delete launchOptions.executablePath;
        console.log('Cloud environment browser options:', JSON.stringify(launchOptions, null, 2));
        browser = await puppeteer.launch(launchOptions);
        console.log('Successfully launched browser using puppeteer in cloud environment');
      } else {
        console.warn('Full puppeteer package not available in cloud environment, falling back to puppeteer-core');
        console.log('Launching browser with puppeteer-core in cloud environment');
        try {
          browser = await puppeteerCore.launch(launchOptions);
          console.log('Successfully launched browser using puppeteer-core in cloud environment');
        } catch (error) {
          console.error(`Failed to launch browser in cloud environment: ${(error as Error).message}`);
          throw new Error(`Failed to launch browser in cloud environment: ${(error as Error).message}`);
        }
      }
    } else {
      // For local environments, try puppeteer-core first, then fall back to full puppeteer
      console.log('Launching browser with options:', JSON.stringify(launchOptions, null, 2));
      try {
        browser = await puppeteerCore.launch(launchOptions);
        console.log('Successfully launched browser using puppeteer-core');
      } catch (error) {
        console.warn(`Failed to launch browser with puppeteer-core: ${(error as Error).message}`);

        if (puppeteer) {
          console.log('Falling back to full puppeteer package...');
          delete launchOptions.executablePath;
          browser = await puppeteer.launch(launchOptions);
          console.log('Successfully launched browser using full puppeteer');
        } else {
          throw new Error('Could not launch browser with puppeteer-core and full puppeteer is not available');
        }
      }
    }

    const page = await browser.newPage();

    // Set cookies if available
    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }

    // Navigate to the portfolio page
    console.log('Navigating to investing.com portfolio page...');
    try {
      await page.goto('https://www.investing.com/portfolio/', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      });

      console.log('Initial page load complete');

      // Try multiple selectors to find the watchlist content
      const selectors = [
        '.js-watchlist-content',
        '.watchlist-content-wrapper',
        '.portfolio-table',
        'table.genTbl.closedTbl.watchlistTbl',
        '.portfolio-wrapper'
      ];

      let contentFound = false;
      for (const selector of selectors) {
        try {
          console.log(`Trying to wait for selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 10000 });
          console.log(`Found content with selector: ${selector}`);
          contentFound = true;
          break;
        } catch {
          console.log(`Selector ${selector} not found, trying next...`);
        }
      }

      if (!contentFound) {
        console.log('Could not find specific selectors, continuing with available content');
      }

      // Wait a bit more to ensure dynamic content is loaded
      console.log('Waiting for additional content to load...');
      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch {
        console.warn('Timeout error');
      }
    } catch (error) {
      console.warn(`Navigation issue: ${(error as Error).message}`);
      console.log('Attempting to continue with available content');
    }

    console.log('Extracting page content...');

    // Get the page content
    const content = await page.content();

    // Save debugging information if in debug mode
    const isDebugMode = process.env.DEBUG_SCRAPER === 'true';
    if (isDebugMode) {
      try {
        const debugHtmlPath = path.join(process.cwd(), 'debug_portfolio.html');
        fs.writeFileSync(debugHtmlPath, content);
        console.log(`Saved debug HTML to ${debugHtmlPath}`);

        const debugScreenshotPath = path.join(process.cwd(), 'debug_portfolio.png');
        await page.screenshot({ path: debugScreenshotPath, fullPage: true });
        console.log(`Saved debug screenshot to ${debugScreenshotPath}`);
      } catch (error) {
        console.warn(`Error saving debug files: ${(error as Error).message}`);
      }
    }

    // Parse with cheerio
    const $ = cheerio.load(content);

    // Extract data from the watchlist table
    return parseWatchlistData($);
  } catch (error) {
    console.error('Error scraping portfolio:', (error as Error).message);
    if ((error as Error).stack) console.error((error as Error).stack);
    throw error;
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

/**
 * Parses watchlist data from the page content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWatchlistData($: any): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolioItems: any[] = [];

  // Try multiple selectors to find the watchlist table
  const selectors = [
    '.js-watchlist-content table',
    '.watchlist-content-wrapper table',
    '.portfolio-table',
    'table.genTbl.closedTbl.watchlistTbl'
  ];

  let watchlistTable = null;
  for (const selector of selectors) {
    const table = $(selector);
    if (table.length > 0) {
      watchlistTable = table;
      console.log(`Found watchlist table using selector: ${selector}`);
      break;
    }
  }

  if (!watchlistTable || watchlistTable.length === 0) {
    // Log the HTML structure to help debug
    console.log('HTML structure of the page:');
    const bodyHtml = $('body').html();
    console.log((bodyHtml || '').substring(0, 500) + '...');
    console.log('Tables found on the page:');
    $('table').each((i: number, table: any) => {
      console.log(`Table ${i} classes: ${$(table).attr('class')}`);
    });
    throw new Error('Watchlist table not found on the page');
  }

  // Find all rows in the table body
  const rows = watchlistTable.find('tbody tr');

  console.log(`Found ${rows.length} rows in the watchlist table`);

  // If no rows found, try a different approach
  if (rows.length === 0) {
    console.log('No rows found in tbody, trying direct tr selection');
    const directRows = watchlistTable.find('tr');
    console.log(`Found ${directRows.length} rows with direct selection`);

    // Process direct rows
    directRows.each((index: number, row: any) => {
      processRow($, $(row), index, portfolioItems);
    });
  } else {
    // Process rows from tbody
    rows.each((index: number, row: any) => {
      processRow($, $(row), index, portfolioItems);
    });
  }

  return portfolioItems;
}

/**
 * Process a single row from the watchlist table
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processRow($: any, $row: any, index: number, portfolioItems: any[]): void {
  try {
    // Skip header rows or empty rows
    if ($row.hasClass('header') || $row.find('td').length === 0) {
      return;
    }

    // Extract data from cells
    const cells = $row.find('td');

    // Debug cell contents for first few rows
    if (index === 0 || index === 1) {
      console.log(`Row ${index} cell count:`, cells.length);
      cells.each((i: number, cell: any) => {
        console.log(`Cell ${i} content: ${$(cell).text().trim()}`);
      });
    }

    // Based on the HTML structure from investing.com:
    // Cell 2: Name (PETROBRAS PN or USD/NZD)
    // Cell 3: Symbol (PETR4 or empty for some items)
    // Cell 4: Type/Exchange (BVMF or FX)
    // Cell 5: Last price (30.19)
    // Cell 6: Bid (30.12)
    // Cell 7: Ask (30.20)
    // Cell 10: Open (30.52)
    // Cell 12: High (30.72)
    // Cell 13: Low (30.11)
    // Cell 14: Change (+0.34)
    // Cell 15: Change % (+1.14%)
    // Cell 16: Volume (39.95M or -)
    // Cell 18: Time (15:58:59)

    // Extract name from cell 2
    const nameCell = $(cells[2]);
    const nameLink = nameCell.find('a');
    const name = nameLink.length > 0 ? nameLink.text().trim() : nameCell.text().trim();

    // Get the symbol
    let symbol = '';
    const symbolCell = $(cells[3]);
    const symbolLink = symbolCell.find('a');

    if (symbolLink.length > 0 && symbolLink.text().trim()) {
      symbol = symbolLink.text().trim();
    } else {
      symbol = name;
    }

    // Get the type/exchange
    const type = $(cells[4]).text().trim();

    // Extract other data based on the actual structure
    const last = extractNumericValue($(cells[5]).text());
    const bid = extractNumericValue($(cells[6]).text());
    const ask = extractNumericValue($(cells[7]).text());
    const open = extractNumericValue($(cells[10]).text());
    const high = extractNumericValue($(cells[12]).text());
    const low = extractNumericValue($(cells[13]).text());
    const change = extractNumericValue($(cells[14]).text());
    const changePercent = extractPercentValue($(cells[15]).text());

    // Handle volume which might be "-" for some items
    const volumeText = $(cells[16]).text().trim();
    const volume = volumeText !== '-' && volumeText !== '' ? volumeText : null;

    // Handle time which might be empty for some items
    const time = $(cells[18]).text().trim() || null;

    // Only add if we have at least a name/symbol and some price data
    if ((name || symbol) && (last || bid || ask)) {
      const itemData = {
        name,
        symbol,
        type: type || null,
        last,
        bid,
        ask,
        open,
        high,
        low,
        change,
        changePercent,
        volume,
        time,
        scrapedAt: new Date().toISOString()
      };

      portfolioItems.push(itemData);

      // Log the extracted item for debugging
      console.log(`Extracted item: ${symbol} - Last: ${last}, High: ${high}, Low: ${low}`);
    }
  } catch (error) {
    console.error(`Error parsing row ${index}:`, (error as Error).message);
  }
}

/**
 * Extracts numeric value from text
 */
function extractNumericValue(text: string): number | null {
  if (!text) return null;

  const value = text.trim().replace(/,/g, '');
  const parsed = parseFloat(value);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Extracts percentage value from text
 */
function extractPercentValue(text: string): number | null {
  if (!text) return null;

  const value = text.trim().replace(/%/g, '').replace(/\+/g, '');
  const parsed = parseFloat(value);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats the scraped data for console output
 */
export function displayPortfolioItems(portfolioItems: any[]): void {
  console.log('\n' + '='.repeat(140));
  console.log('PORTFOLIO DATA');
  console.log('='.repeat(140));
  console.log(
    'Name'.padEnd(20) +
      'Symbol'.padEnd(15) +
      'Type'.padEnd(10) +
      'Last'.padStart(10) +
      'Bid'.padStart(10) +
      'Ask'.padStart(10) +
      'Open'.padStart(10) +
      'High'.padStart(10) +
      'Low'.padStart(10) +
      'Chg.'.padStart(10) +
      'Chg. %'.padStart(10) +
      'Vol.'.padStart(10) +
      'Time'.padStart(10)
  );
  console.log('-'.repeat(140));

  portfolioItems.forEach((item) => {
    const changePercentStr =
      item.changePercent !== null
        ? (item.changePercent > 0 ? '+' : '') + item.changePercent.toFixed(2) + '%'
        : 'N/A';

    const formatNumber = (num: any) => {
      if (num === null || num === undefined) return 'N/A'.padStart(10);
      return num
        .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        .padStart(10);
    };

    console.log(
      (item.name || 'N/A').padEnd(20) +
        (item.symbol || 'N/A').padEnd(15) +
        (item.type || 'N/A').padEnd(10) +
        formatNumber(item.last) +
        formatNumber(item.bid) +
        formatNumber(item.ask) +
        formatNumber(item.open) +
        formatNumber(item.high) +
        formatNumber(item.low) +
        (item.change ? (item.change > 0 ? '+' : '') + formatNumber(item.change) : 'N/A'.padStart(10)) +
        changePercentStr.padStart(10) +
        (item.volume || 'N/A').padStart(10) +
        (item.time || 'N/A').padStart(10)
    );
  });

  console.log('='.repeat(140));
  console.log(`Total items: ${portfolioItems.length}`);
  console.log(`Scraped at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(140) + '\n');
}