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
    { d: 'M16 4 V15 C16 17.2 14.4 19 12.2 19 C10 19 8.4 17.2 8.4 15 C8.4 12.8 10 11 12.2 11 C13 11 13.8 11.3 14.5 11.8 V6 H18 V4 H16 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M14.5 6 H16 V4', fill: 'none', stroke: 'rim', sw: 0 },
  ]),
  guitar: g('guitar', [
    { d: 'M13 3 H15 V5 L14 6 L13 3 Z M9 11 C6.5 11 5 13 5 15.5 C5 18.5 7 20.5 10 20.5 C12.5 20.5 14 18.5 14 16 L16 6 L14 4 L11 10 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M9 15 A3.5 3.5 0 1 0 9 22 A3.5 3.5 0 1 0 9 15 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M7 16 H13', fill: 'none', stroke: 'glow', sw: 1.2 },
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
    { d: 'M12 3 L21 11 V20 H3 V11 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M9 20 V13 H15 V20', fill: 'sil', stroke: 'none', sw: 0 },
    { d: 'M11 13 H13 V20', fill: 'none', stroke: 'glow', sw: 0.8 },
  ]),
  tree: g('tree', [
    { d: 'M11 20 H13 V14 H11 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 13 C8 13 6 10 7 8 C6 6 8 4 12 4 C16 4 18 6 17 8 C18 10 16 13 12 13 Z', fill: 'glow', stroke: 'none', sw: 0 },
  ]),
  mountain: g('mountain', [{ d: 'M3 20 L9 9 L12 14 L16 7 L21 20 Z', fill: 'rim', stroke: 'accent', sw: 0.6 }]),
  wave: g('wave', [{ d: 'M3 14 C6 11 9 17 12 14 C15 11 18 17 21 14 V20 H3 Z', fill: 'accent', stroke: 'none', sw: 0 }]),
  anchor: g('anchor', [
    { d: 'M12 4 A2.2 2.2 0 1 1 12 8.4 A2.2 2.2 0 1 1 12 4 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M12 8 V18', fill: 'none', stroke: 'rim', sw: 2 },
    { d: 'M7 14 C7 17.5 17 17.5 17 14', fill: 'none', stroke: 'rim', sw: 2 },
    { d: 'M6 18 C6 21 9.5 22 12 22 C14.5 22 18 21 18 18', fill: 'none', stroke: 'glow', sw: 2 },
  ]),
  boat: g('boat', [
    { d: 'M4 15 C6 13 8 12 12 12 C16 12 18 13 20 15 L17 20 H7 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 5 V15 M12 7 L17 12', fill: 'none', stroke: 'accent', sw: 1.8 },
    { d: 'M8 15 H16', fill: 'none', stroke: 'glow', sw: 1.2 },
  ]),
  car: g('car', [
    { d: 'M4 14 H20 V17 H4 Z M6 14 L8 10 H16 L18 14', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M8 17 A2.2 2.2 0 1 1 8 21.4 A2.2 2.2 0 1 1 8 17 M16 17 A2.2 2.2 0 1 1 16 21.4 A2.2 2.2 0 1 1 16 17', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M10 12 H14', fill: 'none', stroke: 'accent', sw: 1.2 },
  ]),
  plane: g('plane', [
    { d: 'M12 3 L14 10 H19 L16 12 L18 19 L12 15 L6 19 L8 12 L5 10 H10 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M11 15 H13 V19', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
  rocket: g('rocket', [
    { d: 'M12 2 C9 8 9 13 11 17 L12 19 L13 17 C15 13 15 8 12 2 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M9 14 L6 20 M15 14 L18 20', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M10 20 H14 V21 H10 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 7 A1.6 1.6 0 1 1 12 10.2 A1.6 1.6 0 1 1 12 7 Z', fill: 'sil', stroke: 'none', sw: 0 },
  ]),
  crown: g('crown', [
    { d: 'M4 17 V13 L7 15 L10 9 L12 12 L14 9 L17 15 L20 13 V17 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M4 17 H20 V19 H4 Z', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
  diamond: g('diamond', [{ d: 'M12 3 L20 12 L12 21 L4 12 Z', fill: 'accent', stroke: 'none', sw: 0 }]),
  key: g('key', [
    { d: 'M8 9 A3.5 3.5 0 1 1 8 16 A3.5 3.5 0 1 1 8 9 Z', fill: 'none', stroke: 'glow', sw: 2.2 },
    { d: 'M11 12.5 H18 V14.5 H16 V17 H14 V14.5 H11', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M16 17 V19', fill: 'none', stroke: 'rim', sw: 1.4 },
  ]),
  lock: g('lock', [
    { d: 'M9 11 V9 A3 3 0 0 1 15 9 V11', fill: 'none', stroke: 'rim', sw: 1.4 },
    { d: 'M7 11 H17 V19 H7 Z', fill: 'glow', stroke: 'none', sw: 0 },
  ]),
  gift: g('gift', [
    { d: 'M4 11 H20 V20 H4 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 11 V20 M4 14.5 H20', fill: 'none', stroke: 'accent', sw: 1.6 },
    { d: 'M8.5 11 C8.5 8.5 10 7 12 7 C14 7 15.5 8.5 15.5 11', fill: 'none', stroke: 'glow', sw: 1.6 },
    { d: 'M10 7 V11 M14 7 V11', fill: 'none', stroke: 'glow', sw: 1.2 },
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
    { d: 'M4 9 H8 L9.5 6.5 H14.5 L16 9 H20 V18 H4 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M12 14 A3.2 3.2 0 1 1 12 20.4 A3.2 3.2 0 1 1 12 14 Z', fill: 'none', stroke: 'glow', sw: 1.6 },
    { d: 'M12 14 A1.8 1.8 0 1 1 12 17.6 A1.8 1.8 0 1 1 12 14 Z', fill: 'accent', stroke: 'none', sw: 0 },
  ]),
  'game controller': g('game controller', [
    { d: 'M6 11 C6 8 8.5 6 12 6 C15.5 6 18 8 18 11 C18 15 16.5 18 12 18 C7.5 18 6 15 6 11 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M4 12 C4 10 5 9 7 9 H6 C6 7 7 6 9 6', fill: 'none', stroke: 'rim', sw: 1.4 },
    { d: 'M18 12 C18 10 17 9 15 9 H16 C16 7 15 6 13 6', fill: 'none', stroke: 'rim', sw: 1.4 },
    { d: 'M9.5 12 H10.5 M10 11.5 V12.5', fill: 'none', stroke: 'accent', sw: 1.3 },
    { d: 'M14.5 11 A1.1 1.1 0 1 1 14.5 13.2 M16.5 12.5 A1.1 1.1 0 1 1 16.5 14.7', fill: 'none', stroke: 'glow', sw: 1.3 },
  ]),
  ball: g('ball', [{ d: 'M12 4 A8 8 0 1 1 12 20 A8 8 0 1 1 12 4 Z', fill: 'accent', stroke: 'glow', sw: 0.8 }]),
  trophy: g('trophy', [
    { d: 'M7 5 H17 V6 H7 Z M8 6 H16 V10 C16 13.5 14.2 16 12 16 C9.8 16 8 13.5 8 10 Z', fill: 'glow', stroke: 'none', sw: 0 },
    { d: 'M5 7 H8 V10 C5.5 10 5 8.5 5 7 Z M19 7 H16 V10 C18.5 10 19 8.5 19 7 Z', fill: 'accent', stroke: 'none', sw: 0 },
    { d: 'M10 16 H14 V19 H10 Z M9 19 H15 V21 H9 Z', fill: 'rim', stroke: 'none', sw: 0 },
  ]),
  'graduation cap': g('graduation cap', [
    { d: 'M3 11 L12 6 L21 11 L12 16 Z', fill: 'rim', stroke: 'none', sw: 0 },
    { d: 'M19 11 V16', fill: 'none', stroke: 'accent', sw: 1.6 },
    { d: 'M7 16 C9 18 15 18 17 16', fill: 'none', stroke: 'glow', sw: 1.6 },
    { d: 'M19 16 L21 21', fill: 'none', stroke: 'accent', sw: 1.2 },
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
  graduation: 'graduation cap',
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
  cottage: 'house',
  storybook: 'house',
  chord: 'guitar',
  comet: 'rocket',
  kite: 'star',
  shell: 'wave',
  ribbon: 'gift',
  basket: 'gift',
  aurora: 'wave',
  orchid: 'flower',
  succulent: 'leaf',
  daisy: 'flower',
  braided: 'heart',
  friendship: 'heart',
  cottagevine: 'house',
}

export const MOTIF_PHRASES: Record<string, string> = {
  'cherry blossom': 'flower',
  'music note': 'music note',
  'coffee cup': 'coffee cup',
  'game controller': 'game controller',
  'graduation cap': 'graduation cap',
  'storybook cottage': 'house',
  'storybook cottage vine': 'house',
  'comet wish rocket': 'rocket',
  'twilight guitar chord': 'guitar',
  'holiday gift ribbon': 'gift',
  'gratitude harvest basket': 'gift',
  'ocean june shell': 'wave',
  'northern lights aurora': 'wave',
  'windy march kite': 'star',
  'friendship braided vine': 'heart',
  'garden peace daisy': 'flower',
  'frosted pine tree': 'tree',
  'mountain trail pine': 'mountain',
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
