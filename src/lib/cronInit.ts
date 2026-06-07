/**
 * Cron Job Initialization
 * This module initializes the portfolio cron job on app startup
 */

let cronInitialized = false;

export async function initializeCron() {
  // Prevent multiple initializations
  if (cronInitialized) {
    console.log('Cron job already initialized');
    return;
  }

  try {
    // Only initialize in development or when not on serverless platforms
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing cron job in development mode...');
      
      // Dynamically import to avoid issues during build
      const { startPortfolioCron } = await import('@/api/jobs/portfolioCron');
      const status = startPortfolioCron();
      
      console.log('✅ Portfolio cron job started:', status);
      cronInitialized = true;
    } else {
      console.log('Skipping cron initialization in production. Use /api/portfolio/cron/init endpoint or external scheduler.');
    }
  } catch (error) {
    console.error('Failed to initialize cron job:', error);
    cronInitialized = false;
  }
}