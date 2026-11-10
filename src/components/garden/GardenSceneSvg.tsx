import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Candle, GardenLandscapeView, GardenStarterDecor, PlantedHybrid, ShedStyle } from '@/lib/types'
import { buildStarterWorldPlants, sortWorldLayer } from '@/components/garden/garden-world-plants'
import { buildWorldSceneryItems } from '@/components/garden/garden-world-scenery'
import { VIEW_FRAME, projectWorldToSky } from '@/lib/garden/landscape-world'
import {
  farHillPathD,
  hillPanX,
  hillWorldShift,
  midHillPathD,
  nearHillPathD,
} from '@/lib/garden/landscape-hills'
import { WORLD_SUN } from '@/lib/garden/landscape-world-layout'
import {
  getPondGeometry,
  getWaterReflectionCenterY,
  LANDSCAPE_HORIZON_Y,
  rippleIntersectsWater,
  resolveGardenLandscapeView,
} from '@/lib/garden/landscape-view'
import { bandWaterShimmerLinesD } from '@/lib/garden/landscape-pond'
import {
  AtmosphericGroundDetail,
  ForegroundBanks,
  PondShoreRim,
  SceneGroundPlane,
} from '@/components/garden/landscape-ground'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng } from '@/lib/garden/prng'
import { indexToPlantStage } from '@/lib/garden/stage'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { candle, cattail } from './scenery'
export { SCENE_W, SCENE_H, SCENE_HZ } from '@/lib/garden/scene-constants'
import { SCENE_H, SCENE_HZ, SCENE_W } from '@/lib/garden/scene-constants'

export interface GardenSceneSvgProps {
  palette: ScenePalette
  sceneKey: string
  gardenSeed: number
  rimStrength: number
  motion: boolean
  landscapeView?: GardenLandscapeView
  shedStyle: ShedStyle
  onShedClick?: () => void
  planted: PlantedHybrid[]
  candles: Candle[]
  memoryPlants?: ReactNode
  starterDecor?: GardenStarterDecor
  layerRefs?: {
    sky: RefObject<SVGGElement | null>
    far: RefObject<SVGGElement | null>
    mid: RefObject<SVGGElement | null>
    foreground: RefObject<SVGGElement | null>
  }
}

interface PlantAtProps {
  variety: SeededVariety
  stage: number
  palette: ScenePalette
  x: number
  y: number
  sc: number
  seedN: number
  rim: number
  motion: boolean
}

function PlantAt({ variety, stage, palette, x, y, sc, seedN, rim, motion }: PlantAtProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <SeededPlantSvg
        variety={variety}
        stage={indexToPlantStage(stage)}
        geneticsSeed={String(seedN)}
        palette={palette}
        rimStrength={rim}
        motion={motion}
        scale={sc}
      />
    </g>
  )
}

function hillPalette(palette: ScenePalette, hillIndex: number, extra?: Partial<ScenePalette>): ScenePalette {
  return {
    ...palette,
    sil: palette.hills[hillIndex],
    silSoft: palette.hills[hillIndex],
    ...extra,
  }
}

function Bird({
  bx,
  by,
  sc,
  birds,
  motion,
}: {
  bx: number
  by: number
  sc: number
  birds: string
  motion: boolean
}) {
  const glideStyle: CSSProperties | undefined = motion
    ? { animation: `mgGlide ${5 + (bx % 4)}s ease-in-out ${(by % 3) * 0.6}s infinite` }
    : undefined
  const flapStyle: CSSProperties | undefined = motion
    ? {
        animation: `mgFlap ${0.6 + (bx % 5) * 0.09}s ease-in-out ${(bx % 7) * 0.11}s infinite`,
        transformBox: 'fill-box',
        transformOrigin: '50% 100%',
      }
    : undefined

  return (
    <g transform={`translate(${bx} ${by}) scale(${sc})`}>
      <g style={glideStyle}>
        <g style={flapStyle}>
          <path
            d="M 0 0 Q 3.4 -3 6.8 -0.6 Q 10.2 -3 13.6 0"
            stroke={birds}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  )
}

