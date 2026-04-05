import { Sun, CloudRain, Cloud, CloudSun, Drop } from '@phosphor-icons/react'
import type { GardenMood } from '@/lib/types'

interface WeatherIndicatorProps {
  mood: GardenMood
  className?: string
}

const weatherConfig: Record<string, { icon: typeof Sun; label: string; color: string }> = {
  sunny: { icon: Sun, label: 'Sunny', color: 'oklch(0.80 0.16 85)' },
  mist: { icon: Cloud, label: 'Misty', color: 'oklch(0.70 0.04 220)' },
  rain: { icon: CloudRain, label: 'Rainy', color: 'oklch(0.60 0.10 240)' },
  'rain-sun': { icon: CloudSun, label: 'Rain & Sun', color: 'oklch(0.70 0.12 200)' },
  'golden-haze': { icon: Sun, label: 'Golden Hour', color: 'oklch(0.75 0.14 60)' },
  'partly-cloudy': { icon: Cloud, label: 'Partly Cloudy', color: 'oklch(0.65 0.06 220)' },
}

export function WeatherIndicator({ mood, className = '' }: WeatherIndicatorProps) {
  const config = weatherConfig[mood.weatherType] || weatherConfig['partly-cloudy']
  const Icon = config.icon

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `color-mix(in oklch, ${config.color} 20%, transparent)`,
        color: config.color,
      }}
    >
      <Icon size={14} weight="duotone" />
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  )
}
