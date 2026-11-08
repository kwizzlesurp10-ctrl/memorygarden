import type { HybridMotif, MotifPath } from '@/lib/types'

type Glyph = { label: string; paths: MotifPath[] }

function g(label: string, paths: MotifPath[]): Glyph {
  return { label, paths }
}

/** Bold 24×24 icon glyphs for semantic dream fallback and AI repair. */
export const MOTIF_GLYPHS: Record<string, Glyph> = {
  heart: g('heart', [{ d: 'M12 20 C5 14 4 8 8 6 C10 5 12 7 12 9 C12 7 14 5 16 6 C20 8 19 14 12 20 Z', fill: 'glow', stroke: 'none', sw: 0 }]),
  star: g('star', [{ d: 'M12 3 L14 9.5 L21 9.5 L15.5 13.5 L17.5 20 L12 16 L6.5 20 L8.5 13.5 L3 9.5 L10 9.5 Z', fill: 'accent', stroke: 'none', sw: 0 }]),
  moon: g('moon', [{ d: 'M16 4 A 8.5 8.5 0 1 0 16 20 A 7 7 0 1 1 16 4 Z', fill: 'glow', stroke: 'none', sw: 0 }]),
  sun: g('sun', [
    { d: 'M12 8 A 4 4 0 1 1 12 16 A 4 4 0 1 1 12 8 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.2 4.2 L6.4 6.4 M17.6 17.6 L19.8 19.8 M4.2 19.8 L6.4 17.6 M17.6 6.4 L19.8 4.2', fill: 'none', stroke: 'glow', sw: 1.4 },
  ]),
  cloud: g('cloud', [{ d: 'M7 16 H17 A3.5 3.5 0 0 0 17 10 A4 4 0 0 0 11 7.5 A3 3 0 0 0 7 10.5 A2.8 2.8 0 0 0 7 16 Z', fill: 'rim', stroke: 'none', sw: 0 }]),
  rain: g('rain', [
    { d: 'M6 11 H16 A3 3 0 0 0 16 8 A3.2 3.2 0 0 0 10.5 6 A2.5 2.5 0 0 0 6 8.5 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M8 14 L7 18 M11 14 L10 18 M14 14 L13 18', fill: 'none', stroke: 'accent', sw: 1.5 },
  ]),
  snowflake: g('snowflake', [
    { d: 'M12 3 V21 M3 12 H21 M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5', fill: 'none', stroke: 'glow', sw: 1.6 },
    { d: 'M12 5 L10.5 7 L12 8.5 L13.5 7 Z M12 16 L10.5 14 L12 12.5 L13.5 14 Z', fill: 'accent', stroke: 'none', sw: 0 },
  ]),
  flame: g('flame', [{ d: 'M12 21 C8 17 7 13 9 10 C10 9 11 11 12 13 C13 10 15 8 16 10 C18 13 16 17 12 21 Z', fill: 'accent', stroke: 'rim', sw: 0.5 }]),
  'music note': g('music note', [
    { d: 'M15 5 V14 C15 16 13.5 17.5 11.5 17.5 C9.5 17.5 8 16 8 14 C8 12 9.5 10.5 11.5 10.5 C12.3 10.5 13 10.8 13.5 11.2 V7 H17 V5 H15 Z', fill: 'glow', stroke: 'none', sw: 0 },
  ]),
  guitar: g('guitar', [
    { d: 'M14 4 L16 6 L11 14 C9.5 16.5 11 19 13.5 19 C15.5 19 17 17 16 15 L14 4 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M7 15 A3 3 0 1 0 7 21 A3 3 0 1 0 7 15 Z', fill: 'none', stroke: 'accent', sw: 1.5 },
  ]),
  book: g('book', [{ d: 'M6 5 H14 C16 5 17 6 17 8 V19 H7 V6 C7 5.5 6.5 5 6 5 Z M7 19 H17 C18 19 19 18 19 17 V7', fill: 'rim', stroke: 'glow', sw: 0.8 }]),
  'coffee cup': g('coffee cup', [
    { d: 'M6 9 H14 V17 C14 18.5 13 19.5 11.5 19.5 H8.5 C7 19.5 6 18.5 6 17 V9 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M14 11 H16 C17.5 11 18.5 12 18.5 13.5 C18.5 15 17.5 16 16 16 H14', fill: 'none', stroke: 'accent', sw: 1.2 },
    { d: 'M8 7 L9 5 M11 7 L11 4 M13 7 L14 5', fill: 'none', stroke: 'glow', sw: 1 },
  ]),
  cat: g('cat', [
    { d: 'M8 10 L6 5 L10 8 Z M16 10 L18 5 L14 8 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 18 C7 18 5 14 5 11 A4.5 4.5 0 0 1 12 8 A4.5 4.5 0 0 1 19 11 C19 14 17 18 12 18 Z', fill: 'glow', stroke: 'sil', sw: 0.6 },
    { d: 'M9 12 H9.5 M14.5 12 H15 M10 15 Q12 16.5 14 15', fill: 'none', stroke: 'sil', sw: 0.9 },
  ]),
  dog: g('dog', [
    { d: 'M6 11 C6 8 8 6 11 7 L9 4 L12 7', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 18 C7 18 4.5 14.5 5 11 A5 5 0 0 1 12 8 A5 5 0 0 1 19 11 C19.5 14.5 17 18 12 18 Z', fill: 'glow', stroke: 'sil', sw: 0.6 },
    { d: 'M15 5 L17 8 L14 9', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
  paw: g('paw', [
    { d: 'M12 15 A3.2 3.2 0 1 1 12 21 A3.2 3.2 0 1 1 12 15 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M7 11 A1.8 1.8 0 1 1 7 14.5 M10 9 A1.8 1.8 0 1 1 10 12.5 M14 9 A1.8 1.8 0 1 1 14 12.5 M17 11 A1.8 1.8 0 1 1 17 14.5', fill: 'glow', stroke: 'none', sw: 0 },
  ]),
  bird: g('bird', [
    { d: 'M4 12 C8 10 10 8 14 9 C16 9.5 17 11 16 12 C14 13 11 13 8 14 C6 15 4 14 4 12 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M14 9 L18 7 L16 10', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
  fish: g('fish', [
    { d: 'M6 12 C9 9 13 9 16 12 C13 15 9 15 6 12 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M16 12 L20 9 L20 15 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M9 12 A1 1 0 1 1 9 14', fill: 'sil', stroke: 'none', sw: 0 },
  ]),
  butterfly: g('butterfly', [
    { d: 'M12 10 V16', fill: 'none', stroke: 'sil', sw: 1.2 },
    { d: 'M12 12 C9 9 5 9 5 12 C5 15 9 15 12 12 Z M12 12 C15 9 19 9 19 12 C19 15 15 15 12 12 Z', fill: 'accent', stroke: 'none', sw: 0 },
  ]),
  bee: g('bee', [
    { d: 'M12 8 A4 4 0 1 1 12 16 A4 4 0 1 1 12 8 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M8 10 H16 M8 13 H16', fill: 'none', stroke: 'sil', sw: 1 },
    { d: 'M14 7 L17 5 L15 8', fill: 'none', stroke: 'rim', sw: 1 },
  ]),
  house: g('house', [
    { d: 'M12 4 L20 11 V20 H4 V11 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M10 20 V14 H14 V20', fill: 'sil', stroke: 'none', sw: 0 },
  ]),
  tree: g('tree', [
    { d: 'M11 20 H13 V14 H11 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 13 C8 13 6 10 7 8 C6 6 8 4 12 4 C16 4 18 6 17 8 C18 10 16 13 12 13 Z', fill: 'glow', stroke: 'none', sw: 0 },
  ]),
  mountain: g('mountain', [{ d: 'M3 20 L9 9 L12 14 L16 7 L21 20 Z', fill: 'rim', stroke: 'accent', sw: 0.6 }]),
  wave: g('wave', [{ d: 'M3 14 C6 11 9 17 12 14 C15 11 18 17 21 14 V20 H3 Z', fill: 'accent', stroke: 'none', sw: 0 }]),
  anchor: g('anchor', [
    { d: 'M12 4 A2 2 0 1 1 12 8 A2 2 0 1 1 12 4 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M12 8 V18 M8 14 C8 17 16 17 16 14 M6 18 C6 20.5 9.5 21 12 21 C14.5 21 18 20.5 18 18', fill: 'none', stroke: 'rim', sw: 1.4 },
  ]),
  boat: g('boat', [
    { d: 'M5 16 L19 16 L16 20 H8 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 6 V16 M12 8 L16 12', fill: 'none', stroke: 'accent', sw: 1.2 },
  ]),
  car: g('car', [
    { d: 'M5 14 H19 L17 10 H8 L5 14 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M7 16 A2 2 0 1 1 7 20 A2 2 0 1 1 7 16 M17 16 A2 2 0 1 1 17 20 A2 2 0 1 1 17 16', fill: 'sil', stroke: 'none', sw: 0 },
  ]),
  plane: g('plane', [{ d: 'M3 12 L14 12 L12 9 L20 12 L12 15 L14 12', fill: 'accent', stroke: 'rim', sw: 0.5 }]),
  rocket: g('rocket', [
    { d: 'M12 3 C10 7 10 12 12 16 C14 12 14 7 12 3 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M8 14 L6 18 M16 14 L18 18', fill: 'none', stroke: 'accent', sw: 1.2 },
    { d: 'M10 18 H14 V20 H10 Z', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
  crown: g('crown', [{ d: 'M5 17 V12 L8 15 L12 8 L16 15 L19 12 V17 Z', fill: 'accent', stroke: 'rim', sw: 0.6 }]),
  diamond: g('diamond', [{ d: 'M12 3 L20 12 L12 21 L4 12 Z', fill: 'accent', stroke: 'none', sw: 0 }]),
  key: g('key', [
    { d: 'M8 10 A3 3 0 1 1 8 16 A3 3 0 1 1 8 10 Z', fill: 'none', stroke: 'glow', sw: 1.5 },
    { d: 'M11 13 H18 V15 H15 V17 H13 V15 H11', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
  lock: g('lock', [
    { d: 'M9 11 V9 A3 3 0 0 1 15 9 V11', fill: 'none', stroke: 'rim', sw: 1.4 },
    { d: 'M7 11 H17 V19 H7 Z', fill: 'glow', stroke: 'none', sw: 0 },
  ]),
  gift: g('gift', [
    { d: 'M5 11 H19 V20 H5 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 11 V20 M5 14 H19 M9 11 C9 9 10 7 12 7 C14 7 15 9 15 11', fill: 'none', stroke: 'accent', sw: 1.2 },
  ]),
  cake: g('cake', [
    { d: 'M6 16 H18 V20 H6 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M7 12 H17 V16 H7 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M12 8 V12 M11 7 H13', fill: 'none', stroke: 'accent', sw: 1 },
  ]),
  apple: g('apple', [{ d: 'M12 20 C8 20 6 16 6 13 C6 9 9 6 12 6 C15 6 18 9 18 13 C18 16 16 20 12 20 Z M12 6 C12 4 13 3 14 3', fill: 'accent', stroke: 'rim', sw: 0.6 }]),
  cherry: g('cherry', [
    { d: 'M8 14 A3.5 3.5 0 1 1 8 21 A3.5 3.5 0 1 1 8 14 M16 15 A3 3 0 1 1 16 21 A3 3 0 1 1 16 15', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M12 6 C10 9 8 12 8 14 M12 5 C13 8 15 12 16 15', fill: 'none', stroke: 'rim', sw: 1 },
  ]),
  leaf: g('leaf', [{ d: 'M12 20 C6 16 5 10 8 6 C10 4 12 6 12 9 V20 Z M12 9 C14 7 16 8 17 10', fill: 'glow', stroke: 'rim', sw: 0.5 }]),
  flower: g('flower', [
    { d: 'M12 9 A2.5 2.5 0 1 1 12 14 A2.5 2.5 0 1 1 12 9 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M12 5 A2 2 0 0 1 12 9 A2 2 0 0 1 12 5 M12 14 A2 2 0 0 1 12 18 A2 2 0 0 1 12 14 M5 11.5 A2 2 0 0 1 9 11.5 A2 2 0 0 1 5 11.5 M15 11.5 A2 2 0 0 1 19 11.5 A2 2 0 0 1 15 11.5', fill: 'glow', stroke: 'none', sw: 0 },
  ]),
  camera: g('camera', [
    { d: 'M5 9 H19 V18 H5 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M9 9 L10 7 H14 L15 9 M12 14 A2.5 2.5 0 1 1 12 19 A2.5 2.5 0 1 1 12 14', fill: 'none', stroke: 'glow', sw: 1.2 },
  ]),
  'game controller': g('game controller', [
    { d: 'M6 12 C6 9 8 7 12 7 C16 7 18 9 18 12 C18 15.5 16 17 12 17 C8 17 6 15.5 6 12 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M9 12 H11 M10 11 V13 M14.5 11.5 A1 1 0 1 1 14.5 13.5 M16.5 12.5 A1 1 0 1 1 16.5 14.5', fill: 'none', stroke: 'accent', sw: 1 },
  ]),
  ball: g('ball', [{ d: 'M12 4 A8 8 0 1 1 12 20 A8 8 0 1 1 12 4 Z', fill: 'accent', stroke: 'glow', sw: 0.8 }]),
  trophy: g('trophy', [
    { d: 'M8 6 H16 V10 C16 13 14.5 15 12 15 C9.5 15 8 13 8 10 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M6 8 H8 M16 8 H18 M8 6 V5 H16 V6', fill: 'none', stroke: 'rim', sw: 1 },
    { d: 'M10 15 H14 V18 H10 Z M9 18 H15 V20 H9 Z', fill: 'accent', stroke: 'none', sw: 0 },
  ]),
  'graduation cap': g('graduation cap', [
    { d: 'M4 11 L12 7 L20 11 L12 15 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M18 11 V15 M18 15 C17 16.5 14.5 17.5 12 17.5 C9.5 17.5 7 16.5 6 15', fill: 'none', stroke: 'accent', sw: 1 },
  ]),
  baby: g('baby', [
    { d: 'M12 17 C8 17 6 14 6 11 A4.5 4.5 0 0 1 12 7 A4.5 4.5 0 0 1 18 11 C18 14 16 17 12 17 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M9 5 C9 3 10 2 11 3 M15 5 C15 3 14 2 13 3', fill: 'none', stroke: 'rim', sw: 1 },
  ]),
  ring: g('ring', [{ d: 'M12 5 A7 7 0 1 0 12 19 A7 7 0 1 0 12 5 Z', fill: 'none', stroke: 'glow', sw: 2.5 }]),
  droplet: g('droplet', [{ d: 'M12 3 C16 9 18 12 18 15 A6 6 0 1 1 6 15 C6 12 8 9 12 3 Z', fill: 'rim', stroke: 'none', sw: 0 }]),
  rose: g('rose', [
    { d: 'M12 19 C9 17 8 14 9 11 C10 9 11 10 12 12 C13 10 14 9 15 11 C16 14 15 17 12 19 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M11 19 V21 H13 V19', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
}

export const MOTIF_SYNONYMS: Record<string, string> = {
  kitty: 'cat',
  kitten: 'cat',
  feline: 'cat',
  puppy: 'dog',
  canine: 'dog',
  pooch: 'dog',
  song: 'music note',
  music: 'music note',
  melody: 'music note',
  tune: 'music note',
  ocean: 'wave',
  waves: 'wave',
  sea: 'wave',
  rainy: 'rain',
  rained: 'rain',
  storm: 'rain',
  drizzle: 'rain',
  coffee: 'coffee cup',
  espresso: 'coffee cup',
  latte: 'coffee cup',
  mug: 'coffee cup',
  videogame: 'game controller',
  controller: 'game controller',
  gaming: 'game controller',
  soccer: 'ball',
  football: 'ball',
  basketball: 'ball',
  grad: 'graduation cap',
  diploma: 'graduation cap',
  infant: 'baby',
  newborn: 'baby',
  sailboat: 'boat',
  ship: 'boat',
  automobile: 'car',
  spaceship: 'rocket',
  spacecraft: 'rocket',
  fire: 'flame',
  campfire: 'flame',
  pawprint: 'paw',
  paws: 'paw',
  crescent: 'moon',
  lunar: 'moon',
  solar: 'sun',
  snowy: 'snowflake',
  snow: 'snowflake',
  love: 'heart',
  petal: 'flower',
  bloom: 'flower',
  blossoms: 'flower',
}

export const MOTIF_PHRASES: Record<string, string> = {
  'cherry blossom': 'flower',
  'music note': 'music note',
  'coffee cup': 'coffee cup',
  'game controller': 'game controller',
  'graduation cap': 'graduation cap',
}

export function motifFromKey(key: string): HybridMotif {
  const glyph = MOTIF_GLYPHS[key]
  if (!glyph) return MOTIF_GLYPHS.star!
  return { label: glyph.label, paths: glyph.paths.map((p) => ({ ...p })) }
}

export function resolveMotifKey(token: string): string | null {
  const t = token.toLowerCase()
  if (MOTIF_GLYPHS[t]) return t
  return MOTIF_SYNONYMS[t] ?? null
}
