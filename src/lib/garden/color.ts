import type { GardenPalette } from './palettes'

export function lerpHex(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = Math.round(((pa >>> 16) & 255) + ((((pb >>> 16) & 255) - ((pa >>> 16) & 255)) * f))
  const g = Math.round(((pa >>> 8) & 255) + ((((pb >>> 8) & 255) - ((pa >>> 8) & 255)) * f))
  const bl = Math.round((pa & 255) + (((pb & 255) - (pa & 255)) * f))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)
}

export function lerpPal(A: GardenPalette, B: GardenPalette, f: number): GardenPalette {
  return {
    cloud: lerpHex(A.cloud, B.cloud, f),
    bank: lerpHex(A.bank, B.bank, f),
    sil: lerpHex(A.sil, B.sil, f),
    silSoft: lerpHex(A.silSoft, B.silSoft, f),
    rim: lerpHex(A.rim, B.rim, f),
    glow: lerpHex(A.glow, B.glow, f),
    accent: lerpHex(A.accent, B.accent, f),
    fire: lerpHex(A.fire, B.fire, f),
    birds: lerpHex(A.birds, B.birds, f),
    ripple: lerpHex(A.ripple, B.ripple, f),
    sky: A.sky.map((c, i) => lerpHex(c, B.sky[i], f)),
    hills: A.hills.map((c, i) => lerpHex(c, B.hills[i], f)),
    waterTint: A.waterTint.map((c, i) => lerpHex(c, B.waterTint[i], f)),
  }
}