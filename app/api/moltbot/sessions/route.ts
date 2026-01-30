import { NextRequest, NextResponse } from 'next/server';

const MOLTBOT_API = 'http://100.73.167.86:18790';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const url = active
      ? `${MOLTBOT_API}/sessions?active=${active}`
      : `${MOLTBOT_API}/sessions`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'MoltBot returned an invalid response',
          },
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to get sessions',
          details: { message: error instanceof Error ? error.message : String(error) },
        },
      },
      { status: 500 }
    );
  }
}
