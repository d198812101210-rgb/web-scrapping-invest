import cron from 'node-cron';
import { scrapePortfolio } from '../scrapers/portfolioScraper';
import { portfolioService } from '../services/portfolioService';

/**
 * In-memory cron status tracking
 * Uses node-cron for reliable job scheduling
 */

interface CronStatus {
  name: string;
  schedule: string;
  description: string;
  lastRun?: string;
  lastRunDuration?: number;
  nextRun?: string;
  status: 'active' | 'inactive' | 'running' | 'error';
  errorMessage?: string;
  runCount: number;
}

let cronStatus: CronStatus = {
  name: 'Portfolio Data Scraper',
  schedule: '*/15 * * * * *',
  description: 'Scrapes portfolio data every 15 seconds',
  status: 'inactive',
  runCount: 0
};

let isRunning = false;
let cronJob: cron.ScheduledTask | null = null;

/**
 * Sets up and starts the portfolio cron job
 * Uses node-cron to run every 15 seconds
 */
export function startPortfolioCron(): CronStatus {
  if (cronJob) {
    console.log('Cron job already running');
    return cronStatus;
  }

  cronStatus.status = 'active';
  cronStatus.lastRun = undefined;

  // Schedule job every 15 seconds using node-cron
  // Format: second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) weekday(0-6)
  cronJob = cron.schedule('*/15 * * * * *', async () => {
    await executePortfolioCronJob();
  }, {
    scheduled: true,
    runOnInit: false
  });

  console.log('Portfolio cron job started with node-cron');
  return cronStatus;
}

/**
 * Stops the cron job
 */
export function stopPortfolioCron(): CronStatus {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }

  cronStatus.status = 'inactive';
  console.log('Portfolio cron job stopped');
  return cronStatus;
}

/**
 * Executes the portfolio cron job
 */
async function executePortfolioCronJob(): Promise<void> {
  if (isRunning) {
    console.log('Cron job already running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Running portfolio cron job...`);
  cronStatus.status = 'running';

  try {
    // Scrape the data
    const portfolioItems = await scrapePortfolio();
    console.log(`Scraped ${portfolioItems.length} portfolio items`);

    // Save to database
    await portfolioService.savePortfolioItems(portfolioItems);
    console.log(`Successfully saved portfolio data to database`);

    // Clean up old data (keep last 7 days)
    await portfolioService.cleanupOldData(7);

    // Update status
    const duration = Date.now() - startTime;
    cronStatus.lastRun = timestamp;
    cronStatus.lastRunDuration = duration;
    cronStatus.status = 'active';
    cronStatus.runCount++;
    cronStatus.errorMessage = undefined;

    console.log(`Cron job completed in ${duration}ms`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${timestamp}] Portfolio cron job failed:`, errorMessage);

    cronStatus.status = 'error';
    cronStatus.errorMessage = errorMessage;
  } finally {
    isRunning = false;
  }
}

/**
 * Gets the current cron status
 */
export function getCronStatus(): CronStatus {
  return { ...cronStatus };
}

/**
 * Triggers a manual portfolio scrape
 */
export async function triggerManualRun(): Promise<{
  success: boolean;
  message: string;
  duration?: number;
}> {
  if (isRunning) {
    return {
      success: false,
      message: 'Cron job is already running. Please wait for it to complete.'
    };
  }

  console.log('Manual portfolio scrape triggered');
  const startTime = Date.now();

  try {
    const portfolioItems = await scrapePortfolio();
    await portfolioService.savePortfolioItems(portfolioItems);

    const duration = Date.now() - startTime;
    cronStatus.lastRun = new Date().toISOString();
    cronStatus.lastRunDuration = duration;
    cronStatus.runCount++;

    return {
      success: true,
      message: 'Manual portfolio scrape completed successfully',
      duration
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Manual portfolio scrape failed:', errorMessage);

    cronStatus.errorMessage = errorMessage;

    return {
      success: false,
      message: `Manual scrape failed: ${errorMessage}`
    };
  }
}

/**
 * Resets the cron status (for testing)
 */
export function resetCronStatus(): void {
  cronStatus = {
    name: 'Portfolio Data Scraper',
    schedule: '*/15 * * * * *',
    description: 'Scrapes portfolio data every 15 seconds',
    status: 'inactive',
    runCount: 0
  };
}