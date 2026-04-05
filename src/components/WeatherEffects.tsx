import { motion } from 'framer-motion'
import type { GardenMood, Season } from '@/lib/types'

interface WeatherEffectsProps {
  mood: GardenMood
  season: Season
}

export function WeatherEffects({ mood, season }: WeatherEffectsProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    return <WeatherTint mood={mood} />
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      <WeatherTint mood={mood} />
      {mood.weatherType === 'sunny' && <SunbeamEffect intensity={mood.intensity} season={season} />}
      {mood.weatherType === 'mist' && <MistEffect intensity={mood.intensity} />}
      {mood.weatherType === 'rain' && <RainEffect intensity={mood.intensity} season={season} />}
      {mood.weatherType === 'rain-sun' && (
        <>
          <RainEffect intensity={mood.intensity * 0.6} season={season} />
          <SunbeamEffect intensity={mood.intensity * 0.4} season={season} />
        </>
      )}
      {mood.weatherType === 'golden-haze' && <GoldenHazeEffect intensity={mood.intensity} />}
      {mood.weatherType === 'partly-cloudy' && <CloudEffect intensity={mood.intensity} />}
    </div>
  )
}

function WeatherTint({ mood }: { mood: GardenMood }) {
  const tints: Record<string, string> = {
    sunny: 'rgba(255, 223, 120, 0.06)',
    mist: 'rgba(200, 220, 240, 0.08)',
    rain: 'rgba(130, 160, 200, 0.06)',
    'rain-sun': 'rgba(180, 190, 200, 0.05)',
    'golden-haze': 'rgba(220, 180, 100, 0.08)',
    'partly-cloudy': 'rgba(180, 195, 210, 0.04)',
  }

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3 }}
      style={{ backgroundColor: tints[mood.weatherType] || 'transparent' }}
    />
  )
}

function SunbeamEffect({ intensity, season }: { intensity: number; season: Season }) {
  const color = season === 'autumn' ? 'rgba(255, 190, 80, 0.12)' : 'rgba(255, 235, 150, 0.1)'
  const beamCount = Math.min(6, Math.floor(intensity * 8))

  return (
    <>
      {Array.from({ length: beamCount }).map((_, i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute"
          style={{
            top: '-10%',
            left: `${15 + i * 14}%`,
            width: '2px',
            height: '120%',
            background: `linear-gradient(to bottom, ${color}, transparent 80%)`,
            transformOrigin: 'top center',
          }}
          animate={{
            opacity: [0.3, 0.7 * intensity, 0.3],
            rotate: [-2 + i, 2 + i, -2 + i],
            scaleX: [1, 2, 1],
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}
      {/* Lens flare */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          top: '5%',
          right: '15%',
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
        }}
        animate={{
          opacity: [0.2, 0.5 * intensity, 0.2],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  )
}

function RainEffect({ intensity, season }: { intensity: number; season: Season }) {
  const isSnow = season === 'winter'
  const dropCount = Math.min(40, Math.floor(intensity * 30) + 8)

  if (isSnow) {
    return (
      <>
        {Array.from({ length: dropCount }).map((_, i) => (
          <motion.div
            key={`snowdrop-${i}`}
            className="absolute w-1.5 h-1.5 bg-white/60 rounded-full"
            style={{
              left: `${(i * 7.3) % 100}%`,
              top: '-3%',
              boxShadow: '0 0 3px rgba(255,255,255,0.5)',
            }}
            animate={{
              y: ['0vh', '105vh'],
              x: [0, (i % 2 === 0 ? 15 : -15), 0],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 10 + (i % 4) * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.4,
            }}
          />
        ))}
      </>
    )
  }

  return (
    <>
      {Array.from({ length: dropCount }).map((_, i) => (
        <motion.div
          key={`rain-${i}`}
          className="absolute"
          style={{
            left: `${(i * 5.1 + 2) % 100}%`,
            top: '-5%',
            width: '1px',
            height: `${8 + (i % 3) * 4}px`,
            backgroundColor: 'rgba(160, 190, 220, 0.4)',
            borderRadius: '1px',
          }}
          animate={{
            y: ['0vh', '105vh'],
            opacity: [0, 0.6 * intensity, 0.6 * intensity, 0],
          }}
          transition={{
            duration: 1.5 + (i % 3) * 0.5,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.12,
          }}
        />
      ))}
    </>
  )
}

function MistEffect({ intensity }: { intensity: number }) {
  const wispCount = Math.min(8, Math.floor(intensity * 6) + 2)

  return (
    <>
      {Array.from({ length: wispCount }).map((_, i) => (
        <motion.div
          key={`mist-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${(i * 20 - 10) % 100}%`,
            top: `${30 + (i * 13) % 50}%`,
            width: `${150 + (i % 3) * 80}px`,
            height: `${40 + (i % 2) * 20}px`,
            background: `radial-gradient(ellipse, rgba(220, 235, 250, ${0.15 * intensity}), transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            x: [(i % 2 === 0 ? -100 : 100), (i % 2 === 0 ? 100 : -100)],
            opacity: [0.3, 0.6 * intensity, 0.3],
          }}
          transition={{
            duration: 20 + i * 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}
    </>
  )
}

function GoldenHazeEffect({ intensity }: { intensity: number }) {
  const moteCount = Math.min(20, Math.floor(intensity * 15) + 5)

  return (
    <>
      {/* Warm vignette */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(180, 140, 60, ${0.06 * intensity}) 100%)`,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Floating dust motes */}
      {Array.from({ length: moteCount }).map((_, i) => (
        <motion.div
          key={`mote-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${(i * 11 + 5) % 95}%`,
            top: `${(i * 17 + 10) % 85}%`,
            backgroundColor: `rgba(255, 210, 120, ${0.3 * intensity})`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, (i % 2 === 0 ? 10 : -10), 0],
            opacity: [0.2, 0.6 * intensity, 0.2],
          }}
          transition={{
            duration: 6 + (i % 4) * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </>
  )
}

function CloudEffect({ intensity }: { intensity: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            top: `${5 + i * 8}%`,
            left: '-20%',
            width: `${180 + i * 40}px`,
            height: `${50 + i * 10}px`,
            background: `radial-gradient(ellipse, rgba(220, 225, 235, ${0.2 * intensity}), transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(15px)',
          }}
          animate={{
            x: ['-20vw', '120vw'],
          }}
          transition={{
            duration: 60 + i * 15,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 10,
          }}
        />
      ))}
    </>
  )
}
