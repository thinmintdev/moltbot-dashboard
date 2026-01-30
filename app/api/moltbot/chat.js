const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  try {
    const { message, session } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Message is required',
          recovery: 'Type a message to send to Moltbot'
        }
      });
    }

    const response = await fetch(`${MOLTBOT_API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session })
    });
    const data = await response.json();
    
    if (!data.success) {
      return res.status(503).json(data);
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to send message to Moltbot',
        details: { message: error.message },
        recovery: 'Ensure the Moltbot gateway is running'
      }
    });
  }
}
