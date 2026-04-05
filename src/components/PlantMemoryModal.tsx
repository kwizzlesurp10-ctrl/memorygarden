import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarBlank, Image as ImageIcon, MapPin, Plant as PlantIcon } from '@phosphor-icons/react'
import { AudioRecorder } from '@/components/AudioRecorder'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { AudioRecording } from '@/lib/types'

interface PlantMemoryModalProps {
  open: boolean
  onClose: () => void
  onPlant: (data: {
    photoFile: File
    text: string
    date: string
    location?: string
    audioRecordings: AudioRecording[]
  }) => void
}

export function PlantMemoryModal({ open, onClose, onPlant }: PlantMemoryModalProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [location, setLocation] = useState('')
  const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>([])
  const [recordingType, setRecordingType] = useState<'voice-note' | 'ambient-sound'>('voice-note')
  const [isPlanting, setIsPlanting] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be smaller than 5MB')
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRecordingComplete = async (audioBlob: Blob, duration: number, type: 'voice-note' | 'ambient-sound') => {
    const reader = new FileReader()
    reader.readAsDataURL(audioBlob)
    
    return new Promise<void>((resolve) => {
      reader.onload = () => {
        const audioRecording: AudioRecording = {
          id: `audio-${Date.now()}`,
          dataUrl: reader.result as string,
          duration,
          createdAt: new Date().toISOString(),
          type,
        }
        setAudioRecordings(prev => [...prev, audioRecording])
        resolve()
      }
    })
  }

  const handlePlant = async () => {
    if (!photoFile) {
      toast.error('Please select a photo')
      return
    }
    if (text.trim().length < 5) {
      toast.error('Please write at least a few words about this memory')
      return
    }

    setIsPlanting(true)
    try {
      await onPlant({
        photoFile,
        text: text.trim(),
        date: date.toISOString(),
        location: location.trim() || undefined,
        audioRecordings,
      })
      
      setPhotoFile(null)
      setPhotoPreview(null)
      setText('')
      setDate(new Date())
      setLocation('')
      setAudioRecordings([])
      onClose()
      
      toast.success('Memory planted! Watch it grow in your garden.')
    } catch (error) {
      toast.error('Failed to plant memory. Please try again.')
    } finally {
      setIsPlanting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <PlantIcon className="text-primary" size={28} weight="duotone" />
            Plant a Memory
          </DialogTitle>
          <DialogDescription className="sr-only">Form to plant a new memory.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Photo *</Label>
            <div className="relative">
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="photo"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                {photoPreview ? (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon size={48} weight="duotone" />
                    <p className="text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Memory *</Label>
            <Textarea
              id="text"
              placeholder="Write a few sentences about this memory... What were you feeling? Who was there? What made this moment special?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarBlank className="mr-2" size={16} />
                    {format(date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="location"
                  placeholder="Where was this?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Audio (optional)</Label>
            <Tabs value={recordingType} onValueChange={(v) => setRecordingType(v as 'voice-note' | 'ambient-sound')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice-note">Voice Note</TabsTrigger>
                <TabsTrigger value="ambient-sound">Ambient Sound</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              recordingType={recordingType}
              maxDuration={120}
            />

            {audioRecordings.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {audioRecordings.length} recording{audioRecordings.length !== 1 ? 's' : ''} added
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isPlanting}>
              Cancel
            </Button>
            <Button onClick={handlePlant} disabled={isPlanting} className="min-w-32">
              <AnimatePresence mode="wait">
                {isPlanting ? (
                  <motion.span
                    key="planting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Planting...
                  </motion.span>
                ) : (
                  <motion.span
                    key="plant"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <PlantIcon size={18} weight="fill" />
                    Plant Memory
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
