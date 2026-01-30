import { NextResponse } from 'next/server';

const MOLTBOT_API = 'http://100.73.167.86:18790';

export async function GET() {
  try {
    const response = await fetch(`${MOLTBOT_API}/agents`, {
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
    console.error('Agents API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to get agents',
          details: { message: error instanceof Error ? error.message : String(error) },
        },
      },
      { status: 500 }
    );
  }
}
