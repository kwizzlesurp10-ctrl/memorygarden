import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Waveform } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { AudioRecording } from '@/lib/types'

interface AudioPlayerProps {
  recording: AudioRecording
  className?: string
}

export function AudioPlayer({ recording, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const updateTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      animationFrameRef.current = requestAnimationFrame(updateTime)
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) {
      const audio = new Audio(recording.dataUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      updateTime()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (currentTime / recording.duration) * 100

  return (
    <div className={cn('flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border', className)}>
      <Button
        onClick={togglePlayback}
        size="icon"
        variant="ghost"
        className="flex-shrink-0"
      >
        {isPlaying ? (
          <Pause size={18} weight="fill" />
        ) : (
          <Play size={18} weight="fill" />
        )}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Waveform 
            size={16} 
            weight="duotone" 
            className={cn(
              recording.type === 'ambient-sound' ? 'text-secondary' : 'text-primary'
            )}
          />
          <span className="text-xs text-muted-foreground capitalize">
            {recording.type === 'voice-note' ? 'Voice Note' : 'Ambient Sound'}
          </span>
        </div>
        <div className="relative h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              recording.type === 'ambient-sound' ? 'bg-secondary' : 'bg-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      <Badge variant="outline" className="text-xs">
        {isPlaying ? formatTime(currentTime) : formatTime(recording.duration)}
      </Badge>
    </div>
  )
}
