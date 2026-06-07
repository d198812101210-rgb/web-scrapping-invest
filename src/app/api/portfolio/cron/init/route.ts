import { NextRequest, NextResponse } from 'next/server';
import { startPortfolioCron, getCronStatus } from '@/api/jobs/portfolioCron';

/**
 * Initialize the portfolio cron job
 * GET /api/portfolio/cron/init
 * 
 * This endpoint starts the portfolio cron job.
 * Should be called once when the server starts.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const status = startPortfolioCron();
    
    return NextResponse.json(
      {
        success: true,
        message: 'Portfolio cron job initialized successfully',
        status,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize cron job:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initialize portfolio cron job',
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}