import type { ReactNode } from 'react'
import type { ArtStyle, GardenLandscapeView, GardenStarterDecor } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { projectWorldToScene } from '@/lib/garden/landscape-world'
import {
  starterMushroomLayer,
  starterMushroomWorldDrawScale,
  starterMushroomWzBounds,
} from '@/lib/garden/starter-mushroom-scale'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'

export interface WorldPlantRenderItem {
  key: string
  depth: number
  node: ReactNode
}

export function buildStarterWorldPlants(
  decor: GardenStarterDecor | undefined,
  view: GardenLandscapeView,
  palette: ScenePalette,
  rim: number,
  motion: boolean,
  artStyle?: ArtStyle,
): WorldPlantRenderItem[] {
  if (!decor) return []
  const items: WorldPlantRenderItem[] = []

  const elder = projectWorldToScene({ wx: decor.elderTree.wx, wz: decor.elderTree.wz }, view)
  items.push({
    key: 'starter-elder',
    depth: elder.depth,
    node: (
      <g transform={`translate(${elder.x} ${elder.y}) scale(${elder.scale})`}>
        <SeededPlantSvg
          variety="tree"
          stage="elder"
          geneticsSeed={decor.elderTree.geneticsSeed}
          palette={palette}
          rimStrength={rim}
          motion={motion}
          scale={decor.elderTree.scale}
          layoutScale={elder.scale}
          facing={elder.facing}
          rimFromLeft={elder.rimFromLeft}
          artStyle={artStyle}
        />
      </g>
    ),
  })

  const { wzMin, wzMax } = starterMushroomWzBounds(decor.mushrooms)
  for (const shroom of decor.mushrooms) {
    const layer = starterMushroomLayer(shroom.wz)
    const proj = projectWorldToScene({ wx: shroom.wx, wz: shroom.wz }, view, { layer })
    const drawScale = starterMushroomWorldDrawScale(shroom.wz, proj.scale, shroom.scale, wzMin, wzMax)
    items.push({
      key: shroom.id,
      depth: proj.depth,
      node: (
        <g transform={`translate(${proj.x} ${proj.y}) scale(${proj.scale * shroom.scale * drawScale})`}>
          <SeededPlantSvg
            variety="mushroom"
            stage="mature"
            geneticsSeed={shroom.geneticsSeed}
            palette={palette}
            rimStrength={rim}
            motion={motion}
            scale={shroom.scale}
            layoutScale={proj.scale * drawScale}
            facing={proj.facing}
            rimFromLeft={proj.rimFromLeft}
            artStyle={artStyle}
          />
        </g>
      ),
    })
  }

  return items.sort((a, b) => a.depth - b.depth)
}

export function sortWorldLayer(nodes: WorldPlantRenderItem[]): ReactNode[] {
  return nodes.map((n) => <g key={n.key}>{n.node}</g>)
}
