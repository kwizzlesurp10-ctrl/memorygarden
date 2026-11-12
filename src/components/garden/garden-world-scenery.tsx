import type { ReactNode } from 'react'
import type { ArtStyle, GardenLandscapeView, ShedStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { projectWorldToScene } from '@/lib/garden/landscape-world'
import {
  WORLD_COTTAGE,
  WORLD_DISTANT_TREES,
  WORLD_PROPS,
} from '@/lib/garden/landscape-world-layout'
import { indexToPlantStage } from '@/lib/garden/stage'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { shedDrawScale, shedForFacing } from '@/components/garden/shed-facing'
import { cattail, grassTuft, rock } from '@/components/garden/scenery'
import { gardenRng } from '@/lib/garden/prng'
import type { WorldPlantRenderItem } from '@/components/garden/garden-world-plants'

export interface WorldSceneryOptions {
  /** False for new-garden starter scenes: only elder + mushrooms (no distant trees). */
  includeDistantTrees?: boolean
}

export function buildWorldSceneryItems(
  view: GardenLandscapeView,
  palette: ScenePalette,
  rim: number,
  motion: boolean,
  gardenSeed: number,
  shedStyle: ShedStyle,
  onShedClick?: () => void,
  options?: WorldSceneryOptions,
  artStyle?: ArtStyle,
): WorldPlantRenderItem[] {
  const items: WorldPlantRenderItem[] = []
  const includeDistantTrees = options?.includeDistantTrees ?? true

  for (const tree of includeDistantTrees ? WORLD_DISTANT_TREES : []) {
    const proj = projectWorldToScene(tree, view, { objectYaw: tree.yaw, layer: 'far' })
    items.push({
      key: tree.id,
      depth: proj.depth - 500,
      node: (
        <g transform={`translate(${proj.x} ${proj.y}) scale(${proj.scale * tree.scale})`}>
          <SeededPlantSvg
            variety="tree"
            stage={indexToPlantStage(tree.stage)}
            geneticsSeed={tree.geneticsSeed}
            palette={palette}
            rimStrength={rim * 0.45}
            motion={false}
            facing={proj.facing}
            scale={1}
            artStyle={artStyle}
          />
        </g>
      ),
    })
  }

  const props =
    includeDistantTrees ? WORLD_PROPS : WORLD_PROPS.filter((p) => p.kind === 'cattail' || p.kind === 'rock')

  for (const prop of props) {
    const proj = projectWorldToScene(prop, view, { layer: 'near' })
    let inner: ReactNode
    if (prop.kind === 'rock') {
      inner = rock({ C: palette, rimStrength: rim, w: prop.width })
    } else if (prop.kind === 'cattail') {
      inner = cattail({ C: palette, rimStrength: rim, r: gardenRng(gardenSeed + prop.seed) })
    } else {
      inner = grassTuft({ C: palette, r: gardenRng(gardenSeed + prop.seed) })
    }
    items.push({
      key: prop.id,
      depth: proj.depth,
      node: (
        <g
          transform={`translate(${proj.x} ${proj.y}) scale(${proj.scale * (prop.kind === 'grass' || prop.kind === 'cattail' ? prop.scale : 1)})`}
        >
          {inner}
        </g>
      ),
    })
  }

  const shedProj = projectWorldToScene(WORLD_COTTAGE, view, {
    objectYaw: WORLD_COTTAGE.yaw,
    layer: 'near',
  })
  const shedY = shedProj.y
  const shedScale = shedProj.scale * shedDrawScale(shedProj.facing)
  const shedFootprint =
    shedProj.facing === 'front' || shedProj.facing === 'back' ? 54 : 58
  const shedX = Math.max(shedFootprint * shedScale * 0.58, shedProj.x)
  const meadowScale = view === 'meadow' && shedX > shedProj.x ? shedScale * 0.92 : shedScale
  items.push({
    key: WORLD_COTTAGE.id,
    depth: shedProj.depth + 2,
    node: (
      <g
        transform={`translate(${shedX} ${shedY}) scale(${meadowScale})`}
        style={{ cursor: onShedClick ? 'pointer' : undefined }}
        onClick={onShedClick}
        role={onShedClick ? 'button' : undefined}
        aria-label={onShedClick ? 'Open storage shed' : undefined}
        tabIndex={onShedClick ? 0 : undefined}
        onKeyDown={
          onShedClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') onShedClick()
              }
            : undefined
        }
      >
        {shedForFacing(shedStyle, shedProj.facing, palette, rim, motion)}
      </g>
    ),
  })

  return items
}
