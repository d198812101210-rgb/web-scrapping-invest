import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json(
      {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'ERROR',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}