// src/pages/api/moltbot/sessions.js - Get chat sessions
const MOLTBOT_API = 'http://100.73.167.86:18790';

export default async function handler(req, res) {
  try {
    // Get combined status which includes sessions info
    const response = await fetch(`${MOLTBOT_API}/combined`);
    const data = await response.json();

    const sessions = data.status?.sessions?.recent || [];
    const byAgent = data.status?.sessions?.byAgent || [];

    // Format sessions for the UI
    const formattedSessions = sessions.map(s => ({
      id: s.sessionId,
      key: s.key,
      agentId: s.agentId,
      model: s.model,
      totalTokens: s.totalTokens,
      remainingTokens: s.remainingTokens,
      percentUsed: s.percentUsed,
      contextTokens: s.contextTokens,
      updatedAt: s.updatedAt,
      age: s.age,
      flags: s.flags || []
    }));

    res.status(200).json({
      sessions: formattedSessions,
      byAgent,
      count: data.status?.sessions?.count || 0,
      defaults: data.status?.sessions?.defaults || {}
    });
  } catch (error) {
    console.error('Sessions error:', error);
    res.status(500).json({ error: error.message });
  }
}
