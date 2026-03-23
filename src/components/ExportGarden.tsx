import { useState } from 'react'
import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progr
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
interface ExportGardenProps {
  onClose: () => void
import { toast } from 'sonner'
type ExportFormat = 'image' | 'pdf'
import { format } from 'date-fns'

interface ExportGardenProps {
  const handleE
  onClose: () => void
    }
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


    const height =
    canvas.height = heig

    gradi
    ctx.fillStyle = gradient


      .sort((a, b) => new D

      
    const cardHeight = 30
    const gap = 20
      
    const startX = (widt

      const memory = sortedM
      const ro
      const y = start
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 20
      ctx.fillR
      ctx.shadowBlur = 0

   

            ctx.save()
            ctx.rec
    
            const cardAspect = (cardWidth - 20) / 1
            
              drawHeight = 180

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
        await new Promise<void>((resolve, reject) => {
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
      for (let i = 0
              drawWidth = cardWidth - 20
              drawHeight = drawWidth / imgAspect
              drawX = x + 10
              drawY = y + 10 - (drawHeight - 180) / 2
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            ctx.restore()
            resolve()

          img.onerror = () => reject(new Error('Failed to load image'))
                drawX = imgX - (dra
        })
                drawHei
        console.error('Failed to load image for memory:', memory.id)


      ctx.fillStyle = '#1a1a1a'
      ctx.font = 'bold 16px "Space Grotesk", sans-serif'
      const dateText = format(new Date(memory.date), 'MMM d, yyyy')
      ctx.fillText(dateText, x + 15, y + 215)

      ctx.fillStyle = '#4a4a4a'
      ctx.font = '14px "Crimson Pro", serif'
      const maxTextWidth = cardWidth - 30
      const words = memory.text.split(' ')
      let line = ''
        ctx.textAlign = '
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
            lineY
          }
            }
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
    setProgress(1
      `${memories.length} memories • ${format(new Date(), 'MMMM yyyy')}`,
    <Dialog open
      90
     



              <Label>Export F
      if (blob) {
                  <Label htmlFor="image" clas
        const link = document.createElement('a')
        link.href = url
        link.download = `memory-garden-${format(new Date(), 'yyyy-MM-dd')}.png`
                    
        URL.revokeObjectURL(url)

      }
                   
  }

  const exportAsPDF = async () => {
                   

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    const sortedMemories = [...memories].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const pageWidth = 2480
    const pageHeight = 3508
        )}

            initial={{ opacit
    const numPages = Math.ceil(sortedMemories.length / memoriesPerPage)

    for (let pageNum = 0; pageNum < numPages; pageNum++) {
                className="inl
      canvas.height = pageHeight

      ctx.fillStyle = '#fafaf8'
      ctx.fillRect(0, 0, pageWidth, pageHeight)

        )}
        ctx.fillStyle = '#1a1a1a'
        ctx.font = 'bold 80px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('My Memory Garden', pageWidth / 2, 300)

                transition={{ type: 'spring', 
        ctx.fillStyle = '#4a4a4a'
              </motio
          `${memories.length} memories collected`,
              </p>
          400
      </D
        ctx.fillText(format(new Date(), 'MMMM d, yyyy'), pageWidth / 2, 460)


      const startIndex = pageNum * memoriesPerPage
      const endIndex = Math.min(startIndex + memoriesPerPage, sortedMemories.length)
      const pageMemories = sortedMemories.slice(startIndex, endIndex)


      const cardHeight = 500


      for (let i = 0; i < pageMemories.length; i++) {
        const memory = pageMemories[i]
        const y = startY + i * (cardHeight + gap)


          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise<void>((resolve, reject) => {

              const imgSize = 400
              const imgX = 200
              const imgY = y

              ctx.save()

              ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2)


              const imgAspect = img.width / img.height
              let drawWidth, drawHeight, drawX, drawY

              if (imgAspect > 1) {

                drawWidth = drawHeight * imgAspect
                drawX = imgX - (drawWidth - imgSize) / 2
                drawY = imgY
              } else {
                drawWidth = imgSize
                drawHeight = drawWidth / imgAspect
                drawX = imgX

              }

              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
              ctx.restore()

              ctx.strokeStyle = '#d4d4d4'
              ctx.lineWidth = 2

              ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2)



            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = memory.photoUrl

        } catch (error) {
          console.error('Failed to load image for memory:', memory.id)


        const textX = 650
        const textMaxWidth = pageWidth - textX - 200

        ctx.fillStyle = '#1a1a1a'
        ctx.font = 'bold 36px "Space Grotesk", sans-serif'
        ctx.textAlign = 'left'
        const dateText = format(new Date(memory.date), 'MMMM d, yyyy')
        ctx.fillText(dateText, textX, y + 50)

        if (memory.location) {
          ctx.fillStyle = '#7a7a7a'
          ctx.font = '28px "Space Grotesk", sans-serif'
          ctx.fillText(memory.location, textX, y + 95)
        }


        ctx.font = '32px "Crimson Pro", serif'

        let line = ''
        let lineY = y + (memory.location ? 150 : 120)
        const lineHeight = 42


        for (let j = 0; j < words.length; j++) {
          const testLine = line + words[j] + ' '

          if (metrics.width > textMaxWidth && j > 0) {

            line = words[j] + ' '
            lineY += lineHeight
            if (lineY > y + (memory.location ? 150 : 120) + lineHeight * (maxLines - 1)) {
              ctx.fillText(line.trim() + '...', textX, lineY)
              break

          } else {
            line = testLine
          }

        if (lineY <= y + (memory.location ? 150 : 120) + lineHeight * (maxLines - 1)) {
          ctx.fillText(line, textX, lineY)
        }



      ctx.font = '24px "Space Grotesk", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Page ${pageNum + 1} of ${numPages}`,
        pageWidth / 2,

      )

      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) pages.push(blob)

        }, 'image/png')


      setProgress(20 + ((pageNum + 1) / numPages) * 70)
    }

    const link = document.createElement('a')
    const url = URL.createObjectURL(pages[0])
    link.href = url
    link.download = `memory-garden-booklet-${format(new Date(), 'yyyy-MM-dd')}.png`
    link.click()


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
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="image" id="image" />
                  <Label htmlFor="image" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <ImageIcon size={24} weight="duotone" className="text-primary" />
                      <div>
                        <div className="font-semibold">Garden Snapshot</div>
                        <div className="text-sm text-muted-foreground">






























































































