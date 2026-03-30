/**
 * Proxies LLM requests to GitHub Models API (GITHUB_TOKEN) or OpenAI (OPENAI_API_KEY).
 *
 * The Spark SDK sends a standard OpenAI-compatible request body with model names
 * prefixed as "openai/gpt-4o", "openai/gpt-4o-mini", etc.
 */

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!githubToken && !openaiKey) {
    return res.status(503).json({
      error: 'No LLM credentials configured. Set GITHUB_TOKEN or OPENAI_API_KEY.',
    });
  }

  const body = req.body;

  try {
    let upstreamUrl;
    let authHeader;
    let upstreamBody;

    if (githubToken) {
      // GitHub Models API uses the model name as-is (e.g. "openai/gpt-4o")
      upstreamUrl = GITHUB_MODELS_URL;
      authHeader = `Bearer ${githubToken}`;
      upstreamBody = JSON.stringify(body);
    } else {
      // OpenAI expects a short model name without provider prefix (e.g. "gpt-4o")
      const model = typeof body.model === 'string'
        ? body.model.replace(/^[^/]+\//, '')
        : 'gpt-4o-mini';
      upstreamUrl = OPENAI_URL;
      authHeader = `Bearer ${openaiKey}`;
      upstreamBody = JSON.stringify({ ...body, model });
    }

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: upstreamBody,
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('LLM proxy error:', err);
    return res.status(500).json({ error: 'LLM request failed' });
  }
}
