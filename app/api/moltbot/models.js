const MOLTBOT_API = 'http://100.73.167.86:18790';

// Tier classification for models
const TIER_MAP = {
  // Complex tier - most capable models
  'anthropic/claude-opus-4-5-20251101': 'complex',
  'anthropic/claude-opus-4-20250514': 'complex',
  'llama-swap/deepseek-r1-14b': 'complex',

  // Medium tier - balanced models
  'anthropic/claude-sonnet-4-20250514': 'medium',
  'anthropic/claude-sonnet-4-5-20250929': 'medium',
  'anthropic/claude-sonnet-4-5': 'medium',
  'llama-swap/qwen3-coder-30b': 'medium',

  // Everyday tier - fast/efficient models
  'minimax/MiniMax-M2.1': 'everyday',
  'llama-swap/nemotron-30b': 'everyday',
  'llama-swap/phi-4': 'everyday',
  'llama-swap/glm-4.6v-flash': 'everyday',
};

const TIER_INFO = {
  complex: { tierName: 'Complex', color: 'purple' },
  medium: { tierName: 'Medium', color: 'blue' },
  everyday: { tierName: 'Everyday', color: 'green' },
};

function classifyModel(model) {
  const key = model.key || model.id;
  const tier = TIER_MAP[key] || 'everyday';
  return {
    id: key,
    name: model.name,
    tier,
    ...TIER_INFO[tier],
  };
}

export default async function handler(req, res) {
  try {
    const response = await fetch(`${MOLTBOT_API}/models`);
    const data = await response.json();

    if (!data.success) {
      return res.status(500).json(data);
    }

    const rawModels = data.data?.models || [];

    // Filter to available models and add tier info
    const models = rawModels
      .filter(m => m.available && !m.missing)
      .map(classifyModel);

    // Get current default from combined endpoint
    let defaults = { primary: 'minimax/MiniMax-M2.1' };
    try {
      const combinedRes = await fetch(`${MOLTBOT_API}/combined`);
      const combinedData = await combinedRes.json();
      if (combinedData.success && combinedData.data?.status?.sessions?.defaults?.model) {
        defaults.primary = combinedData.data.status.sessions.defaults.model;
      }
    } catch (e) {
      // Ignore - use default
    }

    res.status(200).json({ models, defaults });
  } catch (error) {
    console.error('Models API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch models',
        details: { message: error.message },
        recovery: 'Ensure the Moltbot API server is running'
      }
    });
  }
}
