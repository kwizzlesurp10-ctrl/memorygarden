import { describe, expect, it } from 'vitest'
import {
  parseGardenAccessBody,
  parseGardenLeaveBody,
  parseMemoryActionBody,
} from '../../../api/gardens/lib/garden-access'

const gardenId = '11111111-1111-4111-8111-111111111111'
const memoryId = '22222222-2222-4222-8222-222222222222'
const userId = 'abcdefghijklmnop'

describe('garden-access parsers', () => {
  it('parses join bodies with validated ids', () => {
    const parsed = parseGardenAccessBody({
      gardenId,
      userId,
      userName: 'Alice',
    })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.gardenId).toBe(gardenId)
    }
  })

  it('rejects join bodies with short user ids', () => {
    const parsed = parseGardenAccessBody({
      gardenId,
      userId: 'tiny',
      userName: 'Bob',
    })
    expect(parsed.ok).toBe(false)
  })

  it('parses leave bodies without requiring userName', () => {
    const parsed = parseGardenLeaveBody({ gardenId, userId })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.userName).toBe('Someone')
    }
  })

  it('requires userId for memory mutations when configured', () => {
    const missing = parseMemoryActionBody({ memoryId }, { requireUserId: true })
    expect(missing.ok).toBe(false)
    const ok = parseMemoryActionBody(
      { memoryId, userId, userName: 'Carey' },
      { requireUserId: true },
    )
    expect(ok.ok).toBe(true)
  })
})
