import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Microphone, 
  Stop, 
  Trash, 
  Play, 
  Pause,
  Waveform 
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number, type: 'voice-note' | 'ambient-sound') => void
  recordingType?: 'voice-note' | 'ambient-sound'
  maxDuration?: number
  className?: string
}

export function AudioRecorder({ 
  onRecordingComplete, 
  recordingType = 'voice-note',
  maxDuration = 120,
  className 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        
        stream.getTracks().forEach(track => track.stop())
        
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= maxDuration) {
            stopRecording()
            toast.info(`Maximum recording time of ${maxDuration}s reached`)
          }
          return newTime
        })
      }, 1000)

    } catch (error) {
      toast.error('Failed to access microphone. Please check permissions.')
      console.error('Recording error:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= maxDuration) {
            stopRecording()
            toast.info(`Maximum recording time of ${maxDuration}s reached`)
          }
          return newTime
        })
      }, 1000)
    }
  }

  const deleteRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }

  const playRecording = () => {
    if (audioBlob && !audioRef.current) {
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsPlaying(false)
        audioRef.current = null
      }
      
      audio.play()
      setIsPlaying(true)
    }
  }

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const saveRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, recordingTime, recordingType)
      setAudioBlob(null)
      setRecordingTime(0)
      toast.success('Audio saved!')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waveform 
            size={20} 
            weight="duotone" 
            className={cn(
              'transition-colors',
              recordingType === 'ambient-sound' ? 'text-secondary' : 'text-primary'
            )}
          />
          <span className="text-sm font-medium capitalize">
            {recordingType === 'voice-note' ? 'Voice Note' : 'Ambient Sound'}
          </span>
        </div>
        {(isRecording || audioBlob) && (
          <Badge variant={isRecording ? 'default' : 'secondary'}>
            {formatTime(recordingTime)}
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isRecording && !audioBlob && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Button
              onClick={startRecording}
              variant="outline"
              className="w-full"
            >
              <Microphone size={18} weight="fill" className="mr-2" />
              Start Recording
            </Button>
          </motion.div>
        )}

        {isRecording && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex gap-2"
          >
            {!isPaused ? (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause size={18} weight="fill" className="mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={stopRecording}
                  className="flex-1"
                >
                  <Stop size={18} weight="fill" className="mr-2" />
                  Stop
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Microphone size={18} weight="fill" className="mr-2" />
                  Resume
                </Button>
                <Button
                  onClick={stopRecording}
                  className="flex-1"
                >
                  <Stop size={18} weight="fill" className="mr-2" />
                  Finish
                </Button>
              </>
            )}
          </motion.div>
        )}

        {!isRecording && audioBlob && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <Button
                onClick={isPlaying ? pausePlayback : playRecording}
                variant="outline"
                className="flex-1"
              >
                {isPlaying ? (
                  <>
                    <Pause size={18} weight="fill" className="mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={18} weight="fill" className="mr-2" />
                    Play
                  </>
                )}
              </Button>
              <Button
                onClick={deleteRecording}
                variant="ghost"
                size="icon"
              >
                <Trash size={18} />
              </Button>
            </div>
            <Button
              onClick={saveRecording}
              className="w-full"
            >
              Save Recording
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'w-1 rounded-full',
                recordingType === 'ambient-sound' ? 'bg-secondary' : 'bg-primary'
              )}
              animate={{
                height: isPaused ? 8 : [8, 20, 8],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
