const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  try {
    const response = await fetch(`${MOLTBOT_API}${req.url.replace('/api/moltbot', '')}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.json();
    
    // Pass through the enhanced error format
    if (!data.success) {
      return res.status(response.status).json(data);
    }
    
    res.status(200).json(data.data || data);
  } catch (error) {
    console.error('Moltbot API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to connect to Moltbot API',
        details: { message: error.message },
        recovery: 'Ensure the Moltbot API server is running on port 18790'
      }
    });
  }
}
