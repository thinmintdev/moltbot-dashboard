const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        recovery: 'Use POST to update task status'
      }
    });
  }

  try {
    const response = await fetch(`${MOLTBOT_API}/task/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    
    if (!data.success) {
      const statusCode = data.error?.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json(data);
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Task update API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to update task',
        details: { message: error.message },
        recovery: 'Ensure the Moltbot API server is running'
      }
    });
  }
}
