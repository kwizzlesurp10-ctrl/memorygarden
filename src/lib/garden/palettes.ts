import type { Season } from '@/lib/types'

export interface GardenPalette {
  sky: string[]
  cloud: string
  bank: string
  sil: string
  silSoft: string
  rim: string
  glow: string
  accent: string
  fire: string
  birds: string
  ripple: string
  hills: string[]
  waterTint: string[]
}

export interface ScenePalette extends GardenPalette {
  stars?: number
  starAlpha?: number
  fireAlpha?: number
  fireN?: number
  shootAlpha?: number
  mistAlpha?: number
  buttAlpha?: number
  leafAlpha?: number
  snowAlpha?: number
  petalAlpha?: number
  birdAlpha?: number
  lotusDormant?: boolean
  sun?: { x: number; y: number; r: number; disk: string; glow: string } | null
  moon?: { x: number; y: number; r: number }
  venus?: { x: number; y: number }
  /** 0 = full-saturation day plant art; 1 = fully night-dimmed plants. */
  plantDimBlend?: number
}

export const EMBER_DUSK: ScenePalette = {
  sky: ['#1b0e33', '#4d2450', '#93424f', '#d97a4e', '#ffc987'],
  cloud: '#ffd9a0',
  stars: 16,
  sun: { x: 840, y: 436, r: 40, disk: '#ffe3b0', glow: '#ff9d5c' },
  hills: ['#7c4059', '#4e2749', '#2c163c'],
  bank: '#170d26',
  sil: '#150a22',
  silSoft: '#241536',
  rim: '#ffb877',
  glow: '#ffd9a0',
  accent: '#ff8f5e',
  fire: '#ffcf8f',
  fireN: 6,
  birds: '#241028',
  ripple: '#ffcf9f',
  waterTint: ['#d97a4e', '#1a0f2b'],
  leafAlpha: 1,
}

export const TWILIGHT_GARDEN: ScenePalette = {
  sky: ['#070619', '#1d1748', '#472a68', '#8a4a7d', '#d98a86'],
  cloud: '#c98adf',
  stars: 70,
  sun: null,
  venus: { x: 930, y: 220 },
  hills: ['#54306b', '#38204f', '#20123a'],
  bank: '#130a24',
  sil: '#0e081f',
  silSoft: '#1d1234',
  rim: '#c98adf',
  glow: '#ff9ecf',
  accent: '#9f7bff',
  fire: '#ffd76a',
  fireN: 18,
  birds: '#160c24',
  ripple: '#c98adf',
  waterTint: ['#8a4a7d', '#0d0820'],
  birdAlpha: 0.45,
}

export const MOONLIT_WATER: ScenePalette = {
  sky: ['#04060f', '#091426', '#122c44', '#274f68', '#8fb4c8'],
  cloud: '#9fc4d8',
  stars: 120,
  moon: { x: 320, y: 150, r: 34 },
  hills: ['#2b4c63', '#1a3550', '#0e2136'],
  bank: '#060e18',
  sil: '#040a13',
  silSoft: '#10222f',
  rim: '#a8d4e8',
  glow: '#d6ecff',
  accent: '#9fc4d8',
  fire: '#bfe3ff',
  fireN: 8,
  birds: '#0a1420',
  ripple: '#bfe3f0',
  waterTint: ['#274f68', '#04070d'],
  shootAlpha: 1,
  birdAlpha: 0,
}

const DAWN_BASE: GardenPalette = {
  sky: ['#2e2450', '#6d4a74', '#b06b72', '#e89a6a', '#ffd9a4'],
  cloud: '#ffd9c2',
  hills: ['#8a5a72', '#5d3d5e', '#3a2547'],
  bank: '#20142f',
  sil: '#221436',
  silSoft: '#332048',
  rim: '#ffd3a0',
  glow: '#ffe6bd',
  accent: '#ff9d7e',
  fire: '#ffcf8f',
  birds: '#2a1830',
  ripple: '#ffd9b0',
  waterTint: ['#e89a6a', '#241736'],
}