interface SceneRngData {
  stars: { cx: number; cy: number; r: number; opacity: number; twinkle?: CSSProperties }[]
  ripples: { x1: number; y1: number; x2: number; y2: number; strokeWidth: number; opacity: number; style?: CSSProperties }[]
  shoots: { sx: number; sy: number; style: CSSProperties }[]
  mists: { cx: number; cy: number; rx: number; ry: number; style: CSSProperties }[]
  leaves: { lx: number; ly: number; style: CSSProperties }[]
  snow: { cx: number; cy: number; r: number; style: CSSProperties }[]
  petals: { px: number; py: number; style: CSSProperties }[]
  butterflies: { bx: number; by: number; flutterStyle: CSSProperties; wingStyle: CSSProperties; fill: string }[]
  fireflies: { fx: number; fy: number; outerStyle: CSSProperties; innerStyle: CSSProperties }[]
}

function computeSceneRngData(
  gardenSeed: number,
  sceneKey: string,
  palette: ScenePalette,
  motion: boolean,
): SceneRngData {
  const r = gardenRng(gardenSeed * 77 + sceneKey.charCodeAt(0) * 131)

  const stars: SceneRngData['stars'] = []
  for (let i = 0; i < (palette.stars ?? 0); i++) {
    const sx = r() * SCENE_W
    const sy = r() * r() * 330
    const sr = 0.5 + r() * 0.9
    stars.push({
      cx: sx,
      cy: sy,
      r: sr,
      opacity: 0.2 + r() * 0.55,
      twinkle: motion
        ? { animation: `mgTw ${2 + r() * 4}s ease-in-out ${r() * 4}s infinite alternate` }
        : undefined,
    })
  }

  const ripples: SceneRngData['ripples'] = []
  for (let i = 0; i < 16; i++) {
    const ry = 484 + r() * 190
    const rx = 20 + r() * (SCENE_W - 40)
    const rl = 26 + r() * 130
    ripples.push({
      x1: rx,
      y1: ry,
      x2: rx + rl,
      y2: ry,
      strokeWidth: 0.9 + r() * 0.8,
      opacity: 0.1 + 0.28 * (1 - (ry - SCENE_HZ) / 230),
      style: motion
        ? { animation: `mgRip ${4 + r() * 3.5}s ease-in-out ${r() * 3}s infinite alternate` }
        : undefined,
    })
  }

  const shoots: SceneRngData['shoots'] = []
  for (let i = 0; i < 2; i++) {
    shoots.push({
      sx: 300 + r() * 700,
      sy: 40 + r() * 130,
      style: { animation: `mgShoot ${9 + i * 6}s linear ${2 + i * 5.5}s infinite` },
    })
  }

  const mists: SceneRngData['mists'] = []
  for (let i = 0; i < 4; i++) {
    mists.push({
      cx: 140 + i * 300 + r() * 120,
      cy: 452 - i * 5,
      rx: 130 + r() * 70,
      ry: 9 + r() * 5,
      style: {
        filter: 'blur(7px)',
        animation: `mgMist ${14 + i * 4}s ease-in-out ${i * 2.4}s infinite alternate`,
      },
    })
  }

  const leaves: SceneRngData['leaves'] = []
  for (let i = 0; i < 5; i++) {
    leaves.push({
      lx: 90 + r() * 1000,
      ly: 330 + r() * 90,
      style: { animation: `mgFall ${7 + r() * 5}s linear ${r() * 8}s infinite` },
    })
  }

  const snow: SceneRngData['snow'] = []
  for (let i = 0; i < 26; i++) {
    snow.push({
      cx: r() * SCENE_W,
      cy: 20 + r() * 420,
      r: 1 + r() * 1.4,
      style: { animation: `mgSnow ${7 + r() * 6}s linear ${r() * 9}s infinite` },
    })
  }

  const petals: SceneRngData['petals'] = []
  for (let i = 0; i < 8; i++) {
    petals.push({
      px: 60 + r() * 1060,
      py: 300 + r() * 130,
      style: { animation: `mgPetal ${6 + r() * 5}s linear ${r() * 7}s infinite` },
    })
  }

  const butterflies: SceneRngData['butterflies'] = []
  for (let i = 0; i < 4; i++) {
    butterflies.push({
      bx: 160 + r() * 900,
      by: 400 + r() * 55,
      flutterStyle: { animation: `mgFlutter ${7 + r() * 4}s ease-in-out ${r() * 5}s infinite` },
      wingStyle: {
        animation: `mgWing ${0.22 + r() * 0.1}s ease-in-out infinite alternate`,
        transformBox: 'fill-box',
        transformOrigin: 'center',
      },
      fill: i % 2 ? palette.accent : palette.rim,
    })
  }

  const fireflies: SceneRngData['fireflies'] = []
  for (let i = 0; i < (palette.fireN ?? 0); i++) {
    const flyAnim = `mgFly ${4 + r() * 3}s ease-in-out ${r() * 4}s infinite`
    fireflies.push({
      fx: 90 + r() * 1020,
      fy: 390 + r() * 260,
      outerStyle: { filter: 'blur(2px)', animation: flyAnim },
      innerStyle: { animation: flyAnim },
    })
  }

  return { stars, ripples, shoots, mists, leaves, snow, petals, butterflies, fireflies }
}

