import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { PlantMemoryModal } from '@/components/PlantMemoryModal'

vi.mock('@/components/AudioRecorder', () => ({
  AudioRecorder: () => <div data-testid="audio-recorder-mock" />,
}))

vi.mock('@/lib/garden-helpers', () => ({
  classifyEmotionalTone: vi.fn().mockResolvedValue('peaceful'),
  selectPlantVariety: vi.fn().mockReturnValue('flower'),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}))

function makeTestImageFile(): File {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  return new File([bytes], 'memory.png', { type: 'image/png' })
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

function isElementVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

describe('PlantMemoryModal image UX', () => {
  let mountNode: HTMLDivElement
  let root: Root | undefined

  beforeAll(() => {
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

  function renderModal(onPlant: PlantMemoryModalProps['onPlant'] = async () => undefined) {
    mountNode = document.createElement('div')
    document.body.appendChild(mountNode)
    root = createRoot(mountNode)
    act(() => {
      root!.render(<PlantMemoryModal open onClose={() => undefined} onPlant={onPlant} />)
    })
  }

  it('keeps the memory textarea rendered and visible after selecting an image', async () => {
    renderModal()

    const textareaBefore = document.body.querySelector('#text') as HTMLTextAreaElement | null
    expect(textareaBefore).toBeTruthy()
    expect(isElementVisible(textareaBefore!)).toBe(true)

    const fileInput = document.body.querySelector('#photo') as HTMLInputElement
    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        configurable: true,
        value: [makeTestImageFile()],
      })
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
      await Promise.resolve()
    })

    const textareaAfter = document.body.querySelector('#text') as HTMLTextAreaElement | null
    expect(textareaAfter).toBeTruthy()
    expect(isElementVisible(textareaAfter!)).toBe(true)
    expect(document.body.querySelector('img[alt="Selected memory photo preview"]')).toBeTruthy()
  })

  it('removes the image preview and preserves typed text', async () => {
    renderModal()

    const textarea = document.body.querySelector('#text') as HTMLTextAreaElement
    const typed = 'This moment stayed with me forever.'
    await act(async () => {
      setTextareaValue(textarea, typed)
    })

    const fileInput = document.body.querySelector('#photo') as HTMLInputElement
    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        configurable: true,
        value: [makeTestImageFile()],
      })
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
      await Promise.resolve()
    })

    expect(document.body.querySelector('img[alt="Selected memory photo preview"]')).toBeTruthy()

    const removeButton = document.body.querySelector(
      'button[aria-label="Remove image"]',
    ) as HTMLButtonElement
    await act(async () => {
      removeButton.click()
    })

    expect(document.body.querySelector('img[alt="Selected memory photo preview"]')).toBeNull()
    expect((document.body.querySelector('#photo') as HTMLInputElement).value).toBe('')
    expect((document.body.querySelector('#text') as HTMLTextAreaElement).value).toBe(typed)
  })

  it('calls onPlant without a photo after the image is removed', async () => {
    const onPlant = vi.fn().mockResolvedValue(undefined)
    renderModal(onPlant)

    const textarea = document.body.querySelector('#text') as HTMLTextAreaElement
    await act(async () => {
      setTextareaValue(textarea, 'Enough words for planting here.')
    })

    const fileInput = document.body.querySelector('#photo') as HTMLInputElement
    await act(async () => {
      Object.defineProperty(fileInput, 'files', {
        configurable: true,
        value: [makeTestImageFile()],
      })
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
      await Promise.resolve()
    })

    const removeButton = document.body.querySelector(
      'button[aria-label="Remove image"]',
    ) as HTMLButtonElement
    await act(async () => {
      removeButton.click()
    })

    const plantButton = Array.from(document.body.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Plant Memory'),
    ) as HTMLButtonElement

    await act(async () => {
      plantButton.click()
      await Promise.resolve()
    })

    expect(onPlant).toHaveBeenCalledTimes(1)
    expect(onPlant.mock.calls[0][0].photoFile).toBeUndefined()
    expect(onPlant.mock.calls[0][0].text).toBe('Enough words for planting here.')
  })
})

type PlantMemoryModalProps = Parameters<typeof PlantMemoryModal>[0]
