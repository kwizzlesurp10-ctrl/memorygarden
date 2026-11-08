import { getLLMProvider } from '@/lib/llm-client'
import type { HybridGenome } from '@/lib/types'
import { localGenome, parseGenome } from './hybrid'

const DREAM_SYSTEM =
  'You are the dream-engine of MemoryGarden, a gentle app where memories grow as plants. You design fantastical hybrid plants. Respond with ONLY a valid JSON object — no markdown fences, no commentary.'

function dreamUserPrompt(idea: string): string {
  return (
    'A user offers this memory/idea/object: "' +
    idea +
    '"\n\nAnswer with the genome of a hybrid plant that embodies it:\n{\n "name": "evocative one-or-two-word plant name",\n "essence": "one gentle poetic sentence (max 20 words) connecting the plant to the idea",\n "base": one of ["flower","tree","succulent","vine","herb","wildflower","fern","mushroom","lotus"],\n "graft": a DIFFERENT entry from the same list,\n "palette": { "sil": "very dark silhouette hex", "rim": "luminous rim-light hex", "glow": "bright bloom-glow hex", "accent": "second bright hex" },\n "glowIntensity": 0 to 1,\n "adornment": one of ["motes","fireflies","rings","halo","none"],\n "seed": integer 1-9999,\n "motif": { "label": "the object depicted (2-4 words)", "paths": [ 2 to 5 of { "d": "SVG path data drawn inside a 0-24 box, object centered on (12,12) and filling most of the box", "fill": one of ["sil","rim","glow","accent","none"], "stroke": one of the same tokens or "none", "sw": stroke width 0-3 } ] }\n}\n\nRULES (strict):\n1. If the user names a COLOR (red, blue, gold, pink, etc.), the palette rim/glow/accent MUST clearly read as that hue — explicit color beats mood.\n2. If the user names a PLANT species (rose, oak, cactus, fern, etc.), set "base" to the closest listed variety — explicit plant beats mood.\n3. If the user names an OBJECT (cat, heart, coffee cup, wave, etc.), the motif MUST depict that object as a bold icon — explicit object beats mood.\n4. Mood words (calm, sad, joyful, love, spooky) may tune glow and adornment only when they do not conflict with explicit color/plant/object words.\n5. The motif is the MOST IMPORTANT part: chunky favicon-style SVG paths inside 0-24, readable at small size.'
  )
}

export interface DreamPlantResult {
  genome: HybridGenome
  source: 'ai' | 'local'
}

export async function dreamPlant(idea: string): Promise<DreamPlantResult> {
  const trimmed = idea.trim()

  try {
    const llm = getLLMProvider()
    if (!llm.available) throw new Error('llm unavailable')
    const raw = await llm.complete(`${DREAM_SYSTEM}\n\n${dreamUserPrompt(trimmed)}`, undefined, true)
    const genome = parseGenome(raw, trimmed)
    if (genome) {
      return { genome, source: 'ai' }
    }
  } catch {
    // fall through to local genome
  }

  return { genome: localGenome(trimmed), source: 'local' }
}
