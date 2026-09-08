import { z } from 'zod'
import { searchMemories } from './memory-search'
import { err, ok, type Result } from './result'
import type { EmotionalTone, Memory, PlantStage } from './types'

export type MemorySummary = {
  id: string
  text: string
  date: string
  location?: string
  emotionalTone: EmotionalTone
  plantStage: PlantStage
  visitCount: number
  plantedAt: string
}

export const plantMemoryInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  date: z.string().min(4).max(32).optional(),
  location: z.string().max(200).optional(),
  emotionalTone: z.enum(['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']).optional(),
})

export type PlantMemoryInput = z.infer<typeof plantMemoryInputSchema>

export function summarizeMemory(memory: Memory): MemorySummary {
  return {
    id: memory.id,
    text: memory.text,
    date: memory.date,
    location: memory.location,
    emotionalTone: memory.emotionalTone,
    plantStage: memory.plantStage,
    visitCount: memory.visitCount,
    plantedAt: memory.plantedAt,
  }
}

export function listMemorySummaries(memories: Memory[]): MemorySummary[] {
  return memories.map(summarizeMemory)
}

export function searchMemorySummaries(memories: Memory[], query: string): MemorySummary[] {
  return searchMemories(memories, query, { limit: 20 }).map((hit) => summarizeMemory(hit.memory))
}

export function getMemorySummary(memories: Memory[], id: string): Result<MemorySummary, string> {
  const found = memories.find((memory) => memory.id === id)
  if (!found) return err(`No memory with id ${id}`)
  return ok(summarizeMemory(found))
}

export function plantMemoryInto(memories: Memory[], input: unknown, now = new Date()): Result<Memory, string> {
  const parsed = plantMemoryInputSchema.safeParse(input)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid plant payload')
  }
  const iso = now.toISOString()
  const memory: Memory = {
    id: `mcp-${now.getTime()}`,
    photoUrl: '',
    text: parsed.data.text,
    date: parsed.data.date ?? iso.slice(0, 10),
    location: parsed.data.location,
    plantedAt: iso,
    position: { x: 180 + (memories.length % 7) * 40, y: 160 + (memories.length % 5) * 28 },
    emotionalTone: parsed.data.emotionalTone ?? 'peaceful',
    plantStage: 'seed',
    plantVariety: 'flower',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
  }
  return ok(memory)
}

export const GARDEN_MCP_TOOLS = [
  {
    name: 'list_memories',
    description: 'List planted memories in the current garden (text metadata only, no photos).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'search_memories',
    description: 'Ranked search over memory text, location, and reflections.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Free-text query' } },
      required: ['query'],
    },
  },
  {
    name: 'get_memory',
    description: 'Fetch one memory by id (metadata only).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'plant_memory',
    description: 'Plant a text-only memory seed into the local snapshot or live pair document.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        date: { type: 'string' },
        location: { type: 'string' },
        emotionalTone: {
          type: 'string',
          enum: ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic'],
        },
      },
      required: ['text'],
    },
  },
] as const

export type GardenMcpToolName = (typeof GARDEN_MCP_TOOLS)[number]['name']

export interface GardenMcpStore {
  load(): Promise<Memory[]>
  save?(memories: Memory[]): Promise<void>
}

export async function callGardenMcpTool(
  store: GardenMcpStore,
  name: string,
  args: unknown,
): Promise<Result<unknown, string>> {
  const memories = await store.load()

  if (name === 'list_memories') {
    return ok(listMemorySummaries(memories))
  }

  if (name === 'search_memories') {
    const query = typeof args === 'object' && args && 'query' in args ? String((args as { query: unknown }).query) : ''
    return ok(searchMemorySummaries(memories, query))
  }

  if (name === 'get_memory') {
    const id = typeof args === 'object' && args && 'id' in args ? String((args as { id: unknown }).id) : ''
    return getMemorySummary(memories, id)
  }

  if (name === 'plant_memory') {
    const planted = plantMemoryInto(memories, args)
    if (!planted.ok) return planted
    if (!store.save) return err('This MCP store is read-only')
    await store.save([...memories, planted.value])
    return ok(summarizeMemory(planted.value))
  }

  return err(`Unknown tool: ${name}`)
}
