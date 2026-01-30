const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { action, ...params } = req.body;
  const endpoints = {
    status: '/git/status',
    pull: '/git/pull',
    commit: '/git/commit',
    branches: '/git/branches'
  };
  
  const endpoint = endpoints[action];
  if (!endpoint) {
    return res.status(400).json({ error: 'Invalid git action' });
  }
  
  try {
    const response = await fetch(`${MOLTBOT_API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
