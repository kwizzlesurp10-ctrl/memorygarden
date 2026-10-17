import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { completeWithAiSdk } from './src/lib/server/ai-complete'
import { createMemoryKv, kvFromEnv, type KvStore } from './src/lib/server/kv-store'
import { handleLlmRequest, isLlmConfigured } from './src/lib/server/llm-handler'
import { handlePairRequest } from './src/lib/server/pair-handler'
import { handleSyncRequest } from './src/lib/server/sync-handler'

const localKv: KvStore = kvFromEnv() ?? createMemoryKv()

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? 'localhost'
  const url = `http://${host}${req.url ?? '/'}`
  const method = req.method ?? 'GET'
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }
  const init: RequestInit = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await readBody(req)
  }
  return new Request(url, init)
}

async function sendWebResponse(web: Response, res: ServerResponse): Promise<void> {
  res.statusCode = web.status
  web.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  const buf = Buffer.from(await web.arrayBuffer())
  res.end(buf)
}

export function gardenApiPlugin(): Plugin {
  return {
    name: 'memory-garden-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/llm') && !url.startsWith('/api/sync') && !url.startsWith('/api/pair')) {
          next()
          return
        }

        void (async () => {
          try {
            const request = await toWebRequest(req)
            let response: Response
            if (url.startsWith('/api/llm')) {
              response = await handleLlmRequest(request, {
                configured: isLlmConfigured(),
                complete: completeWithAiSdk,
              })
            } else if (url.startsWith('/api/sync')) {
              response = await handleSyncRequest(request, localKv)
            } else {
              response = await handlePairRequest(request, localKv)
            }
            await sendWebResponse(response, res)
          } catch (error) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
          }
        })()
      })
    },
  }
}
