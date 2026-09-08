import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const canvasPath = path.join(root, 'components/GardenCanvas.tsx')
const sheetPath = path.join(root, 'components/garden/GardenRitualsSheet.tsx')

describe('garden ritual side menu', () => {
  it('keeps dream and candle forms off the permanent garden overlay', () => {
    const source = readFileSync(canvasPath, 'utf8')
    expect(source).toContain('GardenRitualsSheet')
    expect(source).not.toMatch(/bottom-20 left-3[\s\S]{0,500}DreamPlantPanel/)
    expect(source).not.toMatch(/<DreamPlantPanel/)
    expect(source).not.toMatch(/<RemembranceCandlesPanel/)
  })

  it('opens both rituals from a left Sheet', () => {
    const source = readFileSync(sheetPath, 'utf8')
    expect(source).toContain("from '@/components/ui/sheet'")
    expect(source).toContain('side="left"')
    expect(source).toContain('DreamPlantPanel')
    expect(source).toContain('RemembranceCandlesPanel')
    expect(source).toMatch(/aria-label=["']Dream a plant["']/)
    expect(source).toMatch(/aria-label=["']Floating candles["']/)
  })
})
