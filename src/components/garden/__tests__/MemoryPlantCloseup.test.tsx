import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryPlantCloseupOverlay } from '@/components/garden/MemoryPlantCloseupOverlay'
import { EMBER_DUSK } from '@/lib/garden/palettes'
import type { Memory } from '@/lib/types'

const sampleMemory: Memory = {
  id: 'popup-demo-1',
  photoUrl: '',
  text: 'Synthetic demo — a peaceful pond-side afternoon.\nWe listened to frogs by the water.',
  date: '2025-06-15',
  plantedAt: '2025-05-01T12:00:00.000Z',
  position: { x: 420, y: 442 },
  emotionalTone: 'peaceful',
  plantStage: 'bloom',
  plantVariety: 'lotus',
  visitCount: 6,
  lastVisited: '2025-06-14T18:00:00.000Z',
  reflections: [],
  audioRecordings: [],
  growthMetrics: {
    vitality: 70,
    height: 95,
    width: 70,
    bloomCount: 4,
    foliageDensity: 70,
    rarityScore: 12,
    lastInteractionAt: Date.now(),
  },
}

describe('MemoryPlantCloseupOverlay', () => {
  let mountNode: HTMLDivElement
  let root: Root | undefined

  beforeAll(() => {
    window.matchMedia =
      window.matchMedia ||
      ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }))
    if (!window.HTMLElement.prototype.scrollIntoView) {
      window.HTMLElement.prototype.scrollIntoView = () => undefined
    }
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    mountNode?.remove()
    document.body.innerHTML = ''
    root = undefined
  })

  function renderOverlay(props: Partial<ComponentProps<typeof MemoryPlantCloseupOverlay>> = {}) {
    mountNode = document.createElement('div')
    document.body.appendChild(mountNode)
    root = createRoot(mountNode)
    act(() => {
      root!.render(
        <MemoryPlantCloseupOverlay
          open
          memory={sampleMemory}
          palette={EMBER_DUSK}
          rimStrength={0.9}
          motion={false}
          onClose={props.onClose ?? (() => undefined)}
          onOpenMemoryDetail={props.onOpenMemoryDetail}
          {...props}
        />,
      )
    })
  }

  it('renders dialog content with memory text and growth stage', () => {
    renderOverlay()
    const dialog = document.querySelector('[data-testid="memory-plant-closeup-dialog"]')
    expect(dialog).toBeTruthy()
    expect(document.querySelector('[data-testid="memory-plant-closeup-text"]')?.textContent).toContain('Synthetic demo')
    expect(document.querySelector('[data-testid="memory-plant-closeup-stage"]')?.textContent).toBeTruthy()
    expect(document.querySelector('[data-testid="memory-plant-closeup-svg"]')).toBeTruthy()
    expect(document.querySelector('[data-testid="memory-plant-closeup-photo"]')).toBeFalsy()
  })

  it('calls onClose when close control is activated', async () => {
    const onClose = vi.fn()
    renderOverlay({ onClose })
    const close = document.querySelector('[data-testid="memory-plant-closeup-close"]') as HTMLButtonElement
    act(() => {
      close.click()
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('forwards open detail without re-visiting', () => {
    const onOpenMemoryDetail = vi.fn()
    const onClose = vi.fn()
    renderOverlay({ onOpenMemoryDetail, onClose })
    const openDetail = document.querySelector('[data-testid="memory-plant-closeup-open-detail"]') as HTMLButtonElement
    act(() => {
      openDetail.click()
    })
    expect(onOpenMemoryDetail).toHaveBeenCalledWith(sampleMemory)
    expect(onClose).toHaveBeenCalled()
  })
})