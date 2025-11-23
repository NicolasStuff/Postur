import { NextResponse } from 'next/server';

/**
 * Health check endpoint pour Fly.io et les load balancers
 * GET /api/health
 */
export async function GET() {
  try {
    // Vérification basique de l'état de l'application
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