const SEASON_DAYS: Record<Season, GardenPalette> = {
  summer: {
    sky: ['#3f86bd', '#63a3cd', '#8fc2dd', '#bcdde9', '#eef0d8'],
    cloud: '#ffffff',
    hills: ['#7ba489', '#527d67', '#315546'],
    bank: '#22392e',
    sil: '#1c3a2c',
    silSoft: '#2c4f3d',
    rim: '#fff3c4',
    glow: '#ffefb0',
    accent: '#e8b84a',
    fire: '#ffd76a',
    birds: '#27424a',
    ripple: '#e8f4f8',
    waterTint: ['#8fc2dd', '#274a54'],
  },
  spring: {
    sky: ['#5b9ac6', '#7fb5d6', '#a8d2e4', '#cfe8ec', '#f4f2da'],
    cloud: '#ffffff',
    hills: ['#8fbc82', '#639362', '#3d6a4e'],
    bank: '#28422f',
    sil: '#22422c',
    silSoft: '#35583e',
    rim: '#ffd9e4',
    glow: '#ffc9dd',
    accent: '#ff9ebd',
    fire: '#ffd76a',
    birds: '#2d4a50',
    ripple: '#eaf6f4',
    waterTint: ['#a8d2e4', '#2b5254'],
  },
  autumn: {
    sky: ['#6a7ba8', '#9489a8', '#c29a86', '#e2b382', '#f4d9a2'],
    cloud: '#f4e2c4',
    hills: ['#b08654', '#87583a', '#583a26'],
    bank: '#3a2a1a',
    sil: '#33220f',
    silSoft: '#4a3520',
    rim: '#ffce8a',
    glow: '#ffe3a8',
    accent: '#e86f3a',
    fire: '#ffd76a',
    birds: '#3c2e22',
    ripple: '#f2e2c4',
    waterTint: ['#c29a86', '#41302a'],
  },
  winter: {
    sky: ['#7d94ad', '#9cb2c4', '#bfd0da', '#dde8ec', '#f4f7f4'],
    cloud: '#ffffff',
    hills: ['#b5c8d4', '#8ba4b6', '#5e7d94'],
    bank: '#4e6a80',
    sil: '#2c4257',
    silSoft: '#44607a',
    rim: '#ffffff',
    glow: '#e8f4ff',
    accent: '#a8ccec',
    fire: '#bfe3ff',
    birds: '#33485c',
    ripple: '#ffffff',
    waterTint: ['#bfd0da', '#33505e'],
  },
}

const SEASON_DAWNS: Record<Season, GardenPalette> = {
  summer: DAWN_BASE,
  spring: DAWN_BASE,
  autumn: { ...DAWN_BASE, hills: ['#96684e', '#6b4634', '#452c1e'] },
  winter: {
    ...DAWN_BASE,
    sky: ['#3c4468', '#6d6a8c', '#a88ba0', '#d4ac9e', '#f0d8c4'],
    hills: ['#8ea2b4', '#6a8298', '#47637c'],
    bank: '#3e5468',
    sil: '#2c4257',
    silSoft: '#44607a',
  },
}

export function getSeasonDayPalette(season: Season): GardenPalette {
  return SEASON_DAYS[season] ?? SEASON_DAYS.summer
}

export function getSeasonDawnPalette(season: Season): GardenPalette {
  return SEASON_DAWNS[season] ?? DAWN_BASE
}

export function stripPalette(Q: GardenPalette): GardenPalette {
  return {
    cloud: Q.cloud,
    bank: Q.bank,
    sil: Q.sil,
    silSoft: Q.silSoft,
    rim: Q.rim,
    glow: Q.glow,
    accent: Q.accent,
    fire: Q.fire,
    birds: Q.birds,
    ripple: Q.ripple,
    sky: Q.sky,
    hills: Q.hills,
    waterTint: Q.waterTint,
  }
}

export function getTodKeyframes(season: Season): [number, GardenPalette][] {
  const night = stripPalette(MOONLIT_WATER)
  const dusk = stripPalette(EMBER_DUSK)
  const day = getSeasonDayPalette(season)
  const dawn = getSeasonDawnPalette(season)
  return [
    [0, night],
    [4.5, night],
    [6.5, dawn],
    [9, day],
    [16.5, day],
    [18.5, dusk],
    [20.5, night],
    [24, night],
  ]
}