export interface GardenSkyLayerProps {
  palette: ScenePalette
  sceneKey: string
  motion: boolean
  rngData: SceneRngData
  landscapeView: GardenLandscapeView
}

export const GardenSkyLayer = forwardRef<SVGGElement, GardenSkyLayerProps>(function GardenSkyLayer(
  { palette: C, sceneKey: k, motion, rngData, landscapeView },
  ref,
) {
  const pondGeom = getPondGeometry(landscapeView)
  const bandTopY = pondGeom.bandWater ? pondGeom.waterTopY : LANDSCAPE_HORIZON_Y
  const birdAlpha = C.birdAlpha ?? 1

  return (
    <g ref={ref} data-layer="sky">
      <defs>
        <linearGradient id={`sky${k}`} x1={0} y1={0} x2={0} y2={1}>
          {C.sky.map((c, i) => (
            <stop key={i} offset={i / (C.sky.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient
          id={`wv${k}`}
          x1={0}
          y1={bandTopY}
          x2={0}
          y2={SCENE_H}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0} stopColor={C.waterTint[0]} stopOpacity={0.4} />
          <stop offset={0.3} stopColor={C.waterTint[1]} stopOpacity={0.1} />
          <stop offset={1} stopColor={C.waterTint[1]} stopOpacity={0.92} />
        </linearGradient>
        <clipPath id={`wc${k}`}>
          <path d={pondGeom.waterPathD} />
        </clipPath>
        <clipPath id={`wm${k}`}>
          <path d={pondGeom.waterPathD} />
        </clipPath>
        {/* Explicit full-scene region so the blurred reflection never clips into a vertical seam. */}
        <filter id={`wrb${k}`} filterUnits="userSpaceOnUse" x={-400} y={-200} width={SCENE_W + 800} height={SCENE_H + 400}>
          <feGaussianBlur stdDeviation={1.4} />
        </filter>
        <linearGradient id={`bankDeep${k}`} x1={0} y1={bandTopY - 80} x2={0} y2={bandTopY + 40} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.hills[1]} stopOpacity={0.4} />
          <stop offset={1} stopColor={C.bank} stopOpacity={0.95} />
        </linearGradient>
      </defs>

      <rect width={SCENE_W} height={SCENE_HZ + 4} fill={`url(#sky${k})`} />

      <g opacity={C.starAlpha ?? 1}>
        {rngData.stars.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#ffffff"
            opacity={s.opacity}
            style={s.twinkle}
          />
        ))}
      </g>

      {C.sun ? (
        (() => {
          const sunPos = projectWorldToSky(WORLD_SUN, landscapeView)
          return (
            <>
              <circle
                cx={sunPos.x}
                cy={sunPos.y}
                r={C.sun.r * 2.6}
                fill={C.sun.glow}
                opacity={0.22}
                style={{ filter: 'blur(18px)' }}
              />
              <circle cx={sunPos.x} cy={sunPos.y} r={C.sun.r} fill={C.sun.disk} opacity={0.95} />
            </>
          )
        })()
      ) : null}

      {C.moon ? (
        <>
          <circle
            cx={C.moon.x}
            cy={C.moon.y}
            r={C.moon.r * 2.4}
            fill={C.glow}
            opacity={0.16}
            style={{ filter: 'blur(14px)' }}
          />
          <circle cx={C.moon.x} cy={C.moon.y} r={C.moon.r} fill="#e9f3f8" />
          <circle cx={C.moon.x - 9} cy={C.moon.y - 6} r={4.5} fill="#c6d9e2" opacity={0.6} />
          <circle cx={C.moon.x + 7} cy={C.moon.y + 9} r={3} fill="#c6d9e2" opacity={0.5} />
          <circle cx={C.moon.x + 12} cy={C.moon.y - 8} r={2} fill="#c6d9e2" opacity={0.45} />
        </>
      ) : null}

      {C.venus ? (
        <g>
          <circle cx={C.venus.x} cy={C.venus.y} r={2} fill="#ffffff" opacity={0.95} />
          <path
            d={`M ${C.venus.x - 7} ${C.venus.y} L ${C.venus.x + 7} ${C.venus.y} M ${C.venus.x} ${C.venus.y - 7} L ${C.venus.x} ${C.venus.y + 7}`}
            stroke="#ffffff"
            strokeWidth={0.6}
            opacity={0.6}
          />
          <circle
            cx={C.venus.x}
            cy={C.venus.y}
            r={6}
            fill="#ffffff"
            opacity={0.15}
            style={{ filter: 'blur(3px)' }}
          />
        </g>
      ) : null}

      {[
        [180, 118, 1],
        [640, 86, 0.8],
      ].map(([cx, cy, sc], i) => (
        <g key={`cl${i}`} transform={`translate(${cx} ${cy}) scale(${sc})`}>
          <g style={motion ? { animation: `mgCloud ${34 + i * 12}s ease-in-out infinite alternate` } : undefined}>
            <ellipse cx={0} cy={0} rx={90} ry={10} fill={C.cloud} opacity={0.1} />
            <ellipse cx={50} cy={-8} rx={60} ry={8} fill={C.cloud} opacity={0.08} />
            <ellipse cx={-55} cy={6} rx={48} ry={6} fill={C.cloud} opacity={0.09} />
          </g>
        </g>
      ))}

      {birdAlpha > 0.02 ? (
        <>
          <g transform="translate(-170 0)" opacity={birdAlpha}>
            <g style={motion ? { animation: 'mgDrift 52s linear infinite' } : undefined}>
              <Bird bx={0} by={150} sc={1} birds={C.birds} motion={motion} />
              <Bird bx={26} by={162} sc={0.8} birds={C.birds} motion={motion} />
              <Bird bx={50} by={146} sc={0.9} birds={C.birds} motion={motion} />
              <Bird bx={16} by={176} sc={0.62} birds={C.birds} motion={motion} />
            </g>
          </g>
          <g transform="translate(-60 0)" opacity={birdAlpha}>
            <g style={motion ? { animation: 'mgDrift 74s linear 8s infinite' } : undefined}>
              <Bird bx={0} by={230} sc={1.15} birds={C.birds} motion={motion} />
            </g>
          </g>
        </>
      ) : null}
    </g>
  )
})

export interface GardenFarLayerProps {
  palette: ScenePalette
  gardenSeed: number
  rimStrength: number
  motion: boolean
}

export interface GardenFarLayerPropsWithView extends GardenFarLayerProps {
  landscapeView: GardenLandscapeView
}

export const GardenFarLayer = forwardRef<SVGGElement, GardenFarLayerPropsWithView>(function GardenFarLayer(
  { palette: C, landscapeView },
  ref,
) {
  return (
    <g ref={ref} data-layer="far">
      <FarLandContent palette={C} gardenSeed={0} rimStrength={0} motion={false} landscapeView={landscapeView} />
    </g>
  )
})

interface GardenLandProps {
  palette: ScenePalette
  gardenSeed: number
  rimStrength: number
  motion: boolean
}

function FarLandContent({ palette: C, landscapeView }: GardenLandProps & { landscapeView: GardenLandscapeView }) {
  const pan = hillPanX(landscapeView)
  const shift = hillWorldShift(landscapeView)
  return (
    <g transform={pan ? `translate(${pan} 0)` : undefined}>
      <path d={farHillPathD(shift)} fill={C.hills[0]} />
    </g>
  )
}

function MidHillTerrainShapes({
  palette: C,
  landscapeView,
}: {
  palette: ScenePalette
  landscapeView: GardenLandscapeView
}) {
  const shift = hillWorldShift(landscapeView)
  return (
    <>
      <path d={midHillPathD(shift)} fill={C.hills[1]} />
      <path d={nearHillPathD(shift)} fill={C.hills[2]} />
    </>
  )
}

function MidHillPlants(_props: GardenLandProps) {
  return null
}

function PlantedHybridsContent({
  palette: C,
  rimStrength: rim,
  motion,
  planted,
}: {
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  planted: PlantedHybrid[]
}) {
  return (
    <g>
      {planted.map((p, i) => (
        <HybridPlantSvg
          key={`hy${i}`}
          genome={p.g}
          palette={C}
          rimStrength={rim}
          motion={motion}
          stage={7}
          x={p.x}
          y={p.y ?? 460}
          scale={p.sc}
          swayIndex={i}
        />
      ))}
    </g>
  )
}

function ReflectLandContent({
  palette: C,
  gardenSeed: seed,
  rimStrength: rim,
  motion,
  planted,
  landscapeView,
}: GardenLandProps & { planted: PlantedHybrid[]; landscapeView: GardenLandscapeView }) {
  return (
    <>
      <FarLandContent palette={C} gardenSeed={seed} rimStrength={rim} motion={motion} landscapeView={landscapeView} />
      <MidHillTerrainShapes palette={C} landscapeView={landscapeView} />
      <MidHillPlants palette={C} gardenSeed={seed} rimStrength={rim} motion={motion} />
      <PlantedHybridsContent palette={C} rimStrength={rim} motion={motion} planted={planted} />
    </>
  )
}

export interface GardenMidWaterLayerProps {
  palette: ScenePalette
  sceneKey: string
  gardenSeed: number
  rimStrength: number
  motion: boolean
  landscapeView: GardenLandscapeView
  planted: PlantedHybrid[]
  candles: Candle[]
  memoryPlants?: ReactNode
  starterDecor?: GardenStarterDecor
  shedStyle: ShedStyle
  onShedClick?: () => void
  rngData: SceneRngData
}

export const GardenMidWaterLayer = forwardRef<SVGGElement, GardenMidWaterLayerProps>(function GardenMidWaterLayer(
  {
    palette: C,
    sceneKey: k,
    gardenSeed: seed,
    rimStrength: rim,
    motion,
    landscapeView,
    planted,
    candles,
    memoryPlants,
    starterDecor,
    shedStyle,
    onShedClick,
    rngData,
  },
  ref,
) {
  const worldLayer = useMemo(() => {
    const items = [
      ...buildStarterWorldPlants(starterDecor, landscapeView, C, rim, motion),
      ...buildWorldSceneryItems(landscapeView, C, rim, motion, seed, shedStyle, onShedClick, {
        includeDistantTrees: !starterDecor,
      }),
    ].sort((a, b) => a.depth - b.depth)
    return sortWorldLayer(items)
  }, [starterDecor, landscapeView, C, rim, motion, seed, shedStyle, onShedClick])
  const sortedCandles = useMemo(() => [...candles].sort((a, b) => a.y - b.y), [candles])
  const pondGeom = useMemo(() => getPondGeometry(landscapeView), [landscapeView])
  const waterTopY = pondGeom.bandWater ? pondGeom.waterTopY : LANDSCAPE_HORIZON_Y
  const waterDepth = SCENE_H - waterTopY
  const showReflection = pondGeom.bandWater && waterDepth > 72

  const sunSkyX = C.sun ? projectWorldToSky(WORLD_SUN, landscapeView).x : SCENE_W / 2
  const reflectY = getWaterReflectionCenterY(landscapeView, sunSkyX)
  const smallPool = landscapeView === 'garden_path'
  const waterShimmers = pondGeom.bandWater ? bandWaterShimmerLinesD(waterTopY) : []

  return (
    <g ref={ref} data-layer="mid" data-landscape-view={landscapeView}>
      <SceneGroundPlane palette={C} sceneKey={k} view={landscapeView} />
      <g transform={`translate(${hillPanX(landscapeView)} 0)`}>
        <MidHillTerrainShapes palette={C} landscapeView={landscapeView} />
      </g>
      <PlantedHybridsContent palette={C} rimStrength={rim} motion={motion} planted={planted} />
      <g data-layer="world-scenery">{worldLayer}</g>
      {memoryPlants}
      <AtmosphericGroundDetail palette={C} gardenSeed={seed} rimStrength={rim} view={landscapeView} />

      <g clipPath={`url(#wm${k})`}>
        <path d={pondGeom.waterPathD} fill={C.waterTint[1]} />
        <path d={pondGeom.waterPathD} fill={`url(#wv${k})`} opacity={0.92} />

        {waterShimmers.map((d, i) => (
          <path
            key={`wsh-${i}`}
            d={d}
            fill="none"
            stroke={C.waterTint[0]}
            strokeWidth={i % 2 === 0 ? 1.15 : 0.85}
            strokeOpacity={0.11 + (i % 3) * 0.03}
            strokeLinecap="round"
          />
        ))}

        {showReflection ? (
          <g opacity={0.28} filter={`url(#wrb${k})`}>
            <g transform={`translate(0 ${waterTopY * 1.92}) scale(1 -0.92)`}>
              <ReflectLandContent
                palette={C}
                gardenSeed={seed}
                rimStrength={rim}
                motion={motion}
                planted={planted}
                landscapeView={landscapeView}
              />
            </g>
          </g>
        ) : null}

        {smallPool ? (
          <g opacity={0.2} style={{ filter: 'blur(1.2px)' }}>
            <ellipse cx={145} cy={655} rx={42} ry={18} fill={C.glow} />
          </g>
        ) : null}

        {C.sun ? (
          <g opacity={smallPool ? 0.65 : 1}>
            <rect
              x={sunSkyX - 12}
              y={reflectY - 18}
              width={24}
              height={smallPool ? 48 : Math.min(waterDepth * 0.85, 180)}
              fill={C.sun.glow}
              opacity={0.09}
              rx={7}
              style={{ filter: 'blur(10px)' }}
            />
            <ellipse
              cx={sunSkyX}
              cy={reflectY + 16}
              rx={smallPool ? 16 : 28}
              ry={smallPool ? 22 : Math.min(72, waterDepth * 0.45)}
              fill={C.sun.glow}
              opacity={0.16}
              style={{ filter: 'blur(8px)' }}
            />
            <ellipse
              cx={sunSkyX}
              cy={reflectY}
              rx={smallPool ? 7 : 9}
              ry={smallPool ? 14 : Math.min(48, waterDepth * 0.28)}
              fill={C.sun.disk}
              opacity={0.24}
              style={{ filter: 'blur(3px)' }}
            />
          </g>
        ) : null}

        {C.moon ? (
          <ellipse
            cx={C.moon.x}
            cy={reflectY + 8}
            rx={smallPool ? 18 : 22}
            ry={smallPool ? 18 : Math.min(80, waterDepth * 0.5)}
            fill={C.glow}
            opacity={0.14}
            style={{ filter: 'blur(8px)' }}
          />
        ) : null}

        {rngData.ripples
          .filter((rp) => rippleIntersectsWater(rp.x1, rp.y1, landscapeView))
          .map((rp, i) => (
            <line
              key={i}
              x1={rp.x1}
              y1={rp.y1}
              x2={rp.x2}
              y2={rp.y2}
              stroke={C.ripple}
              strokeWidth={rp.strokeWidth}
              opacity={rp.opacity * (waterDepth > 80 ? 1 : 0.5)}
              strokeLinecap="round"
              style={rp.style}
            />
          ))}

        {pondGeom.bandWater ? (
          <>
            <PlantAt
              variety="lotus"
              stage={C.lotusDormant ? 1 : 6}
              palette={C}
              x={800}
              y={waterTopY + Math.min(88, Math.max(48, waterDepth * 0.38))}
              sc={1.15}
              seedN={seed + 19}
              rim={rim}
              motion={motion}
            />
            <PlantAt
              variety="lotus"
              stage={C.lotusDormant ? 0 : 3}
              palette={C}
              x={728}
              y={waterTopY + Math.min(104, Math.max(56, waterDepth * 0.48))}
              sc={0.9}
              seedN={seed + 20}
              rim={rim}
              motion={motion}
            />
          </>
        ) : (
          <g>
            <PlantAt variety="lotus" stage={3} palette={C} x={178} y={658} sc={0.72} seedN={seed + 21} rim={rim} motion={motion} />
          </g>
        )}
      </g>

      <PondShoreRim palette={C} view={landscapeView} rimStrength={rim} />

      {smallPool ? (
        <g>
          <g transform="translate(32 604)">{cattail({ C, rimStrength: rim, r: gardenRng(seed + 22) })}</g>
          <g transform="translate(76 598) scale(0.92)">{cattail({ C, rimStrength: rim, r: gardenRng(seed + 23) })}</g>
          <g transform="translate(118 612) scale(0.82)">{cattail({ C, rimStrength: rim, r: gardenRng(seed + 24) })}</g>
        </g>
      ) : null}

      {sortedCandles.length > 0 ? (
        <g>
          {sortedCandles.map((cd, i) => (
            <g
              key={cd.id}
              transform={`translate(${cd.x} ${cd.y}) scale(${0.65 + ((cd.y - 500) / 150) * 0.6})`}
            >
              {candle({ C, motion, cd, i })}
            </g>
          ))}
        </g>
      ) : null}
    </g>
  )
})

export interface GardenForegroundLayerProps {
  palette: ScenePalette
  sceneKey: string
  gardenSeed: number
  rimStrength: number
  motion: boolean
  landscapeView: GardenLandscapeView
  shedStyle: ShedStyle
  onShedClick?: () => void
  rngData: SceneRngData
}

export const GardenForegroundLayer = forwardRef<SVGGElement, GardenForegroundLayerProps>(function GardenForegroundLayer(
  { palette: C, sceneKey: k, gardenSeed: seed, rimStrength: rim, motion, landscapeView, rngData },
  ref,
) {
  return (
    <g ref={ref} data-layer="foreground">
      <ForegroundBanks
        palette={C}
        gardenSeed={seed}
        rimStrength={rim}
        sceneKey={k}
        view={landscapeView}
      />
      <g transform={`translate(${VIEW_FRAME[landscapeView].panX * 0.2} 0)`}>
      <path
        d="M 0 606 Q 140 594 262 632"
        stroke={C.rim}
        strokeWidth={1}
        fill="none"
        opacity={0.14 * rim}
      />
      <path
        d="M 1200 618 Q 1076 604 976 640"
        stroke={C.rim}
        strokeWidth={1}
        fill="none"
        opacity={0.14 * rim}
      />

      {motion && (C.shootAlpha ?? 0) > 0.05 ? (
        <g opacity={C.shootAlpha}>
          {rngData.shoots.map((sh, i) => (
            <g key={i} transform={`translate(${sh.sx} ${sh.sy})`}>
              <g style={sh.style}>
                <line
                  x1={0}
                  y1={0}
                  x2={30}
                  y2={-11}
                  stroke="#ffffff"
                  strokeWidth={1.1}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <circle cx={0} cy={0} r={1.4} fill="#ffffff" />
              </g>
            </g>
          ))}
        </g>
      ) : null}

      {motion && (C.mistAlpha ?? 0) > 0.02 ? (
        <g opacity={C.mistAlpha}>
          {rngData.mists.map((m, i) => (
            <ellipse
              key={i}
              cx={m.cx}
              cy={m.cy}
              rx={m.rx}
              ry={m.ry}
              fill={C.glow}
              opacity={0.1}
              style={m.style}
            />
          ))}
        </g>
      ) : null}

      {motion && (C.leafAlpha ?? 0) > 0.02 ? (
        <g opacity={C.leafAlpha}>
          {rngData.leaves.map((lf, i) => (
            <g key={i} transform={`translate(${lf.lx} ${lf.ly})`}>
              <path
                d="M 0 0 Q 3 -2.6 6 0 Q 3 2.6 0 0 Z"
                fill={C.rim}
                opacity={0.75}
                style={lf.style}
              />
            </g>
          ))}
        </g>
      ) : null}

      {motion && (C.snowAlpha ?? 0) > 0.02 ? (
        <g opacity={C.snowAlpha}>
          {rngData.snow.map((fl, i) => (
            <circle key={i} cx={fl.cx} cy={fl.cy} r={fl.r} fill="#ffffff" style={fl.style} />
          ))}
        </g>
      ) : null}

      {motion && (C.petalAlpha ?? 0) > 0.02 ? (
        <g opacity={C.petalAlpha}>
          {rngData.petals.map((pt, i) => (
            <g key={i} transform={`translate(${pt.px} ${pt.py})`}>
              <path
                d="M 0 0 Q 2.2 -2 4.4 0 Q 2.2 2.4 0 0 Z"
                fill={C.accent}
                opacity={0.85}
                style={pt.style}
              />
            </g>
          ))}
        </g>
      ) : null}

      {motion && (C.buttAlpha ?? 0) > 0.02 ? (
        <g opacity={C.buttAlpha}>
          {rngData.butterflies.map((bt, i) => (
            <g key={i} transform={`translate(${bt.bx} ${bt.by})`}>
              <g style={bt.flutterStyle}>
                <g style={bt.wingStyle}>
                  <path
                    d="M 0 0 Q -4 -4.5 -6.5 -1 Q -4 1.6 0 0 Q 4 -4.5 6.5 -1 Q 4 1.6 0 0 Z"
                    fill={bt.fill}
                    opacity={0.9}
                  />
                </g>
                <ellipse cx={0} cy={0} rx={0.7} ry={2} fill={C.sil} opacity={0.9} />
              </g>
            </g>
          ))}
        </g>
      ) : null}

      {motion && (C.fireAlpha ?? 1) > 0.01 ? (
        <g opacity={C.fireAlpha ?? 1}>
          {rngData.fireflies.map((ff, i) => (
            <g key={i} transform={`translate(${ff.fx} ${ff.fy})`}>
              <circle r={3.2} fill={C.fire} opacity={0.3} style={ff.outerStyle} />
              <circle r={1.3} fill={C.fire} style={ff.innerStyle} />
            </g>
          ))}
        </g>
      ) : null}
      </g>
    </g>
  )
})

export function GardenSceneSvg({
  palette,
  sceneKey,
  gardenSeed,
  rimStrength,
  motion,
  landscapeView,
  shedStyle,
  onShedClick,
  planted,
  candles,
  memoryPlants,
  starterDecor,
  layerRefs,
}: GardenSceneSvgProps) {
  const resolvedView = resolveGardenLandscapeView(landscapeView)
  const rngData = useMemo(
    () => computeSceneRngData(gardenSeed, sceneKey, palette, motion),
    [gardenSeed, sceneKey, palette, motion],
  )

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`-120 0 ${SCENE_W + 240} ${SCENE_H}`}
      preserveAspectRatio="xMidYMid slice"
      width={SCENE_W}
      height={SCENE_H}
      className="block h-auto max-h-full w-full max-w-full"
      style={{ display: 'block' }}
      aria-hidden
    >
      <GardenSkyLayer
        ref={layerRefs?.sky}
        palette={palette}
        sceneKey={sceneKey}
        motion={motion}
        rngData={rngData}
        landscapeView={resolvedView}
      />
      <GardenFarLayer
        ref={layerRefs?.far}
        palette={palette}
        gardenSeed={gardenSeed}
        rimStrength={rimStrength}
        motion={motion}
        landscapeView={resolvedView}
      />
      <GardenMidWaterLayer
        ref={layerRefs?.mid}
        palette={palette}
        sceneKey={sceneKey}
        gardenSeed={gardenSeed}
        rimStrength={rimStrength}
        motion={motion}
        landscapeView={resolvedView}
        planted={planted}
        candles={candles}
        memoryPlants={memoryPlants}
        starterDecor={starterDecor}
        shedStyle={shedStyle}
        onShedClick={onShedClick}
        rngData={rngData}
      />
      <GardenForegroundLayer
        ref={layerRefs?.foreground}
        palette={palette}
        sceneKey={sceneKey}
        gardenSeed={gardenSeed}
        rimStrength={rimStrength}
        motion={motion}
        landscapeView={resolvedView}
        shedStyle={shedStyle}
        onShedClick={onShedClick}
        rngData={rngData}
      />
    </svg>
  )
}