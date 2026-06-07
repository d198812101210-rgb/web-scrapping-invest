import { NextRequest, NextResponse } from 'next/server';
import { getCronStatus } from '@/api/jobs/portfolioCron';

/**
 * Get portfolio cron job status
 * GET /api/portfolio/cron/status
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const status = getCronStatus();

    return NextResponse.json(
      {
        success: true,
        ...status,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting cron status:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}