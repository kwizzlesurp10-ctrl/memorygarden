import { describe, expect, it } from 'vitest'
import {
  callGardenMcpTool,
  getMemorySummary,
  plantMemoryInto,
  searchMemorySummaries,
  type GardenMcpStore,
} from '../garden-mcp-tools'
import type { Memory } from '../types'

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'mem-1',
    photoUrl: 'data:image/png;base64,abc',
    text: 'A peaceful afternoon walk in the park',
    date: '2024-06-15',
    plantedAt: '2024-06-15T12:00:00.000Z',
    position: { x: 100, y: 200 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

describe('garden MCP tools', () => {
  const memories = [
    makeMemory(),
    makeMemory({ id: 'mem-2', text: 'Birthday candles by the sea', emotionalTone: 'happy', location: 'Brighton' }),
  ]

  it('searches by text', () => {
    const hits = searchMemorySummaries(memories, 'birthday')
    expect(hits[0]?.id).toBe('mem-2')
  })

  it('gets a memory by id', () => {
    const found = getMemorySummary(memories, 'mem-1')
    expect(found.ok).toBe(true)
    expect(getMemorySummary(memories, 'missing').ok).toBe(false)
  })

  it('plants a seed into a writable store', async () => {
    let stored = [...memories]
    const store: GardenMcpStore = {
      load: async () => stored,
      save: async (next) => {
        stored = next
      },
    }
    const planted = await callGardenMcpTool(store, 'plant_memory', { text: 'First snow on the greenhouse' })
    expect(planted.ok).toBe(true)
    expect(stored).toHaveLength(3)
  })

  it('refuses to plant into a read-only store', async () => {
    const store: GardenMcpStore = { load: async () => memories }
    const planted = await callGardenMcpTool(store, 'plant_memory', { text: 'should fail' })
    expect(planted.ok).toBe(false)
  })

  it('validates plant payloads', () => {
    const planted = plantMemoryInto(memories, { text: '' })
    expect(planted.ok).toBe(false)
  })

  it('lists memories without photo payloads', async () => {
    const store: GardenMcpStore = { load: async () => memories }
    const listed = await callGardenMcpTool(store, 'list_memories', {})
    expect(listed.ok).toBe(true)
    if (listed.ok) {
      const rows = listed.value as Array<{ id: string; photoUrl?: string }>
      expect(rows[0]?.id).toBe('mem-1')
      expect(rows[0]?.photoUrl).toBeUndefined()
    }
  })
})
