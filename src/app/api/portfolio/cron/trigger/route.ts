import { NextRequest, NextResponse } from 'next/server';
import { triggerManualRun } from '@/api/jobs/portfolioCron';

/**
 * Trigger a manual portfolio scrape
 * POST /api/portfolio/cron/trigger
 *
 * Authentication:
 * - Requires AUTHORIZATION_TOKEN environment variable
 * - Pass token in Authorization header: Bearer <token>
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization token if configured
    const authToken = process.env.AUTHORIZATION_TOKEN;
    if (authToken) {
      const authHeader = request.headers.get('Authorization');
      const providedToken = authHeader?.replace('Bearer ', '');

      if (!providedToken || providedToken !== authToken) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized. Invalid or missing authorization token.'
          },
          { status: 401 }
        );
      }
    }

    // Trigger manual run
    const result = await triggerManualRun();

    const statusCode = result.success ? 200 : 500;

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error triggering manual run:', errorMessage);

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

/**
 * GET endpoint to trigger manual run (for testing via browser)
 * In production, use POST instead
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // For testing only - check for debug token
  const debugToken = request.nextUrl.searchParams.get('debug');
  const envDebugToken = process.env.DEBUG_TOKEN;

  if (!envDebugToken || !debugToken || debugToken !== envDebugToken) {
    return NextResponse.json(
      {
        success: false,
        message: 'Use POST request with valid authorization token'
      },
      { status: 405 }
    );
  }

  try {
    const result = await triggerManualRun();
    const statusCode = result.success ? 200 : 500;

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error triggering manual run:', errorMessage);

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