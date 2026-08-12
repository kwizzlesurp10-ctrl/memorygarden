/**
 * Magnifying-glass (loupe) geometry for The Lens.
 *
 * The base garden stays at 1×. Only a circular overlay magnifies the point
 * under the cursor. Coordinates are in the same CSS-pixel space as the
 * rendered scene wrap (not the SVG viewBox units, unless those match 1:1).
 */

export const LENS_SIZE = 260
export const LENS_ZOOM_MIN = 1.6
export const LENS_ZOOM_MAX = 4
export const LENS_ZOOM_DEFAULT = 2.4
export const LENS_ZOOM_STEP = 0.2

export interface Point {
  x: number
  y: number
}

export interface Size {
  w: number
  h: number
}

export interface LoupeLayout {
  outer: { left: number; top: number; width: number; height: number }
  /** CSS transform for the full-scene clone inside the loupe */
  innerTransform: string
  transformOrigin: '0 0'
  innerWidth: number
  innerHeight: number
}

/**
 * Place a circular loupe of `lensSize` centered on `cursor` over a scene of
 * `scene` CSS pixels, magnifying by `zoom`.
 *
 * After `scale(zoom)` with origin (0,0), scene point (cx, cy) lands at
 * (cx*zoom, cy*zoom). We translate so that point sits at the loupe center.
 */
export function computeLoupeLayout(
  cursor: Point,
  zoom: number,
  scene: Size,
  lensSize: number = LENS_SIZE,
): LoupeLayout {
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1
  const r = lensSize / 2
  return {
    outer: {
      left: cursor.x - r,
      top: cursor.y - r,
      width: lensSize,
      height: lensSize,
    },
    innerTransform: `translate(${r - cursor.x * safeZoom}px, ${r - cursor.y * safeZoom}px) scale(${safeZoom})`,
    transformOrigin: '0 0',
    innerWidth: scene.w,
    innerHeight: scene.h,
  }
}

export function clampLensZoom(zoom: number): number {
  return Math.min(LENS_ZOOM_MAX, Math.max(LENS_ZOOM_MIN, zoom))
}

export function stepLensZoom(zoom: number, direction: 1 | -1): number {
  return clampLensZoom(zoom + direction * LENS_ZOOM_STEP)
}
