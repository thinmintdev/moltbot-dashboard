const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  try {
    const modelId = req.query.model;
    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Model ID is required',
          recovery: 'Provide a model ID in the query string'
        }
      });
    }

    const response = await fetch(`${MOLTBOT_API}/model/set?model=${modelId}`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (!data.success) {
      return res.status(400).json(data);
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Model set API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to set model',
        details: { message: error.message },
        recovery: 'Ensure the Moltbot API server is running'
      }
    });
  }
}
