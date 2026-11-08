import type { ReactNode } from 'react'
import type { GardenLandscapeView, GardenStarterDecor } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { projectWorldToScene, type WorldLayer } from '@/lib/garden/landscape-world'
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
          facing={elder.facing}
          rimFromLeft={elder.rimFromLeft}
        />
      </g>
    ),
  })

  for (const shroom of decor.mushrooms) {
    const layer: WorldLayer = shroom.wz < 0.26 ? 'far' : shroom.wz > 0.44 ? 'near' : 'mid'
    const proj = projectWorldToScene({ wx: shroom.wx, wz: shroom.wz }, view, { layer })
    items.push({
      key: shroom.id,
      depth: proj.depth,
      node: (
        <g transform={`translate(${proj.x} ${proj.y}) scale(${proj.scale * shroom.scale * 1.62})`}>
          <SeededPlantSvg
            variety="mushroom"
            stage="mature"
            geneticsSeed={shroom.geneticsSeed}
            palette={palette}
            rimStrength={rim}
            motion={motion}
            scale={1.12}
            facing={proj.facing}
            rimFromLeft={proj.rimFromLeft}
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
