import { describe, expect, it } from 'vitest'
import {
  applyPairPush,
  createPairRoom,
  generatePairCode,
  joinPairRoom,
  normalizePairCode,
  PAIR_CODE_PATTERN,
  unionMemoriesByRecency,
  type TimedMemory,
} from '../pair-protocol'
import { handlePairRequest } from '../server/pair-handler'
import { createMemoryKv } from '../server/kv-store'

describe('pair codes', () => {
  it('generates a 6-character alphabet code', () => {
    const code = generatePairCode(() => 0)
    expect(code).toMatch(PAIR_CODE_PATTERN)
    expect(code).toHaveLength(6)
  })

  it('normalizes lowercase and strips junk', () => {
    const parsed = normalizePairCode(' ab-c123 ')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.value).toBe('ABC123')
  })

  it('rejects short codes', () => {
    expect(normalizePairCode('AB').ok).toBe(false)
  })
})

describe('pair room mutations', () => {
  it('creates, joins, and pushes with revision checks', () => {
    const room = createPairRoom({
      code: 'ABC234',
      hostUserId: 'host-user-0001',
      document: { memories: [{ id: 'm1' }] },
      now: '2026-01-01T00:00:00.000Z',
    })
    expect(room.revision).toBe(1)

    const joined = joinPairRoom(room, 'guest-user-0002')
    expect(joined.guestUserIds).toEqual(['guest-user-0002'])

    const pushed = applyPairPush(joined, {
      userId: 'guest-user-0002',
      revision: 1,
      document: { memories: [{ id: 'm1' }, { id: 'm2' }] },
      now: '2026-01-01T00:01:00.000Z',
    })
    expect(pushed.ok).toBe(true)
    if (pushed.ok) expect(pushed.value.revision).toBe(2)

    const stale = applyPairPush(joined, {
      userId: 'host-user-0001',
      revision: 0,
      document: { memories: [] },
    })
    expect(stale.ok).toBe(false)
    if (!stale.ok) expect(stale.error.code).toBe('conflict')
  })
})

describe('unionMemoriesByRecency', () => {
  it('keeps the newer visit and preserves local photos', () => {
    const local: TimedMemory[] = [
      { id: 'a', plantedAt: '2026-01-01T00:00:00.000Z', photoUrl: 'data:local', lastVisited: '2026-01-02T00:00:00.000Z' },
    ]
    const remote: TimedMemory[] = [
      { id: 'a', plantedAt: '2026-01-01T00:00:00.000Z', lastVisited: '2026-01-01T12:00:00.000Z' },
      { id: 'b', plantedAt: '2026-01-03T00:00:00.000Z' },
    ]
    const union = unionMemoriesByRecency(local, remote)
    expect(union).toHaveLength(2)
    const a = union.find((m) => m.id === 'a')
    expect(a?.photoUrl).toBe('data:local')
    expect(a?.lastVisited).toBe('2026-01-02T00:00:00.000Z')
  })
})

describe('handlePairRequest', () => {
  it('creates and fetches a room from memory kv', async () => {
    const store = createMemoryKv()
    const created = await handlePairRequest(
      new Request('http://g.test/api/pair', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: 'host-user-0001',
          document: { memories: [{ id: 'm1', text: 'rain' }] },
        }),
      }),
      store,
    )
    expect(created.status).toBe(200)
    const createdBody = (await created.json()) as { room: { code: string; revision: number } }
    expect(createdBody.room.code).toMatch(PAIR_CODE_PATTERN)

    const fetched = await handlePairRequest(
      new Request(`http://g.test/api/pair?code=${createdBody.room.code}`),
      store,
    )
    expect(fetched.status).toBe(200)
  })

  it('returns 503 without a store', async () => {
    const res = await handlePairRequest(new Request('http://g.test/api/pair?code=ABC234'), null)
    expect(res.status).toBe(503)
  })
})
