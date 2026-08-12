import { useEffect, useRef } from 'react'
import type { Season, WeatherType } from '@/lib/types'
import { GardenAmbientEngine, ambientParamsFromGarden } from '@/lib/ambient-garden-engine'
import { realClockTod, todToDayPeriod } from '@/lib/garden/day-night'

export interface GardenAmbientLayerProps {
  enabled: boolean
  season: Season
  /** Continuous 0–24 clock hour; defaults to real time when omitted. */
  todHours?: number
  weatherType: WeatherType
  memoryCount: number
}

export function GardenAmbientLayer({
  enabled,
  season,
  todHours,
  weatherType,
  memoryCount,
}: GardenAmbientLayerProps) {
  const engineRef = useRef<GardenAmbientEngine | null>(null)
  const clock = todHours ?? realClockTod()
  const dayPeriod = todToDayPeriod(clock)

  useEffect(() => {
    engineRef.current = new GardenAmbientEngine()
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    const params = ambientParamsFromGarden(season, dayPeriod, weatherType, memoryCount)

    if (!enabled) {
      engine.stop()
      return
    }

    void engine.start(params)
  }, [enabled, season, dayPeriod, weatherType, memoryCount])

  return null
}