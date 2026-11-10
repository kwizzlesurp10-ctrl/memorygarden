import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DreamPlantPanel } from '@/components/garden/DreamPlantPanel'
import { DreamPlantCloseupOverlay } from '@/components/garden/DreamPlantCloseupOverlay'
import { EMBER_DUSK } from '@/lib/garden/palettes'
import { localGenome } from '@/lib/garden/hybrid'

vi.mock('@/lib/garden/plant-of-week', () => ({
  getPlantOfWeek: () => ({
    daysLeft: 3,
    genome: localGenome('weekly lavender'),
    theme: 'lavender hush',
    isoWeek: '2025-W45',
    evolvedFromName: null as string | null,
  }),
}))

const sampleGenome = localGenome('moonlit fern beside the pond')

vi.mock('@/lib/garden/dream-plant', () => ({
  dreamPlant: vi.fn(async () => ({ genome: sampleGenome, source: 'local' as const })),
}))

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('DreamPlantCloseupOverlay', () => {
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
    history.pushState = vi.fn()
    history.back = vi.fn(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    if (!window.HTMLElement.prototype.scrollIntoView) {
      window.HTMLElement.prototype.scrollIntoView = () => undefined
    }
    if (!window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        observe(): void {
          return undefined
        }
        unobserve(): void {
          return undefined
        }
        disconnect(): void {
          return undefined
        }
      }
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

  function renderOverlay(props: Partial<ComponentProps<typeof DreamPlantCloseupOverlay>> = {}) {
    mountNode = document.createElement('div')
    document.body.appendChild(mountNode)
    root = createRoot(mountNode)
    const returnBtn = document.createElement('button')
    returnBtn.type = 'button'
    returnBtn.textContent = 'return'
    document.body.appendChild(returnBtn)
    act(() => {
      root!.render(
        <DreamPlantCloseupOverlay
          open
          onClose={props.onClose ?? (() => undefined)}
          genome={sampleGenome}
          palette={EMBER_DUSK}
          rimStrength={0.9}
          motion={false}
          returnFocusRef={{ current: returnBtn }}
          {...props}
        />,
      )
    })
    return { returnBtn }
  }

  it('opens with dialog semantics and a large SVG preview', () => {
    renderOverlay()
    const dialog = document.body.querySelector('[data-testid="dream-plant-closeup-dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('role')).toBe('dialog')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(document.body.querySelector('[data-testid="dream-plant-closeup-svg"]')).toBeTruthy()
  })

  it('closes via Back without mutating genome props', () => {
    const onClose = vi.fn()
    renderOverlay({ onClose })
    const back = document.body.querySelector('[data-testid="dream-plant-closeup-back"]') as HTMLButtonElement
    act(() => {
      back.click()
    })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('DreamPlantPanel close-up flow', () => {
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
    history.pushState = vi.fn()
    history.back = vi.fn(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    mountNode?.remove()
    document.body.innerHTML = ''
    root = undefined
  })

  it('keeps the dreamed plant after opening and closing close-up', async () => {
    const onPlant = vi.fn()
    mountNode = document.createElement('div')
    document.body.appendChild(mountNode)
    root = createRoot(mountNode)
    await act(async () => {
      root!.render(
        <DreamPlantPanel
          palette={EMBER_DUSK}
          rimStrength={0.9}
          motion={false}
          onPlant={onPlant}
        />,
      )
    })

    const input = document.body.querySelector('input[type="text"]') as HTMLInputElement
    setInputValue(input, 'quiet pond')
    const dreamBtn = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.includes('Dream it'))
    expect(dreamBtn).toBeTruthy()

    await act(async () => {
      dreamBtn!.click()
      await Promise.resolve()
    })

    const closeupTrigger = document.body.querySelector('[data-testid="dream-plant-closeup-trigger"]') as HTMLButtonElement
    expect(closeupTrigger).toBeTruthy()

    await act(async () => {
      closeupTrigger.click()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(document.body.querySelector('[data-testid="dream-plant-closeup-dialog"]')).toBeTruthy()
    expect(onPlant).not.toHaveBeenCalled()

    const back = document.body.querySelector('[data-testid="dream-plant-closeup-back"]') as HTMLButtonElement
    await act(async () => {
      back.click()
      await Promise.resolve()
    })

    const dialog = document.body.querySelector('[data-testid="dream-plant-closeup-dialog"]')
    expect(dialog?.getAttribute('data-state')).not.toBe('open')
    expect(document.body.querySelector('[data-testid="dream-plant-closeup-trigger"]')).toBeTruthy()
    expect(document.body.querySelector('[data-testid="dream-plant-store-garden"]')).toBeTruthy()
    expect(onPlant).not.toHaveBeenCalled()
  })
})
