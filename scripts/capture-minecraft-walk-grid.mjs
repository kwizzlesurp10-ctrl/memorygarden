/**
 * Minecraft walk capture grid — deterministic plant cameras, pinned poses.
 * Env: AFTER_URL, BEFORE_URL (312e660 worktree preview on 4173 — prepare-walk-before-preview.mjs),
 *       ARTIFACT_DIR, VIEWPORT=desktop|mobile, MODE=full|overview
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import {
  classifyWalkCapturePixel,
  measureElderColumnVerticalFillFromPng,
} from './lib/walk-capture-pixel-fill.mjs'

const require = createRequire(import.meta.url)
const { PNG } = require('pngjs')
const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const viewportMode = process.env.VIEWPORT || 'desktop'
const mode = process.env.MODE || 'full'
const captureOnly = process.env.CAPTURE_ONLY || ''
const capturePhase = (process.env.CAPTURE_PHASE || 'both').toLowerCase()
const walkArtStyles = (process.env.WALK_ART_STYLES || 'pixel-art,watercolor')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const covThreshold = 0.15

mkdirSync(outDir, { recursive: true })

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const beforeSha =
  process.env.BEFORE_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'main'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
const afterSha =
  process.env.AFTER_SHA ||
  (capturePhase === 'before'
    ? beforeSha
    : spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim())
writeFileSync(
  resolve(outDir, 'BUILD_SHA.txt'),
  `before_url=${beforeUrl} before_sha=${beforeSha}\nafter_url=${afterUrl} after_sha=${afterSha}\n`,
)

const posePath = resolve(outDir, 'minecraft-walk-poses-desktop.json')

const viewports = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
}

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'minecraft-walk-v2',
  avatarUrl: '',
}

const memories = [
  {
    id: 'tree-mature-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Mature oak',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 430, y: 400 },
    emotionalTone: 'peaceful',
    plantStage: 'mature',
    plantVariety: 'tree',
    visitCount: 4,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-mature',
  },
  {
    id: 'tree-young-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Young oak',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 438, y: 405 },
    emotionalTone: 'peaceful',
    plantStage: 'young',
    plantVariety: 'tree',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-young',
  },
  {
    id: 'tree-elder-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Elder oak',
    date: '2025-06-01',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 455, y: 400 },
    emotionalTone: 'peaceful',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 6,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-elder',
  },
  {
    id: 'flower-bloom-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Bloom flower',
    date: '2025-06-02',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 470, y: 415 },
    emotionalTone: 'happy',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-flower',
  },
  {
    id: 'mushroom-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Mature mushroom',
    date: '2025-06-03',
    plantedAt: '2025-06-03T12:00:00.000Z',
    position: { x: 445, y: 425 },
    emotionalTone: 'peaceful',
    plantStage: 'mature',
    plantVariety: 'mushroom',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-mushroom',
  },
  {
    id: 'sprout-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Sprout',
    date: '2025-06-04',
    plantedAt: '2025-06-04T12:00:00.000Z',
    position: { x: 460, y: 430 },
    emotionalTone: 'happy',
    plantStage: 'sprout',
    plantVariety: 'flower',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-sprout',
  },
]

const allShots = [
  { kind: 'overview', file: 'walk-overview', plantId: null, label: 'overview' },
  {
    kind: 'tree-mature',
    plantId: 'tree-mature-walk',
    file: 'walk-tree-mature-closeup',
    label: 'mature tree',
  },
  {
    kind: 'tree-young',
    plantId: 'tree-young-walk',
    file: 'walk-tree-young-closeup',
    label: 'young oak',
  },
  { kind: 'tree-elder', plantId: 'tree-elder-walk', file: 'walk-tree-elder-closeup', label: 'elder tree' },
  { kind: 'flower', plantId: 'flower-bloom-walk', file: 'walk-flower-closeup', label: 'flower' },
  { kind: 'mushroom', plantId: 'mushroom-walk', file: 'walk-mushroom-closeup', label: 'mushroom' },
  { kind: 'sprout', plantId: 'sprout-walk', file: 'walk-sprout-closeup', label: 'sprout' },
]

let shots = mode === 'overview' ? allShots.filter((s) => s.file === 'walk-overview') : allShots
if (captureOnly === 'elder') {
  shots = shots.filter((s) => s.file === 'walk-tree-elder-closeup')
} else if (captureOnly === 'young') {
  shots = shots.filter((s) => s.file === 'walk-tree-young-closeup')
} else if (captureOnly === 'flower') {
  shots = shots.filter((s) => s.file === 'walk-flower-closeup')
} else if (captureOnly === 'mushroom') {
  shots = shots.filter((s) => s.file === 'walk-mushroom-closeup')
} else if (captureOnly === 'detail') {
  shots = shots.filter((s) => s.file === 'walk-mushroom-closeup' || s.file === 'walk-tree-elder-closeup')
} else if (captureOnly === 'sprout') {
  shots = shots.filter((s) => s.file === 'walk-sprout-closeup')
}

async function enterWalk(page) {
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(40)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForFunction(() => window.__mgWalkCapture?.ready?.() === true, undefined, { timeout: 90_000 })
  await page.waitForFunction(
    () => (window.__mgWalkCapture?.worldPlants?.() ?? []).length >= 5,
    undefined,
    { timeout: 90_000 },
  )
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
}

async function bootstrapWalk(page, baseUrl, artStyle) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.evaluate(
    ({ user, art, seeded }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(
        `memorygarden:${user.id}:preferences`,
        JSON.stringify({
          hasCompletedOnboarding: true,
          plantStylePreference: { artStyle: art },
        }),
      )
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
      sessionStorage.setItem('mg:walk-capture', '1')
      sessionStorage.setItem('mg:walk-plant-focus', '1')
    },
    { user: demoUser, art: artStyle, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((art) => window.__mgWalkCapture?.setPlantArtStyle?.(art), artStyle)
  await page.waitForTimeout(2000)
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
  if (artStyle === 'pixel-art') {
    const v = await page.evaluate(() => window.__mgWalkCapture?.voxelMeshCount?.() ?? 0)
    if (v < 40) {
      throw new Error(`Expected voxels in pixel-art walk at ${baseUrl}, got ${v}`)
    }
  }
  if (artStyle === 'watercolor') {
    const v = await page.evaluate(() => window.__mgWalkCapture?.voxelMeshCount?.() ?? 0)
    if (v > 12) {
      throw new Error(`Watercolor walk leaked ${v} voxel meshes (expected pixel decor gated)`)
    }
    const pixelTerrain = await page.evaluate(
      () => window.__mgWalkCapture?.isPixelTerrain?.() === true,
    )
    if (pixelTerrain) {
      throw new Error(`Watercolor walk still on pixel-art terrain at ${baseUrl}`)
    }
  }
}

async function mushroomCloseupPoseForPage(page, plantId) {
  return page.evaluate((id) => {
    const b = window.__mgWalkCapture
    if (typeof b?.mushroomCloseupPose === 'function') {
      return b.mushroomCloseupPose(id)
    }
    return b?.deterministicPlantPose?.(id) ?? null
  }, plantId)
}

async function flowerCloseupPoseForPage(page, plantId, poseSeed = 0) {
  return page.evaluate(
    ({ id, poseSeed }) => {
      const b = window.__mgWalkCapture
      if (typeof b?.flowerCloseupPose === 'function') {
        return b.flowerCloseupPose(id, poseSeed)
      }
      return b?.deterministicPlantPose?.(id) ?? null
    },
    { id: plantId, poseSeed },
  )
}

function warmPetalFracFromPng(pngPath) {
  const png = PNG.sync.read(readFileSync(pngPath))
  let warm = 0
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i]
    const g = png.data[i + 1]
    const b = png.data[i + 2]
    if ((r > 150 && g > 110 && b < 140) || (r > 130 && g < 115 && r > g + 12)) warm++
  }
  return warm / (png.width * png.height)
}

async function bestFlowerCloseupPoseForPage(page, plantId, phase, artStyle) {
  if (!(phase === 'after' && artStyle === 'pixel-art')) {
    return flowerCloseupPoseForPage(page, plantId, 0)
  }
  const canvas = page.locator('[data-testid="open-world-garden"] canvas').first()
  let bestPose = null
  let bestScore = Infinity
  for (let seed = 0; seed < 48; seed++) {
    const pose = await flowerCloseupPoseForPage(page, plantId, seed)
    if (!pose) continue
    await applyPose(page, pose)
    await page.evaluate((id) => {
      window.__mgWalkCapture?.setSoloPlantFocus?.(id ?? null)
    }, plantId)
    await page.evaluate(async () => {
      await window.__mgWalkCapture?.waitCaptureReady?.()
    })
    const probe = resolve(outDir, `__flower_pose_probe_${seed}.png`)
    await canvas.screenshot({ path: probe })
    const cov = await page.evaluate(
      ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
      { id: plantId, p: pose },
    )
    const treeFill = measureElderColumnVerticalFillFromPng(probe).heightFrac ?? 1
    const warmFrac = warmPetalFracFromPng(probe)
    unlinkSync(probe)
    if (cov >= 0.12 && treeFill <= 0.55 && warmFrac >= 0.0025) {
      console.log(`flower pose seed ${seed} ok (treeFill ${(treeFill * 100).toFixed(0)}%)`)
      return pose
    }
    const score = treeFill * 2 + Math.max(0, 0.12 - cov) + Math.max(0, 0.0025 - warmFrac) * 40
    if (score < bestScore) {
      bestScore = score
      bestPose = pose
    }
  }
  if (bestPose) {
    console.warn('flower pose: using best-effort seed (guards may be relaxed)')
    return bestPose
  }
  return flowerCloseupPoseForPage(page, plantId, 0)
}

async function youngCloseupPoseForPage(page, plantId) {
  return page.evaluate((id) => {
    const b = window.__mgWalkCapture
    if (typeof b?.youngCloseupPose === 'function') {
      return b.youngCloseupPose(id)
    }
    return b?.deterministicPlantPose?.(id) ?? null
  }, plantId)
}

async function elderCloseupPoseForPage(page, plantId) {
  return page.evaluate((id) => {
    const b = window.__mgWalkCapture
    if (!b) return null
    if (typeof b.elderCloseupPose === 'function') {
      return b.elderCloseupPose(id)
    }
    const aabb = typeof b.plantWorldAabb === 'function' ? b.plantWorldAabb(id) : null
    let box = aabb
    if (!box) {
      const size = b.plantBoxSize?.(id)
      const wp = b.worldPlants?.().find((p) => p.id === id)
      if (!size || !wp) return null
      const foot = b.footAt?.(wp.x, wp.z) ?? 0
      box = {
        minX: wp.x - size.x / 2,
        maxX: wp.x + size.x / 2,
        minZ: wp.z - size.z / 2,
        maxZ: wp.z + size.z / 2,
        minY: foot,
        maxY: foot + size.y,
      }
    }
    const groundY = box.minY
    const H = box.maxY - groundY
    const cx = (box.minX + box.maxX) / 2
    const cz = (box.minZ + box.maxZ) / 2
    const R = Math.max(box.maxX - box.minX, box.maxZ - box.minZ) * 0.5
    const fov = typeof b.captureCameraFov === 'function' ? b.captureCameraFov() : 68
    const fovRad = (fov * Math.PI) / 180
    const halfFovTan = Math.tan(fovRad / 2)
    const aabbSlack = 1.68
    const D_v = (((H * 1.25) / 2) / halfFovTan) * aabbSlack
    const D_h = ((R * 1.25) / (halfFovTan * (b.captureCameraAspect?.() ?? 1.6))) * 1.4
    const D = Math.max(R * 2.2, D_v, D_h)
    const yaw = -0.68
    const x = cx + Math.sin(yaw) * D
    const z = cz + Math.cos(yaw) * D
    const foot = b.footAt?.(x, z) ?? 0
    const aimY = groundY + H * 0.5
    const eyeY = Math.max(foot + 0.08, aimY)
    return { x, z, yaw, pitch: 0, eyeY }
  }, plantId)
}

function isSkyPixel(r, g, b) {
  return classifyWalkCapturePixel(r, g, b) === 'sky'
}

function skyFractionTopBand(pngPath, topFraction = 0.06) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const topRows = Math.max(1, Math.ceil(png.height * topFraction))
  let sky = 0
  let total = 0
  for (let y = 0; y < topRows; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      if (isSkyPixel(r, g, b)) sky++
      total++
    }
  }
  return total > 0 ? sky / total : 0
}

function skyFractionTopCenterColumn(pngPath, centerX01, topFraction = 0.04) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const topRows = Math.max(1, Math.ceil(png.height * topFraction))
  const col = Math.min(png.width - 1, Math.max(0, Math.round(centerX01 * png.width)))
  let sky = 0
  let total = 0
  for (let y = 0; y < topRows; y++) {
    const i = (png.width * y + col) * 4
    const r = png.data[i]
    const g = png.data[i + 1]
    const b = png.data[i + 2]
    if (isSkyPixel(r, g, b)) sky++
    total++
  }
  return total > 0 ? sky / total : 0
}

async function assertElderCloseupFrame(page, plantId, pngPath, phase, artStyle, pose) {
  const projBox = await page.evaluate(
    (id) => window.__mgWalkCapture?.plantProjectedAabbScreen?.(id) ?? null,
    plantId,
  )
  const centerX =
    projBox && Number.isFinite(projBox.left) && Number.isFinite(projBox.right)
      ? (projBox.left + projBox.right) / 2
      : 0.5
  const pngCol = measureElderColumnVerticalFillFromPng(pngPath, centerX, 40)
  const skyTopCol =
    phase === 'after' ? skyFractionTopCenterColumn(pngPath, centerX, 0.04) : NaN
  console.log(
    `elder-frame-assert ${phase} ${artStyle} pngColumnHeight=${Number.isFinite(pngCol.heightFrac) ? (pngCol.heightFrac * 100).toFixed(1) : 'n/a'}% pngTop=${Number.isFinite(pngCol.topFrac) ? (pngCol.topFrac * 100).toFixed(1) : 'n/a'}% pngBot=${Number.isFinite(pngCol.bottomFrac) ? (pngCol.bottomFrac * 100).toFixed(1) : 'n/a'}% centerSkyTop4%=${Number.isFinite(skyTopCol) ? (skyTopCol * 100).toFixed(0) : 'n/a'}%`,
  )
  if (phase === 'after') {
    writeFileSync(
      resolve(outDir, 'ELDER_PNG_FRAME_METRICS.jsonl'),
      `${JSON.stringify({ phase, artStyle, ...pngCol, skyTop4: skyTopCol })}\n`,
      { flag: 'a' },
    )
  }
}

async function assertMushroomCloseupFrame(page, plantId, pngPath, phase, artStyle, pose) {
  const aabb = await page.evaluate((id) => window.__mgWalkCapture?.plantWorldAabb?.(id) ?? null, plantId)
  const worldH = aabb ? aabb.maxY - aabb.minY : NaN
  const cov = await page.evaluate(
    ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
    { id: plantId, p: pose },
  )
  const proj = await page.evaluate((id) => window.__mgWalkCapture?.plantProjectedAabbScreen?.(id) ?? null, plantId)
  console.log(
    `mushroom-frame-assert ${phase} ${artStyle} worldH=${Number.isFinite(worldH) ? worldH.toFixed(2) : 'n/a'} coverage=${cov.toFixed(3)} proj=${proj ? JSON.stringify(proj) : 'n/a'}`,
  )
  const errs = []
  if (Number.isFinite(worldH) && artStyle === 'pixel-art' && phase === 'after' && worldH > 2.35) {
    errs.push(`world height ${worldH.toFixed(2)} > 2.35 (target ~1.5–2)`)
  }
  if (Number.isFinite(worldH) && artStyle === 'pixel-art' && phase === 'after' && worldH < 1.2) {
    errs.push(`world height ${worldH.toFixed(2)} < 1.2 (target ~1.5–2)`)
  }
  if (proj && artStyle === 'pixel-art') {
    const { left, right, top, bottom } = proj
    const margin = phase === 'after' ? 0.085 : 0.1
    if (phase === 'after' && Number.isFinite(worldH) && worldH >= 1.2 && worldH <= 2.35 && top >= 0 && top <= 1) {
      if (
        top < margin ||
        bottom > 1 - margin ||
        left < margin ||
        right > 1 - margin
      ) {
        errs.push(
          `AABB not inside frame margin ${margin}: L${left.toFixed(3)} R${right.toFixed(3)} T${top.toFixed(3)} B${bottom.toFixed(3)}`,
        )
      }
      const span = bottom - top
      if (span < 0.22 || span > 0.74) {
        errs.push(`vertical span ${span.toFixed(3)} outside 0.22–0.74`)
      }
    }
    if (phase === 'before' && Number.isFinite(worldH) && worldH < 1.25) {
      if (bottom - top < 0.1) errs.push(`legacy mushroom span ${(bottom - top).toFixed(3)} < 0.1 (too far)`)
    }
  }
  if (errs.length) {
    throw new Error(`Mushroom close-up frame check failed (${phase} ${artStyle}): ${errs.join('; ')}`)
  }
}

async function poseForShot(page, shot) {
  return page.evaluate(async (s) => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
    if (!s.plantId) {
      return window.__mgWalkCapture?.clusterOverviewPose?.() ?? null
    }
    if (!window.__mgWalkCapture?.hasPlantGroup?.(s.plantId)) {
      throw new Error(`Missing plant group ${s.plantId}`)
    }
    if (s.plantId === 'sprout-walk' && window.__mgWalkCapture?.sproutWalkCloseupPose) {
      return window.__mgWalkCapture.sproutWalkCloseupPose(s.plantId)
    }
    return window.__mgWalkCapture?.deterministicPlantPose?.(s.plantId) ?? null
  }, shot)
}

async function applyPose(page, pose) {
  await page.evaluate((p) => {
    window.__mgWalkCapture?.setPose?.(p)
  }, pose)
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
}

async function deriveAllPoses(page) {
  const poses = {}
  for (const shot of shots) {
    if (shot.file === 'walk-sprout-closeup') continue
    const pose = await poseForShot(page, shot)
    if (!pose) throw new Error(`No deterministic pose for ${shot.file}`)
    poses[shot.file] = pose
    console.log('pinned pose', shot.file, JSON.stringify(pose))
  }
  if (viewportMode === 'desktop' && mode === 'full') {
    writeFileSync(posePath, JSON.stringify(poses, null, 2))
  }
  return poses
}

async function captureShot(page, phase, artStyle, shot, pose) {
  if (shot.file === 'walk-sprout-closeup' && shot.plantId) {
    await page.evaluate((plantId) => {
      window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null)
    }, shot.plantId)
    await page.evaluate(async () => {
      await window.__mgWalkCapture?.waitCaptureReady?.()
    })
    pose = await poseForShot(page, shot)
  }
  await applyPose(page, pose)
  if (shot.file !== 'walk-sprout-closeup') {
    await page.evaluate((plantId) => {
      window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null)
    }, shot.plantId ?? null)
  }
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
  const shaTag = phase === 'after' ? afterSha : beforeSha
  const name = `minecraft-walk-${phase}-${shaTag}-${artStyle}-${shot.file}-${viewportMode}.png`
  const legacyName = `minecraft-walk-${phase}-${artStyle}-${shot.file}-${viewportMode}.png`
  const file = resolve(outDir, name)
  if (shot.file === 'walk-sprout-closeup' && shot.plantId) {
    const sproutOk = await page.evaluate(
      ({ id, p }) => {
        window.__mgWalkCapture?.setSoloPlantFocus?.(id)
        window.__mgWalkCapture?.setPose?.(p)
        const proj = window.__mgWalkCapture?.plantProjectedAabbScreen?.(id)
        const span = proj && Number.isFinite(proj.bottom) ? proj.bottom - proj.top : 0
        return { span, proj }
      },
      { id: shot.plantId, p: pose },
    )
    console.log('sprout-aabb-pre-shot', phase, artStyle, JSON.stringify(sproutOk))
    if (phase === 'after' && artStyle === 'watercolor' && sproutOk.span < 0.1) {
      throw new Error(`Sprout watercolor AABB span ${sproutOk.span.toFixed(3)} < 0.10 before screenshot`)
    }
    if (phase === 'after' && artStyle === 'watercolor' && sproutOk.span > 0.28) {
      throw new Error(`Sprout watercolor AABB span ${sproutOk.span.toFixed(3)} > 0.28 (expected 10–25% frame height)`)
    }
    await page.evaluate(async () => {
      await window.__mgWalkCapture?.waitCaptureReady?.()
    })
  }
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  if (shot.file === 'walk-tree-elder-closeup' && shot.plantId) {
    await assertElderCloseupFrame(page, shot.plantId, file, phase, artStyle, pose)
  }
  if (shot.file === 'walk-mushroom-closeup' && shot.plantId && artStyle === 'pixel-art') {
    await assertMushroomCloseupFrame(page, shot.plantId, file, phase, artStyle, pose)
  }
  if (shot.file === 'walk-flower-closeup' && shot.plantId && artStyle === 'pixel-art' && phase === 'after') {
    const cov = await page.evaluate(
      ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
      { id: shot.plantId, p: pose },
    )
    if (cov < 0.08) {
      throw new Error(`Pixel flower close-up coverage ${cov.toFixed(3)} < 0.08`)
    }
    const treeFill = measureElderColumnVerticalFillFromPng(file)
    const warmFrac = warmPetalFracFromPng(file)
    if (Number.isFinite(treeFill.heightFrac) && treeFill.heightFrac > 0.72 && warmFrac < 0.001) {
      throw new Error(
        `Pixel flower close-up center column tree fill ${(treeFill.heightFrac * 100).toFixed(0)}% with no warm petals`,
      )
    }
  }
  if (shot.file === 'walk-sprout-closeup' && shot.plantId && artStyle === 'watercolor' && phase === 'after') {
    const cov = await page.evaluate(
      ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
      { id: shot.plantId, p: pose },
    )
    if (cov < 0.03) {
      throw new Error(`Watercolor sprout coverage ${cov.toFixed(3)} < 0.03 after close-up mesh boost`)
    }
  }
  if (shot.file === 'walk-tree-young-closeup' && shot.plantId && artStyle === 'watercolor') {
    const proj = await page.evaluate(
      (id) => window.__mgWalkCapture?.plantProjectedAabbScreen?.(id) ?? null,
      shot.plantId,
    )
    const span = proj && Number.isFinite(proj.bottom) ? proj.bottom - proj.top : 0
    console.log(`young-aabb-assert ${phase} ${artStyle} span=${span.toFixed(3)}`, proj ? JSON.stringify(proj) : 'n/a')
    if (phase === 'after' && span < 0.3) {
      throw new Error(`Young watercolor AABB span ${span.toFixed(3)} < 0.30 (required >=30% frame height)`)
    }
  }
  await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  if (shot.plantId) {
    const has = await page.evaluate((id) => window.__mgWalkCapture?.hasPlantGroup?.(id) === true, shot.plantId)
    if (!has) throw new Error(`Missing plant ${shot.plantId} for ${phase} ${artStyle} ${shot.file}`)
    const cov = await page.evaluate(
      ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
      { id: shot.plantId, p: pose },
    )
    const minCov = covThreshold
    const flag = cov >= minCov ? 'ok' : 'LOW'
    console.log(`coverage[${flag}]`, phase, artStyle, shot.file, cov.toFixed(3))
  }
  writeFileSync(resolve(outDir, legacyName), readFileSync(file))
  console.log('Wrote', file, legacyName)
  return file
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: viewports[viewportMode] ?? viewports.desktop,
  })
  await context.addInitScript(({ user, memories: seeded }) => {
    sessionStorage.setItem('mg:walk-capture', '1')
    sessionStorage.setItem('mg:walk-plant-focus', '1')
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(
      `memorygarden:${user.id}:preferences`,
      JSON.stringify({
        hasCompletedOnboarding: true,
        plantStylePreference: { artStyle: 'pixel-art' },
      }),
    )
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
    const OriginalDate = Date
    // eslint-disable-next-line no-global-assign
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(2026, 5, 15, 14, 30, 0)
        else super(...args)
      }
      static now() {
        return new OriginalDate(2026, 5, 15, 14, 30, 0).getTime()
      }
    }
  }, { user: demoUser, memories })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )

  const page = await context.newPage()

  let poses = null
  if (existsSync(posePath)) {
    poses = JSON.parse(readFileSync(posePath, 'utf8'))
  }

  if (!poses && mode === 'overview') {
    throw new Error(`Missing ${posePath} — run desktop full capture first`)
  }

  if (!poses) poses = {}
  const posePinnedExternally = new Set([
    'walk-tree-elder-closeup',
    'walk-mushroom-closeup',
    'walk-tree-young-closeup',
    'walk-flower-closeup',
  ])
  if (captureOnly !== 'elder' && captureOnly !== 'mushroom' && captureOnly !== 'detail') {
    const missing = shots.filter((s) => !poses[s.file] && !posePinnedExternally.has(s.file))
    if (missing.length) {
      const poseSeedUrl =
        capturePhase === 'before' ? beforeUrl : capturePhase === 'after' ? afterUrl : afterUrl
      const poseSeedStyle = walkArtStyles.includes('pixel-art') ? 'pixel-art' : (walkArtStyles[0] ?? 'watercolor')
      await bootstrapWalk(page, poseSeedUrl, poseSeedStyle)
      if (poseSeedStyle === 'pixel-art') {
        const v = await page.evaluate(() => window.__mgWalkCapture?.voxelMeshCount?.() ?? 0)
        if (v < 40) throw new Error(`Expected voxels for pose seed at ${poseSeedUrl}, got ${v}`)
      }
      const derived = await deriveAllPoses(page)
      poses = { ...poses, ...derived }
    }
  }

  const runDefs = [
    { phase: 'after', url: afterUrl, styles: walkArtStyles },
    { phase: 'before', url: beforeUrl, styles: walkArtStyles },
  ]
  const runs = runDefs.filter((r) => {
    if (capturePhase === 'both') return true
    if (capturePhase === 'after') return r.phase === 'after'
    if (capturePhase === 'before') return r.phase === 'before'
    throw new Error(`Unknown CAPTURE_PHASE=${capturePhase}`)
  })

  const styleListForRun =
    captureOnly === 'mushroom'
      ? (styles) => styles.filter((s) => s === 'pixel-art')
      : (styles) => styles

  for (const run of runs) {
    const elderShot = shots.find((s) => s.file === 'walk-tree-elder-closeup')
    const youngShot = shots.find((s) => s.file === 'walk-tree-young-closeup')
    const flowerShot = shots.find((s) => s.file === 'walk-flower-closeup')
    const mushroomShot = shots.find((s) => s.file === 'walk-mushroom-closeup')
    for (const artStyle of styleListForRun(run.styles)) {
      await bootstrapWalk(page, run.url, artStyle)
      let elderPoseForStyle = null
      let youngPoseForStyle = null
      let flowerPoseForStyle = null
      let mushroomPoseForStyle = null
      if (mode !== 'overview' && elderShot?.plantId) {
        await page.evaluate((plantId) => {
          window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null)
        }, elderShot.plantId)
        await page.evaluate(async () => {
          await window.__mgWalkCapture?.waitCaptureReady?.()
        })
        elderPoseForStyle = await elderCloseupPoseForPage(page, elderShot.plantId)
        if (!elderPoseForStyle) throw new Error(`No elder close-up pose for ${run.url} ${artStyle}`)
        console.log(`elder pose (${run.phase} ${artStyle})`, JSON.stringify(elderPoseForStyle))
        await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
      }
      if (mode !== 'overview' && flowerShot?.plantId) {
        await page.evaluate((plantId) => {
          window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null)
        }, flowerShot.plantId)
        await page.evaluate(async () => {
          await window.__mgWalkCapture?.waitCaptureReady?.()
        })
        flowerPoseForStyle = await bestFlowerCloseupPoseForPage(
          page,
          flowerShot.plantId,
          run.phase,
          artStyle,
        )
        if (!flowerPoseForStyle) {
          throw new Error(`No flower close-up pose for ${run.url} ${artStyle}`)
        }
        console.log(`flower pose (${run.phase} ${artStyle})`, JSON.stringify(flowerPoseForStyle))
        await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
      }
      if (mode !== 'overview' && youngShot?.plantId) {
        await page.evaluate((plantId) => {
          window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null)
        }, youngShot.plantId)
        await page.evaluate(async () => {
          await window.__mgWalkCapture?.waitCaptureReady?.()
        })
        youngPoseForStyle = await youngCloseupPoseForPage(page, youngShot.plantId)
        if (!youngPoseForStyle) {
          throw new Error(`No young close-up pose for ${run.url} ${artStyle}`)
        }
        console.log(`young pose (${run.phase} ${artStyle})`, JSON.stringify(youngPoseForStyle))
        await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
      }
      if (mode !== 'overview' && mushroomShot?.plantId) {
        await page.evaluate((plantId) => {
          window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null)
        }, mushroomShot.plantId)
        await page.evaluate(async () => {
          await window.__mgWalkCapture?.waitCaptureReady?.()
        })
        mushroomPoseForStyle = await mushroomCloseupPoseForPage(page, mushroomShot.plantId)
        if (!mushroomPoseForStyle) {
          throw new Error(`No mushroom close-up pose for ${run.url} ${artStyle}`)
        }
        console.log(`mushroom pose (${run.phase} ${artStyle})`, JSON.stringify(mushroomPoseForStyle))
        await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
      }
      for (const shot of shots) {
        let pose =
          shot.file === 'walk-sprout-closeup' ? await poseForShot(page, shot) : poses[shot.file]
        if (shot.file === 'walk-tree-elder-closeup') {
          pose = elderPoseForStyle
        }
        if (shot.file === 'walk-tree-young-closeup') {
          pose = youngPoseForStyle
        }
        if (shot.file === 'walk-flower-closeup') {
          pose = flowerPoseForStyle ?? pose
        }
        if (shot.file === 'walk-mushroom-closeup') {
          pose = mushroomPoseForStyle
        }
        if (!pose) throw new Error(`Missing pose for ${shot.file}`)
        await captureShot(page, run.phase, artStyle, shot, pose)
      }
    }
  }
  if (viewportMode === 'desktop') {
    const persist = { ...poses }
    delete persist['walk-tree-elder-closeup']
    delete persist['walk-mushroom-closeup']
    delete persist['walk-tree-young-closeup']
    delete persist['walk-flower-closeup']
    writeFileSync(posePath, JSON.stringify(persist, null, 2))
  }
} finally {
  await browser.close()
}
