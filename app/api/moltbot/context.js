const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  try {
    const response = await fetch(`${MOLTBOT_API}/context`);
    const data = await response.json();
    
    if (!data.success) {
      return res.status(500).json(data);
    }
    
    res.status(200).json(data.data || data);
  } catch (error) {
    console.error('Context API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch context',
        details: { message: error.message },
        recovery: 'Ensure the Moltbot API server is running'
      }
    });
  }
}
