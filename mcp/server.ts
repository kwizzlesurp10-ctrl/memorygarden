#!/usr/bin/env node
/**
 * Local stdio MCP server for Memory Garden.
 *
 * Tools: list_memories, search_memories, get_memory, plant_memory
 *
 * Data sources (first match wins):
 *   MEMORYGARDEN_SNAPSHOT_PATH  JSON file of Memory[]
 *   MEMORYGARDEN_PAIR_CODE      live pair room via MEMORYGARDEN_API_BASE (default http://localhost:5173)
 *
 * Run: npm run mcp
 */

import { readFile, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import {
  callGardenMcpTool,
  GARDEN_MCP_TOOLS,
  type GardenMcpStore,
} from '../src/lib/garden-mcp-tools.ts'
import type { Memory } from '../src/lib/types.ts'
import type { PairRoom } from '../src/lib/pair-protocol.ts'

const apiBase = (process.env.MEMORYGARDEN_API_BASE ?? 'http://localhost:5173').replace(/\/$/, '')
const snapshotPath = process.env.MEMORYGARDEN_SNAPSHOT_PATH
const pairCode = process.env.MEMORYGARDEN_PAIR_CODE
const pairUserId = process.env.MEMORYGARDEN_USER_ID ?? 'mcp-local-user-0001'

async function fileStore(path: string): Promise<GardenMcpStore> {
  return {
    async load(): Promise<Memory[]> {
      const raw = await readFile(path, 'utf8')
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as Memory[]
      if (parsed && typeof parsed === 'object' && 'memories' in parsed) {
        return (parsed as { memories: Memory[] }).memories
      }
      return []
    },
    async save(memories: Memory[]): Promise<void> {
      await writeFile(path, JSON.stringify(memories, null, 2), 'utf8')
    },
  }
}

function pairStore(code: string): GardenMcpStore {
  return {
    async load(): Promise<Memory[]> {
      const res = await fetch(`${apiBase}/api/pair?code=${encodeURIComponent(code)}`)
      if (!res.ok) return []
      const body = (await res.json()) as { room?: PairRoom }
      return (body.room?.memories as Memory[] | undefined) ?? []
    },
    async save(memories: Memory[]): Promise<void> {
      const res = await fetch(`${apiBase}/api/pair?code=${encodeURIComponent(code)}`)
      if (!res.ok) throw new Error('Pair room unavailable')
      const body = (await res.json()) as { room?: PairRoom }
      const room = body.room
      if (!room) throw new Error('Pair room missing')
      const push = await fetch(`${apiBase}/api/pair`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'push',
          userId: pairUserId,
          code,
          revision: room.revision,
          document: { memories, preferences: room.preferences },
        }),
      })
      if (!push.ok) throw new Error(`Pair push failed: ${push.status}`)
    },
  }
}

async function resolveStore(): Promise<GardenMcpStore> {
  if (snapshotPath) return fileStore(snapshotPath)
  if (pairCode) return pairStore(pairCode)
  return {
    async load(): Promise<Memory[]> {
      return []
    },
  }
}

type JsonRpc = {
  jsonrpc: '2.0'
  id?: number | string | null
  method?: string
  params?: Record<string, unknown>
}

function respond(id: number | string | null | undefined, result: unknown): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result })}\n`)
}

function respondError(id: number | string | null | undefined, message: string): void {
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: '2.0', id: id ?? null, error: { code: -32000, message } })}\n`,
  )
}

async function main(): Promise<void> {
  const store = await resolveStore()
  const rl = createInterface({ input: process.stdin })

  for await (const line of rl) {
    if (!line.trim()) continue
    let message: JsonRpc
    try {
      message = JSON.parse(line) as JsonRpc
    } catch {
      continue
    }

    const { id, method, params } = message
    if (!method) continue

    if (method === 'initialize') {
      respond(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'memory-garden', version: '1.0.0' },
      })
      continue
    }

    if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
      continue
    }

    if (method === 'ping') {
      respond(id, {})
      continue
    }

    if (method === 'tools/list') {
      respond(id, { tools: GARDEN_MCP_TOOLS })
      continue
    }

    if (method === 'tools/call') {
      const name = typeof params?.name === 'string' ? params.name : ''
      const args = params?.arguments ?? {}
      const result = await callGardenMcpTool(store, name, args)
      if (!result.ok) {
        respond(id, { content: [{ type: 'text', text: result.error }], isError: true })
        continue
      }
      respond(id, {
        content: [{ type: 'text', text: JSON.stringify(result.value, null, 2) }],
      })
      continue
    }

    respondError(id, `Unknown method ${method}`)
  }
}

void main()
