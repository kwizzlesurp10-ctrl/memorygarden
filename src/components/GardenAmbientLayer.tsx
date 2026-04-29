import { useEffect, useRef } from 'react'
import type { Season, WeatherType } from '@/lib/types'
import type { DayPeriod } from '@/lib/ambient-garden-params'
import { GardenAmbientEngine, ambientParamsFromGarden } from '@/lib/ambient-garden-engine'

export interface GardenAmbientLayerProps {
  enabled: boolean
  season: Season
  dayPeriod: DayPeriod
  weatherType: WeatherType
  memoryCount: number
}

export function GardenAmbientLayer({
  enabled,
  season,
  dayPeriod,
  weatherType,
  memoryCount,
}: GardenAmbientLayerProps) {
  const engineRef = useRef<GardenAmbientEngine | null>(null)

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
