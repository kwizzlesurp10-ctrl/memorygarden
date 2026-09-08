import { describe, expect, it } from 'vitest'
import { handleSyncRequest } from '../server/sync-handler'
import { createMemoryKv } from '../server/kv-store'

describe('handleSyncRequest', () => {
  it('round-trips a document', async () => {
    const store = createMemoryKv()
    const post = await handleSyncRequest(
      new Request('http://g.test/api/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: 'local-user-0001',
          document: { memories: [{ id: 'm1' }], preferences: { soundEnabled: true } },
        }),
      }),
      store,
    )
    expect(post.status).toBe(200)

    const get = await handleSyncRequest(
      new Request('http://g.test/api/sync?userId=local-user-0001'),
      store,
    )
    expect(get.status).toBe(200)
    const body = (await get.json()) as { document: { memories: Array<{ id: string }> } }
    expect(body.document.memories[0]?.id).toBe('m1')
  })

  it('returns 400 for the availability probe id', async () => {
    const res = await handleSyncRequest(
      new Request('http://g.test/api/sync?userId=__probe__'),
      createMemoryKv(),
    )
    expect(res.status).toBe(400)
  })
})
