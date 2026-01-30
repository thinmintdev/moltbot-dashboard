const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const lines = url.searchParams.get('lines') || 100;
    
    const response = await fetch(`${MOLTBOT_API}/logs?lines=${lines}`);
    const data = await response.json();
    
    if (!data.success) {
      return res.status(400).json(data);
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Logs API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch logs',
        details: { message: error.message },
        recovery: 'Ensure the Moltbot API server is running'
      }
    });
  }
}
