import type { Memory } from '@/lib/types'

export function memoryPlantA11yLabel(memory: Memory): string {
  const snippet = memory.text?.trim().slice(0, 80)
  if (snippet) return snippet
  return `${memory.emotionalTone} memory, ${memory.plantStage} stage`
}

export function memoryPlantAriaLabel(memory: Memory): string {
  return `Open memory: ${memoryPlantA11yLabel(memory)}`
}
