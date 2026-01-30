export default async function handler(req, res) {
  try {
    const response = await fetch('http://100.73.167.86:18790/combined');
    const data = await response.json();
    // Unwrap the response - backend returns { success, data: { status, ... } }
    // Widget expects { status, ... } directly
    res.status(200).json(data.data || data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
