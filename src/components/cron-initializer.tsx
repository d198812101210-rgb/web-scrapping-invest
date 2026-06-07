/**
 * Cron Job Initializer Component
 * This server component initializes the cron job on app startup
 */

import { initializeCron } from '@/lib/cronInit';

export async function CronInitializer() {
  // Initialize cron on component render (server-side only)
  await initializeCron();
  
  // This component doesn't render anything
  return null;
}