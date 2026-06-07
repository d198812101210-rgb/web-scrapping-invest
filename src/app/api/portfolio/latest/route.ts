import { NextRequest, NextResponse } from 'next/server';
import { portfolioService } from '@/api/services/portfolioService';

/**
 * Get latest portfolio items
 * GET /api/portfolio/latest
 * Query params:
 *   - limit: number (default: 100)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get limit from query params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    if (limit < 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Limit must be at least 1'
        },
        { status: 400 }
      );
    }

    // Fetch data
    const data = await portfolioService.getLatestPortfolioItems(limit);

    return NextResponse.json(
      {
        success: true,
        data,
        count: data.length,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching portfolio items:', errorMessage);

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