const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const response = await fetch(`${MOLTBOT_API}/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(200).json(data);
    } else if (req.method === 'PUT') {
      const response = await fetch(`${MOLTBOT_API}/projects/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      const response = await fetch(`${MOLTBOT_API}/projects/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const response = await fetch(`${MOLTBOT_API}/projects`);
      const data = await response.json();
      res.status(200).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
