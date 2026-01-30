import { NextRequest, NextResponse } from 'next/server';

const MOLTBOT_API = 'http://100.73.167.86:18790';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, session, agent } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Message is required',
            recovery: 'Type a message to send to Moltbot',
          },
        },
        { status: 400 }
      );
    }

    // Pass agent ID to the gateway for proper OpenClaw routing
    const response = await fetch(`${MOLTBOT_API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session: session || 'default',
        agent: agent || 'main',  // OpenClaw agent ID
      }),
      signal: AbortSignal.timeout(120000), // 2 minutes - agent responses can take time
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('MoltBot returned non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'MoltBot returned an invalid response',
            details: { contentType, preview: text.substring(0, 100) },
            recovery: 'Ensure the Moltbot gateway is running and accessible',
          },
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!response.ok || data.success === false) {
      return NextResponse.json(data, { status: response.status || 503 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to send message to Moltbot',
          details: { message: error instanceof Error ? error.message : String(error) },
          recovery: 'Ensure the Moltbot gateway is running',
        },
      },
      { status: 500 }
    );
  }
}
