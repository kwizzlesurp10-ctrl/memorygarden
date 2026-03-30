/**
 * GitHub Gist-backed key-value store that mirrors the Spark KV API.
 *
 * Routes handled (after rewrite from /_spark/kv):
 *   GET  /api/_spark/kv           → list all keys
 *   GET  /api/_spark/kv/:key      → get value (JSON)
 *   POST /api/_spark/kv/:key      → set value (body is JSON-stringified value)
 *   DELETE /api/_spark/kv/:key    → delete key
 *
 * Storage backends (in priority order):
 *   1. GitHub Gist  — when GITHUB_TOKEN is set (persistent, stored in your GitHub account)
 *   2. In-memory    — fallback (ephemeral; data is lost when the serverless instance restarts)
 */

const GIST_DESCRIPTION = 'memorygarden-kv-store';
const GIST_FILENAME = 'kv.json';
const GITHUB_API = 'https://api.github.com';

// In-memory fallback store (used when GITHUB_TOKEN is not set)
const memStore = {};

// ── GitHub Gist helpers ────────────────────────────────────────────────────

let cachedGistId = null;

async function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

async function findOrCreateGist(token) {
  if (cachedGistId) return cachedGistId;

  const headers = await githubHeaders(token);

  // Search the first page of gists for our store
  const listRes = await fetch(`${GITHUB_API}/gists?per_page=100`, { headers });
  if (listRes.ok) {
    const gists = await listRes.json();
    if (Array.isArray(gists)) {
      const existing = gists.find((g) => g.description === GIST_DESCRIPTION);
      if (existing) {
        cachedGistId = existing.id;
        return cachedGistId;
      }
    }
  }

  // Create a new private gist
  const createRes = await fetch(`${GITHUB_API}/gists`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: '{}' } },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create gist: ${createRes.statusText}`);
  }

  const newGist = await createRes.json();
  cachedGistId = newGist.id;
  return cachedGistId;
}

async function readGistData(token, gistId) {
  const headers = await githubHeaders(token);
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, { headers });
  if (!res.ok) throw new Error(`Failed to read gist: ${res.statusText}`);

  const gist = await res.json();
  const content = gist.files?.[GIST_FILENAME]?.content ?? '{}';
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeGistData(token, gistId, data) {
  const headers = await githubHeaders(token);
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(data) } },
    }),
  });
  if (!res.ok) throw new Error(`Failed to write gist: ${res.statusText}`);
}

// ── Request handler ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const slug = req.query.slug;
  const key = Array.isArray(slug) ? slug[0] : slug ?? null;
  const token = process.env.GITHUB_TOKEN;

  try {
    if (token) {
      return await handleGist(req, res, key, token);
    }
    return handleMemory(req, res, key);
  } catch (err) {
    console.error('KV handler error:', err);
    return res.status(500).json({ error: 'KV operation failed' });
  }
}

// ── Gist backend ───────────────────────────────────────────────────────────

async function handleGist(req, res, key, token) {
  const gistId = await findOrCreateGist(token);

  if (!key) {
    // List all keys
    const data = await readGistData(token, gistId);
    return res.status(200).json(Object.keys(data));
  }

  if (req.method === 'GET') {
    const data = await readGistData(token, gistId);
    if (Object.hasOwn(data, key)) {
      return res.status(200).send(JSON.stringify(data[key]));
    }
    return res.status(404).end();
  }

  if (req.method === 'POST') {
    const data = await readGistData(token, gistId);
    // Parse the JSON body sent as text/plain by the Spark KV client
    let value;
    try {
      value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    data[key] = value;
    await writeGistData(token, gistId, data);
    return res.status(200).send(JSON.stringify(value));
  }

  if (req.method === 'DELETE') {
    const data = await readGistData(token, gistId);
    delete data[key];
    await writeGistData(token, gistId, data);
    return res.status(200).end();
  }

  return res.status(405).end();
}

// ── In-memory backend (fallback) ───────────────────────────────────────────

function handleMemory(req, res, key) {
  if (!key) {
    return res.status(200).json(Object.keys(memStore));
  }

  if (req.method === 'GET') {
    if (Object.hasOwn(memStore, key)) {
      return res.status(200).send(JSON.stringify(memStore[key]));
    }
    return res.status(404).end();
  }

  if (req.method === 'POST') {
    let value;
    try {
      value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    memStore[key] = value;
    return res.status(200).send(JSON.stringify(value));
  }

  if (req.method === 'DELETE') {
    delete memStore[key];
    return res.status(200).end();
  }

  return res.status(405).end();
}
