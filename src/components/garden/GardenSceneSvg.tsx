import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Candle, GardenLandscapeView, PlantedHybrid, ShedStyle } from '@/lib/types'
import {
  getViewWaterLayout,
  getWaterMaskClipRects,
  getWaterReflectionCenterY,
  rippleIntersectsWater,
  resolveGardenLandscapeView,
  type ViewWaterLayout,
} from '@/lib/garden/landscape-view'
import { ForegroundBankDetail, NearBankExtension, VIEW_MID_PARALLAX_X } from '@/components/garden/landscape-bank'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng } from '@/lib/garden/prng'
import { indexToPlantStage } from '@/lib/garden/stage'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { candle, cattail, grassTuft, rock, shed } from './scenery'

export const SCENE_W = 1200
export const SCENE_H = 700
export const SCENE_HZ = 470

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
  for (let i = 0; i < 11; i++) {
    const ry = 484 + r() * 190
    const rx = 30 + r() * 1040
    const rl = 26 + r() * 110
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
  waterLayout: ViewWaterLayout
}

export const GardenSkyLayer = forwardRef<SVGGElement, GardenSkyLayerProps>(function GardenSkyLayer(
  { palette: C, sceneKey: k, motion, rngData, waterLayout },
  ref,
) {
  const waterMaskRects = getWaterMaskClipRects(waterLayout)
  const bandTopY = waterLayout.bandHeight > 0 ? waterLayout.waterTopY : (waterLayout.corner?.y ?? SCENE_HZ)
  const birdAlpha = C.birdAlpha ?? 1

  return (
    <g ref={ref} data-layer="sky">
      <defs>
        <linearGradient id={`sky${k}`} x1={0} y1={0} x2={0} y2={1}>
          {C.sky.map((c, i) => (
            <stop key={i} offset={i / (C.sky.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`wv${k}`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={C.waterTint[0]} stopOpacity={0.4} />
          <stop offset={0.3} stopColor={C.waterTint[1]} stopOpacity={0.1} />
          <stop offset={1} stopColor={C.waterTint[1]} stopOpacity={0.92} />
        </linearGradient>
        <clipPath id={`wc${k}`}>
          {waterMaskRects.map((rect, i) => (
            <rect
              key={`wc-${i}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={rect.rx}
            />
          ))}
        </clipPath>
        <clipPath id={`wm${k}`}>
          {waterMaskRects.map((rect, i) => (
            <rect
              key={`wm-${i}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={rect.rx}
            />
          ))}
        </clipPath>
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
        <>
          <circle
            cx={C.sun.x}
            cy={C.sun.y}
            r={C.sun.r * 2.6}
            fill={C.sun.glow}
            opacity={0.22}
            style={{ filter: 'blur(18px)' }}
          />
          <circle cx={C.sun.x} cy={C.sun.y} r={C.sun.r} fill={C.sun.disk} opacity={0.95} />
        </>
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

export const GardenFarLayer = forwardRef<SVGGElement, GardenFarLayerProps>(function GardenFarLayer(
  { palette: C, gardenSeed: seed, rimStrength: rim, motion },
  ref,
) {
  return (
    <g ref={ref} data-layer="far">
      <FarLandContent palette={C} gardenSeed={seed} rimStrength={rim} motion={motion} />
    </g>
  )
})

interface GardenLandProps {
  palette: ScenePalette
  gardenSeed: number
  rimStrength: number
  motion: boolean
}

function FarLandContent({ palette: C, gardenSeed: seed, rimStrength: rim }: GardenLandProps) {
  return (
    <>
      <path
        d="M 0 402 Q 170 362 330 388 T 640 372 Q 810 352 960 384 T 1200 376 L 1200 472 L 0 472 Z"
        fill={C.hills[0]}
      />
      <g>
        <PlantAt
          variety="tree"
          stage={5}
          palette={hillPalette(C, 1, { rim: C.rim, glow: C.glow, accent: C.accent })}
          x={250}
          y={384}
          sc={0.42}
          seedN={seed + 11}
          rim={rim * 0.4}
          motion={false}
        />
        <PlantAt
          variety="tree"
          stage={6}
          palette={hillPalette(C, 1)}
          x={700}
          y={372}
          sc={0.5}
          seedN={seed + 12}
          rim={rim * 0.4}
          motion={false}
        />
        <PlantAt
          variety="tree"
          stage={4}
          palette={hillPalette(C, 1)}
          x={1080}
          y={380}
          sc={0.4}
          seedN={seed + 13}
          rim={rim * 0.4}
          motion={false}
        />
      </g>
    </>
  )
}

function MidNearLandContent({ palette: C, gardenSeed: seed, rimStrength: rim, motion }: GardenLandProps) {
  return (
    <>
      <path
        d="M 0 436 Q 200 404 380 424 T 720 414 Q 900 400 1040 426 T 1200 420 L 1200 472 L 0 472 Z"
        fill={C.hills[1]}
      />
      <g>
        <PlantAt
          variety="tree"
          stage={6}
          palette={hillPalette(C, 2)}
          x={480}
          y={420}
          sc={0.62}
          seedN={seed + 14}
          rim={rim * 0.6}
          motion={motion}
        />
        <PlantAt
          variety="herb"
          stage={6}
          palette={hillPalette(C, 2)}
          x={560}
          y={424}
          sc={0.7}
          seedN={seed + 15}
          rim={rim * 0.6}
          motion={motion}
        />
        <PlantAt
          variety="tree"
          stage={3}
          palette={hillPalette(C, 2)}
          x={920}
          y={418}
          sc={0.55}
          seedN={seed + 16}
          rim={rim * 0.6}
          motion={motion}
        />
      </g>

      <path
        d="M 0 468 Q 90 442 210 452 Q 340 462 470 456 Q 620 448 760 460 Q 920 470 1030 458 Q 1120 450 1200 462 L 1200 472 L 0 472 Z"
        fill={C.hills[2]}
      />
      <g>
        <PlantAt variety="tree" stage={7} palette={C} x={140} y={452} sc={1.55} seedN={seed + 1} rim={rim} motion={motion} />
        <PlantAt variety="mushroom" stage={6} palette={C} x={208} y={458} sc={0.65} seedN={seed + 2} rim={rim} motion={motion} />
        <PlantAt variety="flower" stage={5} palette={C} x={300} y={456} sc={0.8} seedN={seed + 3} rim={rim} motion={motion} />
        <PlantAt variety="wildflower" stage={6} palette={C} x={356} y={460} sc={0.75} seedN={seed + 4} rim={rim} motion={motion} />
        <PlantAt variety="herb" stage={6} palette={C} x={424} y={458} sc={0.8} seedN={seed + 5} rim={rim} motion={motion} />
        <PlantAt variety="fern" stage={6} palette={C} x={508} y={457} sc={0.8} seedN={seed + 6} rim={rim} motion={motion} />
        <PlantAt variety="succulent" stage={6} palette={C} x={604} y={461} sc={0.85} seedN={seed + 7} rim={rim} motion={motion} />
        <PlantAt variety="flower" stage={1} palette={C} x={660} y={462} sc={0.8} seedN={seed + 8} rim={rim} motion={motion} />
        <PlantAt variety="flower" stage={0} palette={C} x={698} y={463} sc={0.8} seedN={seed + 9} rim={rim} motion={motion} />
        <PlantAt variety="flower" stage={7} palette={C} x={866} y={462} sc={0.85} seedN={seed + 10} rim={rim} motion={motion} />
        <PlantAt variety="vine" stage={6} palette={C} x={952} y={461} sc={0.85} seedN={seed + 17} rim={rim} motion={motion} />
        <PlantAt variety="tree" stage={3} palette={C} x={1058} y={457} sc={1.15} seedN={seed + 18} rim={rim} motion={motion} />
      </g>
    </>
  )
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
}: GardenLandProps & { planted: PlantedHybrid[] }) {
  return (
    <>
      <FarLandContent palette={C} gardenSeed={seed} rimStrength={rim} motion={motion} />
      <MidNearLandContent palette={C} gardenSeed={seed} rimStrength={rim} motion={motion} />
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
    rngData,
  },
  ref,
) {
  const sortedCandles = useMemo(() => [...candles].sort((a, b) => a.y - b.y), [candles])
  const waterLayout = useMemo(() => getViewWaterLayout(landscapeView), [landscapeView])
  const waterTopY =
    waterLayout.bandHeight > 0
      ? waterLayout.waterTopY
      : (waterLayout.corner?.y ?? SCENE_HZ)
  const showReflection = waterLayout.bandHeight > 48 && !waterLayout.corner

  const reflectY = getWaterReflectionCenterY(waterLayout, C.sun?.x)
  const hasWater = waterLayout.bandHeight > 0 || !!waterLayout.corner

  return (
    <g ref={ref} data-layer="mid" data-landscape-view={landscapeView}>
      <g transform={`translate(${VIEW_MID_PARALLAX_X[landscapeView]} 0)`}>
        <MidNearLandContent palette={C} gardenSeed={seed} rimStrength={rim} motion={motion} />
      </g>
      <PlantedHybridsContent palette={C} rimStrength={rim} motion={motion} planted={planted} />
      {memoryPlants}

      <NearBankExtension
        palette={C}
        gardenSeed={seed}
        rimStrength={rim}
        motion={motion}
        view={landscapeView}
      />

      {hasWater ? (
        <g clipPath={`url(#wm${k})`}>
          {waterLayout.bandHeight > 0 ? (
            <rect x={0} y={waterTopY} width={SCENE_W} height={waterLayout.bandHeight} fill={C.waterTint[1]} />
          ) : null}
          {waterLayout.corner ? (
            <rect
              x={waterLayout.corner.x}
              y={waterLayout.corner.y}
              width={waterLayout.corner.width}
              height={waterLayout.corner.height}
              rx={waterLayout.corner.rx ?? 12}
              fill={C.waterTint[1]}
            />
          ) : null}

          {showReflection ? (
            <g opacity={0.32} style={{ filter: 'blur(1.4px)' }}>
              <g transform={`translate(0 ${waterTopY * 1.92}) scale(1 -0.92)`}>
                <ReflectLandContent
                  palette={C}
                  gardenSeed={seed}
                  rimStrength={rim}
                  motion={motion}
                  planted={planted}
                />
              </g>
            </g>
          ) : null}

          {waterLayout.corner && waterLayout.bandHeight === 0 ? (
            <g opacity={0.22} style={{ filter: 'blur(1.2px)' }}>
              <ellipse
                cx={waterLayout.corner.x + waterLayout.corner.width * 0.55}
                cy={waterLayout.corner.y + waterLayout.corner.height * 0.55}
                rx={waterLayout.corner.width * 0.35}
                ry={waterLayout.corner.height * 0.22}
                fill={C.glow}
              />
            </g>
          ) : null}

          {waterLayout.bandHeight > 0 ? (
            <rect x={0} y={waterTopY} width={SCENE_W} height={waterLayout.bandHeight} fill={`url(#wv${k})`} />
          ) : null}
          {waterLayout.corner ? (
            <rect
              x={waterLayout.corner.x}
              y={waterLayout.corner.y}
              width={waterLayout.corner.width}
              height={waterLayout.corner.height}
              rx={waterLayout.corner.rx ?? 12}
              fill={`url(#wv${k})`}
              opacity={0.88}
            />
          ) : null}

          {C.sun ? (
            <>
              <rect
                x={C.sun.x - 14}
                y={reflectY - (waterLayout.bandHeight > 0 ? 28 : 12)}
                width={28}
                height={
                  waterLayout.bandHeight > 0
                    ? Math.min(waterLayout.bandHeight * 0.92, 200)
                    : (waterLayout.corner?.height ?? 80) * 0.75
                }
                fill={C.sun.glow}
                opacity={0.11}
                rx={8}
                style={{ filter: 'blur(11px)' }}
              />
              <ellipse
                cx={C.sun.x}
                cy={reflectY + 22}
                rx={waterLayout.corner && !waterLayout.bandHeight ? 18 : 30}
                ry={waterLayout.corner && !waterLayout.bandHeight ? 26 : 78}
                fill={C.sun.glow}
                opacity={0.2}
                style={{ filter: 'blur(9px)' }}
              />
              <ellipse
                cx={C.sun.x}
                cy={reflectY}
                rx={9}
                ry={waterLayout.corner && !waterLayout.bandHeight ? 18 : 52}
                fill={C.sun.disk}
                opacity={0.28}
                style={{ filter: 'blur(4px)' }}
              />
            </>
          ) : null}

          {C.moon ? (
            <ellipse
              cx={C.moon.x}
              cy={reflectY + 8}
              rx={22}
              ry={waterLayout.corner && !waterLayout.bandHeight ? 20 : 88}
              fill={C.glow}
              opacity={0.16}
              style={{ filter: 'blur(8px)' }}
            />
          ) : null}

          {rngData.ripples
            .filter((rp) => rippleIntersectsWater(rp.x1, rp.y1, waterLayout))
            .map((rp, i) => (
              <line
                key={i}
                x1={rp.x1}
                y1={rp.y1}
                x2={rp.x2}
                y2={rp.y2}
                stroke={C.ripple}
                strokeWidth={rp.strokeWidth}
                opacity={rp.opacity * (waterLayout.bandHeight > 80 ? 1 : 0.55)}
                strokeLinecap="round"
                style={rp.style}
              />
            ))}

          {waterLayout.bandHeight > 8 ? (
            <>
              <line
                x1={0}
                y1={waterTopY + 0.5}
                x2={SCENE_W}
                y2={waterTopY + 0.5}
                stroke="#ffffff"
                strokeWidth={1.3}
                opacity={0.16 * rim}
              />
              <line
                x1={0}
                y1={waterTopY}
                x2={SCENE_W}
                y2={waterTopY}
                stroke={C.rim}
                strokeWidth={0.8}
                opacity={0.18 * rim}
              />
            </>
          ) : null}

          {(landscapeView === 'pond' || landscapeView === 'lakeside' || landscapeView === 'meadow') ? (
            <>
              <PlantAt
                variety="lotus"
                stage={C.lotusDormant ? 1 : 6}
                palette={C}
                x={800}
                y={Math.min(598, waterTopY + 88)}
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
                y={Math.min(616, waterTopY + 98)}
                sc={0.9}
                seedN={seed + 20}
                rim={rim}
                motion={motion}
              />
            </>
          ) : null}

          {waterLayout.corner ? (
            <g>
              <PlantAt
                variety="lotus"
                stage={3}
                palette={C}
                x={waterLayout.corner.x + waterLayout.corner.width * 0.72}
                y={waterLayout.corner.y + waterLayout.corner.height * 0.55}
                sc={0.75}
                seedN={seed + 21}
                rim={rim}
                motion={motion}
              />
              <g transform={`translate(${waterLayout.corner.x + 42} ${waterLayout.corner.y + 8})`}>
                {cattail({ C, rimStrength: rim, r: gardenRng(seed + 22) })}
              </g>
              <g transform={`translate(${waterLayout.corner.x + 88} ${waterLayout.corner.y + 4}) scale(0.9)`}>
                {cattail({ C, rimStrength: rim, r: gardenRng(seed + 23) })}
              </g>
              <g transform={`translate(${waterLayout.corner.x + 128} ${waterLayout.corner.y + 12}) scale(0.8)`}>
                {cattail({ C, rimStrength: rim, r: gardenRng(seed + 24) })}
              </g>
            </g>
          ) : null}
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
  gardenSeed: number
  rimStrength: number
  motion: boolean
  landscapeView: GardenLandscapeView
  shedStyle: ShedStyle
  onShedClick?: () => void
  rngData: SceneRngData
}

const FOREGROUND_SHED_X: Record<GardenLandscapeView, number> = {
  pond: 1075,
  lakeside: 1062,
  meadow: 1092,
  garden_path: 1088,
}

export const GardenForegroundLayer = forwardRef<SVGGElement, GardenForegroundLayerProps>(function GardenForegroundLayer(
  { palette: C, gardenSeed: seed, rimStrength: rim, motion, landscapeView, shedStyle, onShedClick, rngData },
  ref,
) {
  const shedX = FOREGROUND_SHED_X[landscapeView]
  return (
    <g ref={ref} data-layer="foreground" transform={`translate(${VIEW_MID_PARALLAX_X[landscapeView] * 0.35} 0)`}>
      <ForegroundBankDetail palette={C} gardenSeed={seed} rimStrength={rim} view={landscapeView} />
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

      <g
        transform={`translate(${shedX} 682) scale(1.6)`}
        style={{ cursor: onShedClick ? 'pointer' : undefined }}
        onClick={onShedClick}
        role={onShedClick ? 'button' : undefined}
        tabIndex={onShedClick ? 0 : undefined}
        onKeyDown={
          onShedClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') onShedClick()
              }
            : undefined
        }
      >
        {shed({ kind: shedStyle, C, rimStrength: rim, motion })}
      </g>

      <g transform="translate(66 614)">{cattail({ C, rimStrength: rim, r: gardenRng(seed + 30) })}</g>
      <g transform="translate(102 608) scale(1.15)">{cattail({ C, rimStrength: rim, r: gardenRng(seed + 31) })}</g>
      <g transform="translate(142 622) scale(0.85)">{cattail({ C, rimStrength: rim, r: gardenRng(seed + 32) })}</g>
      <g transform="translate(230 640) scale(1.3)">{grassTuft({ C, r: gardenRng(seed + 33) })}</g>
      <g transform="translate(330 664) scale(1.5)">{grassTuft({ C, r: gardenRng(seed + 34) })}</g>
      <g transform="translate(1010 646) scale(1.35)">{grassTuft({ C, r: gardenRng(seed + 35) })}</g>
      <g transform="translate(1130 630) scale(1.2)">{grassTuft({ C, r: gardenRng(seed + 36) })}</g>
      <g transform="translate(430 682)">{rock({ C, rimStrength: rim, w: 16 })}</g>
      <g transform="translate(470 690)">{rock({ C, rimStrength: rim, w: 9 })}</g>
      <g transform="translate(900 686)">{rock({ C, rimStrength: rim, w: 12 })}</g>

      <PlantAt variety="fern" stage={7} palette={C} x={196} y={672} sc={1.05} seedN={seed + 37} rim={rim} motion={motion} />
      <PlantAt variety="mushroom" stage={7} palette={C} x={972} y={676} sc={1.1} seedN={seed + 38} rim={rim} motion={motion} />
      <PlantAt variety="wildflower" stage={5} palette={C} x={950} y={676} sc={1.3} seedN={seed + 39} rim={rim} motion={motion} />

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
  layerRefs,
}: GardenSceneSvgProps) {
  const resolvedView = resolveGardenLandscapeView(landscapeView)
  const waterLayout = useMemo(() => getViewWaterLayout(resolvedView), [resolvedView])
  const rngData = useMemo(
    () => computeSceneRngData(gardenSeed, sceneKey, palette, motion),
    [gardenSeed, sceneKey, palette, motion],
  )

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      width={SCENE_W}
      height={SCENE_H}
      style={{ display: 'block' }}
      aria-hidden
    >
      <GardenSkyLayer
        ref={layerRefs?.sky}
        palette={palette}
        sceneKey={sceneKey}
        motion={motion}
        rngData={rngData}
        waterLayout={waterLayout}
      />
      <GardenFarLayer
        ref={layerRefs?.far}
        palette={palette}
        gardenSeed={gardenSeed}
        rimStrength={rimStrength}
        motion={motion}
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
        rngData={rngData}
      />
      <GardenForegroundLayer
        ref={layerRefs?.foreground}
        palette={palette}
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