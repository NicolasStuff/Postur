import { NextResponse } from 'next/server';

/**
 * Health check endpoint pour Fly.io et les load balancers
 * GET /api/health
 */
export async function GET() {
  try {
    return NextResponse.json(
      { status: 'ok' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Healthcheck failed', error)
    return NextResponse.json(
      { status: 'error' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
