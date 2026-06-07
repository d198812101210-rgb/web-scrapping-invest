import { NextRequest, NextResponse } from 'next/server';

/**
 * API Root Endpoint
 * GET /api
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: 'Welcome to Financial Dashboard API',
      version: '1.0.0',
      status: 'OK',
      endpoints: {
        health: {
          method: 'GET',
          path: '/api/health',
          description: 'Health check endpoint'
        },
        portfolio: {
          latest: {
            method: 'GET',
            path: '/api/portfolio/latest',
            description: 'Get latest portfolio items',
            queryParams: {
              limit: { type: 'number', default: 100, description: 'Max 1000' }
            }
          },
          cron: {
            status: {
              method: 'GET',
              path: '/api/portfolio/cron/status',
              description: 'Get portfolio cron job status'
            },
            trigger: {
              method: 'POST',
              path: '/api/portfolio/cron/trigger',
              description: 'Trigger manual portfolio scrape',
              auth: 'Bearer token (AUTHORIZATION_TOKEN env var)',
              example: 'curl -X POST /api/portfolio/cron/trigger -H "Authorization: Bearer YOUR_TOKEN"'
            }
          }
        }
      },
      documentation: 'See README.md for detailed API documentation',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}