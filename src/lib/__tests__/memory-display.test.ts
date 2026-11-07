import { describe, expect, it } from 'vitest'
import { memoryBodyFallback, memoryPrimaryLabel } from '../memory-display'

describe('memory display without text', () => {
  it('uses link label when text is empty', () => {
    expect(
      memoryPrimaryLabel({
        text: '',
        date: '2025-01-15',
        photoUrl: '',
        linkUrl: 'https://www.youtube.com/watch?v=abc',
      }),
    ).toBe('Link · YouTube')
  })

  it('uses photo/date fallback copy for detail', () => {
    expect(
      memoryBodyFallback({
        text: '',
        date: '2025-01-15',
        photoUrl: 'data:image/png;base64,abc',
      }),
    ).toContain('captured')
  })
})
