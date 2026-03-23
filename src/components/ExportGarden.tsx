import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Export, Image as ImageIcon, FilePdf } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Memory } from '@/lib/types'

interface ExportGardenProps {
  open: boolean
  onClose: () => void
  memories: Memory[]
}

type ExportFormat = 'image' | 'pdf'

export function ExportGarden({ open, onClose, memories }: ExportGardenProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('image')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setProgress(0)

    try {
      if (exportFormat === 'image') {
        await exportAsImage()
      } else {
        await exportAsBooklet()
      }
      setIsComplete(true)
    } catch (error) {
      toast.error('Failed to export. Please try again.')
      setIsExporting(false)
      setProgress(0)
    }
  }

  const exportAsImage = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    const width = 3000
    const height = 2000
    canvas.width = width
    canvas.height = height

    setProgress(10)

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#e8f4f0')
    gradient.addColorStop(0.5, '#f3f8f6')
    gradient.addColorStop(1, '#f9fafb')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('MemoryGarden', width / 2, 100)

    ctx.fillStyle = '#6a9175'
    ctx.font = '32px sans-serif'
    ctx.fillText(format(new Date(), 'MMMM d, yyyy'), width / 2, 160)

    setProgress(20)

    const sortedMemories = [...memories]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12)

    const cols = 4
    const rows = 3
    const cardWidth = 600
    const cardHeight = 450
    const gapX = 100
    const gapY = 100
    const startX = (width - cols * cardWidth - (cols - 1) * gapX) / 2
    const startY = 250

    for (let i = 0; i < sortedMemories.length; i++) {
      const memory = sortedMemories[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (cardWidth + gapX)
      const y = startY + row * (cardHeight + gapY)

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#d4d4d4'
      ctx.lineWidth = 2
      const cornerRadius = 16
      ctx.beginPath()
      ctx.moveTo(x + cornerRadius, y)
      ctx.lineTo(x + cardWidth - cornerRadius, y)
      ctx.quadraticCurveTo(x + cardWidth, y, x + cardWidth, y + cornerRadius)
      ctx.lineTo(x + cardWidth, y + cardHeight - cornerRadius)
      ctx.quadraticCurveTo(x + cardWidth, y + cardHeight, x + cardWidth - cornerRadius, y + cardHeight)
      ctx.lineTo(x + cornerRadius, y + cardHeight)
      ctx.quadraticCurveTo(x, y + cardHeight, x, y + cardHeight - cornerRadius)
      ctx.lineTo(x, y + cornerRadius)
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.save()
            const imgSize = 500
            const imgX = x + (cardWidth - imgSize) / 2
            const imgY = y + 20
            ctx.beginPath()
            ctx.rect(imgX, imgY, imgSize, imgSize * 0.6)
            ctx.clip()

            const imgAspect = img.width / img.height
            const targetAspect = imgSize / (imgSize * 0.6)
            let drawWidth, drawHeight, drawX, drawY

            if (imgAspect > targetAspect) {
              drawHeight = imgSize * 0.6
              drawWidth = drawHeight * imgAspect
              drawX = imgX - (drawWidth - imgSize) / 2
              drawY = imgY
            } else {
              drawWidth = imgSize
              drawHeight = drawWidth / imgAspect
              drawX = imgX
              drawY = imgY - (drawHeight - imgSize * 0.6) / 2
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
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      const dateText = format(new Date(memory.date), 'MMM d, yyyy')
      ctx.fillText(dateText, x + cardWidth / 2, y + 360)

      ctx.fillStyle = '#4a4a4a'
      ctx.font = '16px sans-serif'
      const maxWidth = cardWidth - 40
      const words = memory.text.split(' ')
      let line = ''
      let lineY = y + 390
      const lineHeight = 22

      for (let j = 0; j < words.length; j++) {
        const testLine = line + words[j] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && j > 0) {
          ctx.fillText(line, x + cardWidth / 2, lineY)
          line = words[j] + ' '
          lineY += lineHeight
          if (lineY > y + 430) {
            ctx.fillText(line.trim() + '...', x + cardWidth / 2, lineY)
            break
          }
        } else {
          line = testLine
        }
      }
      if (lineY <= y + 430) {
        ctx.fillText(line, x + cardWidth / 2, lineY)
      }

      setProgress(20 + ((i + 1) / sortedMemories.length) * 70)
    }

    setProgress(95)

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `memory-garden-${format(new Date(), 'yyyy-MM-dd')}.png`
        link.click()
        URL.revokeObjectURL(url)
        setProgress(100)
      }
    }, 'image/png')
  }

  const exportAsBooklet = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    const pageWidth = 2480
    const pageHeight = 3508
    canvas.width = pageWidth
    canvas.height = pageHeight

    setProgress(10)

    const pages: Blob[] = []
    const memoriesPerPage = 2
    const numPages = Math.ceil(memories.length / memoriesPerPage)

    for (let pageNum = 0; pageNum < numPages; pageNum++) {
      ctx.clearRect(0, 0, pageWidth, pageHeight)
      ctx.fillStyle = '#f9fafb'
      ctx.fillRect(0, 0, pageWidth, pageHeight)

      setProgress(10 + (pageNum / numPages) * 10)

      const pageMemories = memories.slice(
        pageNum * memoriesPerPage,
        (pageNum + 1) * memoriesPerPage
      )

      const cardHeight = 1400
      const gap = 200
      const startY = 200

      for (let i = 0; i < pageMemories.length; i++) {
        const memory = pageMemories[i]
        const y = startY + i * (cardHeight + gap)

        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise<void>((resolve, reject) => {
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
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'left'
        const dateText = format(new Date(memory.date), 'MMMM d, yyyy')
        ctx.fillText(dateText, textX, y + 50)

        if (memory.location) {
          ctx.fillStyle = '#7a7a7a'
          ctx.font = '28px sans-serif'
          ctx.fillText(memory.location, textX, y + 90)
        }

        ctx.fillStyle = '#4a4a4a'
        ctx.font = '32px sans-serif'
        const words = memory.text.split(' ')
        let line = ''
        let lineY = y + (memory.location ? 150 : 120)
        const lineHeight = 40
        const maxLines = 6

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

      ctx.fillStyle = '#7a7a7a'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Page ${pageNum + 1} of ${numPages}`,
        pageWidth / 2,
        pageHeight - 100
      )

      await new Promise<void>((resolve) => {
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
    link.download = `memory-garden-booklet-${format(new Date(), 'yyyy-MM-dd')}.png`
    link.click()
    URL.revokeObjectURL(url)

    setProgress(100)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Export className="text-primary" size={28} weight="duotone" />
            Export Your Garden
          </DialogTitle>
        </DialogHeader>

        {!isExporting && !isComplete && (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="image" id="image" />
                  <Label htmlFor="image" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <ImageIcon size={24} weight="duotone" className="text-primary" />
                      <div>
                        <div className="font-semibold">Garden Snapshot</div>
                        <div className="text-sm text-muted-foreground">
                          A single image with up to 12 memories
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
                          Detailed pages for all memories
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleExport} className="w-full" size="lg">
              <Export size={20} weight="bold" className="mr-2" />
              Export as {exportFormat === 'image' ? 'Image' : 'Booklet'}
            </Button>
          </div>
        )}

        {isExporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 py-8"
          >
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Preparing your export...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          </motion.div>
        )}

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="text-center space-y-4 py-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Export size={32} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Export Complete!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your memory garden has been downloaded
              </p>
            </div>
            <Button
              onClick={() => {
                setIsComplete(false)
                setIsExporting(false)
                setProgress(0)
                onClose()
              }}
              className="w-full"
            >
              Done
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
