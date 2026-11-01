import { useEffect, useRef } from 'react'
import { TONE_DOT } from '@/lib/open-world/constants'
import { worldToMinimap } from '@/lib/open-world/layout'
import type { GardenWorld, PlayerState } from '@/lib/open-world/types'

const SIZE = 116

interface OpenWorldMinimapProps {
  world: GardenWorld
  player: PlayerState
  hasMorningDew?: boolean
}

export function OpenWorldMinimap({ world, player, hasMorningDew = false }: OpenWorldMinimapProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.width = SIZE
    canvas.height = SIZE
    ctx.fillStyle = 'rgba(8,6,14,0.78)'
    ctx.fillRect(0, 0, SIZE, SIZE)

    ctx.strokeStyle = 'rgba(240,231,218,0.18)'
    ctx.beginPath()
    const pond = worldToMinimap(world.pond.x, world.pond.z, world.bounds, SIZE)
    const pondR = (world.pond.radius / (world.bounds.maxX - world.bounds.minX)) * SIZE
    ctx.arc(pond.x, pond.y, pondR, 0, Math.PI * 2)
    ctx.stroke()

    // Shimmering cyan radar ring around pond during morning dew harvest window
    if (hasMorningDew) {
      ctx.save()
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.75)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(pond.x, pond.y, pondR + 2.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    for (const plant of world.plants) {
      const p = worldToMinimap(plant.x, plant.z, world.bounds, SIZE)

      // Thirst indicator radar halo around plants needing water
      if (plant.needsWater || (plant.moistureLevel !== undefined && plant.moistureLevel < 30.0)) {
        ctx.save()
        ctx.strokeStyle =
          plant.healthStatus === 'dormant' || (plant.moistureLevel !== undefined && plant.moistureLevel <= 0)
            ? 'rgba(244, 63, 94, 0.85)'
            : 'rgba(56, 189, 248, 0.85)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4.4, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      ctx.fillStyle = TONE_DOT[plant.tone] ?? '#f0e7da'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }

    const me = worldToMinimap(player.x, player.z, world.bounds, SIZE)
    ctx.save()
    ctx.translate(me.x, me.y)
    ctx.rotate(-player.yaw)
    ctx.fillStyle = '#f0e7da'
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.lineTo(4, 5)
    ctx.lineTo(-4, 5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }, [world, player, hasMorningDew])

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      className="h-[116px] w-[116px] rounded-lg border border-[#f0e7da]/25 shadow-lg"
      aria-label="Garden map"
      data-testid="open-world-minimap"
    />
  )
}
