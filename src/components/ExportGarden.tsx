import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Export, Image as ImageIcon, FilePdf, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Memory } from '@/lib/types'
import { format as formatDate } from 'date-fns'

interface ExportGardenProps {
  open: boolean
  onClose: () => void
  memories: Memory[]
}

type ExportFormat = 'image' | 'pdf'

export function ExportGarden({ open, onClose, memories }: ExportGardenProps) {
  const [format, setFormat] = useState<ExportFormat>('image')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const handleExport = async () => {
    if (memories.length === 0) {
      toast.error('No memories to export')
      return
    }

    setIsExporting(true)
    setProgress(0)
    setIsComplete(false)

    try {
      if (format === 'image') {
        await exportAsImage()
      } else {
        await exportAsPDF()
      }
      
      setIsComplete(true)
      toast.success(`Garden exported successfully!`)
      
      setTimeout(() => {
        onClose()
        setIsComplete(false)
      }, 2000)
    } catch (error) {
      toast.error('Failed to export garden. Please try again.')
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsImage = async () => {
    setProgress(20)
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    const width = 1920
    const height = 1080
    canvas.width = width
    canvas.height = height

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#e8f4f0')
    gradient.addColorStop(0.5, '#f3f8f6')
    gradient.addColorStop(1, '#e0ede8')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    setProgress(40)

    const sortedMemories = [...memories]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 12)

    const cols = 4
    const rows = 3
    const cardWidth = 400
    const cardHeight = 300
    const padding = 40
    const gap = 20

    const totalWidth = cols * cardWidth + (cols - 1) * gap
    const totalHeight = rows * cardHeight + (rows - 1) * gap
    const startX = (width - totalWidth) / 2
    const startY = (height - totalHeight) / 2

    for (let i = 0; i < sortedMemories.length; i++) {
      const memory = sortedMemories[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (cardWidth + gap)
      const y = startY + row * (cardHeight + gap)

      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetY = 10
      ctx.fillRect(x, y, cardWidth, cardHeight)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = () => {
            ctx.save()
            ctx.beginPath()
            ctx.rect(x + 10, y + 10, cardWidth - 20, 180)
            ctx.clip()
            
            const imgAspect = img.width / img.height
            const cardAspect = (cardWidth - 20) / 180
            let drawWidth, drawHeight, drawX, drawY
            
            if (imgAspect > cardAspect) {
              drawHeight = 180
              drawWidth = drawHeight * imgAspect
              drawX = x + 10 - (drawWidth - (cardWidth - 20)) / 2
              drawY = y + 10
            } else {
              drawWidth = cardWidth - 20
              drawHeight = drawWidth / imgAspect
              drawX = x + 10
              drawY = y + 10 - (drawHeight - 180) / 2
            }
            
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            ctx.restore()
            resolve()
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = memory.photoUrl
        })
      } catch (error) {
        console.error('Failed to load image for memory:', memory.id)
      }

      ctx.fillStyle = '#1a1a1a'
      ctx.font = 'bold 16px "Space Grotesk", sans-serif'
      const dateText = formatDate(new Date(memory.date), 'MMM d, yyyy')
      ctx.fillText(dateText, x + 15, y + 215)

      ctx.fillStyle = '#4a4a4a'
      ctx.font = '14px "Crimson Pro", serif'
      const maxTextWidth = cardWidth - 30
      const words = memory.text.split(' ')
      let line = ''
      let lineY = y + 240
      const maxLines = 2

      for (let j = 0; j < words.length; j++) {
        const testLine = line + words[j] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxTextWidth && j > 0) {
          ctx.fillText(line, x + 15, lineY)
          line = words[j] + ' '
          lineY += 20
          if (lineY > y + 240 + 20 * (maxLines - 1)) {
            ctx.fillText(line.trim() + '...', x + 15, lineY)
            break
          }
        } else {
          line = testLine
        }
      }
      if (lineY <= y + 240 + 20 * (maxLines - 1)) {
        ctx.fillText(line, x + 15, lineY)
      }

      setProgress(40 + ((i + 1) / sortedMemories.length) * 40)
    }

    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 32px "Space Grotesk", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('My Memory Garden', width / 2, 60)

    ctx.font = '18px "Crimson Pro", serif'
    ctx.fillStyle = '#4a4a4a'
    ctx.fillText(
      `${memories.length} memories collected (${formatDate(new Date(), 'MMMM yyyy')})`,
      width / 2,
      90
    )

    setProgress(90)

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `memory-garden-${formatDate(new Date(), 'yyyy-MM-dd')}.png`
        link.click()
        URL.revokeObjectURL(url)
        setProgress(100)
      }
    }, 'image/png')
  }

  const exportAsPDF = async () => {
    setProgress(20)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    const sortedMemories = [...memories].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const pageWidth = 2480
    const pageHeight = 3508
    const pages = []

    const memoriesPerPage = 6
    const numPages = Math.ceil(sortedMemories.length / memoriesPerPage)

    for (let pageNum = 0; pageNum < numPages; pageNum++) {
      canvas.width = pageWidth
      canvas.height = pageHeight

      ctx.fillStyle = '#fafaf8'
      ctx.fillRect(0, 0, pageWidth, pageHeight)

      if (pageNum === 0) {
        ctx.fillStyle = '#1a1a1a'
        ctx.font = 'bold 80px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('My Memory Garden', pageWidth / 2, 300)

        ctx.font = '40px "Crimson Pro", serif'
        ctx.fillStyle = '#4a4a4a'
        ctx.fillText(
          `${memories.length} memories collected`,
          pageWidth / 2,
          400
        )
        ctx.fillText(formatDate(new Date(), 'MMMM d, yyyy'), pageWidth / 2, 460)
      }

      const startIndex = pageNum * memoriesPerPage
      const endIndex = Math.min(startIndex + memoriesPerPage, sortedMemories.length)
      const pageMemories = sortedMemories.slice(startIndex, endIndex)

      const startY = pageNum === 0 ? 600 : 200
      const cardHeight = 500
      const gap = 50

      for (let i = 0; i < pageMemories.length; i++) {
        const memory = pageMemories[i]
        const y = startY + i * (cardHeight + gap)

        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = () => {
              const imgSize = 400
              const imgX = 200
              const imgY = y

              ctx.save()
              ctx.beginPath()
              ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2)
              ctx.clip()

              const imgAspect = img.width / img.height
              let drawWidth, drawHeight, drawX, drawY

              if (imgAspect > 1) {
                drawHeight = imgSize
                drawWidth = drawHeight * imgAspect
                drawX = imgX - (drawWidth - imgSize) / 2
                drawY = imgY
              } else {
                drawWidth = imgSize
                drawHeight = drawWidth / imgAspect
                drawX = imgX
                drawY = imgY - (drawHeight - imgSize) / 2
              }

              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
              ctx.restore()

              ctx.strokeStyle = '#d4d4d4'
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2)
              ctx.stroke()

              resolve()
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = memory.photoUrl
          })
        } catch (error) {
          console.error('Failed to load image for memory:', memory.id)
        }

        const textX = 650
        const textMaxWidth = pageWidth - textX - 200

        ctx.fillStyle = '#1a1a1a'
        ctx.font = 'bold 36px "Space Grotesk", sans-serif'
        ctx.textAlign = 'left'
        const dateText = formatDate(new Date(memory.date), 'MMMM d, yyyy')
        ctx.fillText(dateText, textX, y + 50)

        if (memory.location) {
          ctx.fillStyle = '#7a7a7a'
          ctx.font = '28px "Space Grotesk", sans-serif'
          ctx.fillText(memory.location, textX, y + 95)
        }

        ctx.fillStyle = '#2a2a2a'
        ctx.font = '32px "Crimson Pro", serif'
        const words = memory.text.split(' ')
        let line = ''
        let lineY = y + (memory.location ? 150 : 120)
        const lineHeight = 42
        const maxLines = 5

        for (let j = 0; j < words.length; j++) {
          const testLine = line + words[j] + ' '
          const metrics = ctx.measureText(testLine)
          if (metrics.width > textMaxWidth && j > 0) {
            ctx.fillText(line, textX, lineY)
            line = words[j] + ' '
            lineY += lineHeight
            if (lineY > y + (memory.location ? 150 : 120) + lineHeight * (maxLines - 1)) {
              ctx.fillText(line.trim() + '...', textX, lineY)
              break
            }
          } else {
            line = testLine
          }
        }
        if (lineY <= y + (memory.location ? 150 : 120) + lineHeight * (maxLines - 1)) {
          ctx.fillText(line, textX, lineY)
        }
      }

      ctx.fillStyle = '#a0a0a0'
      ctx.font = '24px "Space Grotesk", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Page ${pageNum + 1} of ${numPages}`,
        pageWidth / 2,
        pageHeight - 100
      )

      await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) pages.push(blob)
          resolve()
        }, 'image/png')
      })

      setProgress(20 + ((pageNum + 1) / numPages) * 70)
    }

    const link = document.createElement('a')
    const url = URL.createObjectURL(pages[0])
    link.href = url
    link.download = `memory-garden-booklet-${formatDate(new Date(), 'yyyy-MM-dd')}.png`
    link.click()
    URL.revokeObjectURL(url)

    setProgress(100)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpenParam) => !isOpenParam && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Export className="text-primary" size={28} weight="duotone" />
            Export Your Garden
          </DialogTitle>
          <DialogDescription className="sr-only">
            Options to export your garden.
          </DialogDescription>
        </DialogHeader>

        {!isExporting && !isComplete && (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="image" id="image" />
                  <Label htmlFor="image" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <ImageIcon size={24} weight="duotone" className="text-primary" />
                      <div>
                        <div className="font-semibold">Garden Snapshot</div>
                        <div className="text-sm text-muted-foreground">
                          Beautiful grid of up to 12 memories
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FilePdf size={24} weight="duotone" className="text-primary" />
                      <div>
                        <div className="font-semibold">Memory Booklet</div>
                        <div className="text-sm text-muted-foreground">
                          Multi-page document with all memories
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {format === 'image'
                  ? 'A high-resolution image (1920×1080) showing your most recent memories in a beautiful grid layout.'
                  : 'A printable multi-page document with all your memories, perfect for creating a physical keepsake.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleExport} className="flex-1">
                <Export size={18} weight="fill" className="mr-2" />
                Export {format === 'image' ? 'Image' : 'Booklet'}
              </Button>
            </div>
          </div>
        )}

        {isExporting && !isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 py-8"
          >
            <div className="text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <Export size={48} weight="duotone" className="text-primary" />
              </motion.div>
              <p className="text-lg font-semibold">Exporting your garden...</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment for larger gardens
              </p>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">{Math.round(progress)}%</p>
          </motion.div>
        )}

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 py-8"
          >
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10"
              >
                <Check size={32} weight="bold" className="text-primary" />
              </motion.div>
              <p className="text-lg font-semibold">Export Complete!</p>
              <p className="text-sm text-muted-foreground">
                Your garden has been downloaded successfully
              </p>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}

}
