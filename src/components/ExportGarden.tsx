import { useState } from 'react'
import { Dialog, DialogContent, Dialog
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progr
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Export, Image as ImageIcon, FilePdf } from '@phosphor-icons/react'
interface ExportGardenProps {
import { format } from 'date-fns'
  memories: Memory[]

type ExportFormat = 'image' |
  open: boolean
  const [exportFormat
  memories: Memory[]
 

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
     

    const gradient = ctx
    gradient.addCo
    ctx.fillStyle = grad


      .sort((a, b) => new Date(

    const rows
    const cardHeight = 300

    const totalHeight = r
    const startY = (height - totalHeigh
    for (let i = 0; i
      const col = i % cols
      const x = startX + col * (cardWidth + gap)

      ctx.shadowColo
     
   

      try {
        img.crossOr

            ctx.beginPath()
            ctx.clip()
            const imgAspect = img.width / img.height

            if (imgAsp
              drawWidth
              drawY = y 
              drawWidth = 

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
            } else {
              drawWidth = cardWidth - 20
              drawHeight = drawWidth / imgAspect
              drawX = x + 10
              drawY = y + 10 - (drawHeight - 180) / 2



          const img = new
          await new P
           
              const imgY = y
              ctx.save()
          

              let drawWidth, drawHeight, drawX, drawY
       

                drawY = imgY
                drawWidth = imgSize
                drawX = imgX
              }


              ctx.lineWidth = 2
              ctx.arc(imgX + imgSize / 2,

            }
            img.src = mem
        } catch (error) 

        const textX = 650

        ctx.font = 'bold 36px "Space Grotesk", sa
        const dateText = formatDate(new Date(memory.

          ctx.fillStyle = '#7a7
          ctx.fillTex

        ctx.font = '32px "Crimson Pro", serif'
        let line 
        con

          const testLine 
         
       
            if (lineY > y + (memory.location ? 150 
              break
       

        if (lineY <= y + (memory.location ? 150 : 120) + lineH
     

      ctx.font = '24px "Space
      ctx.fillText(
        pageWidth / 2,
      )

          if (blob) pages.push(blob)
        }, 'image/png')

    }
    const link =
    link
    l

  }

      <DialogContent className="max-w-md">
          <DialogTitle classNam
            Export 
        </DialogHeader>
        {!isExporting && !isComplete && (
            <div classNam
              <RadioGroup value={exportFormat} onValueChange={(v) => setExportFor
                  <Rad
                    <div className
         
                 
                     
      

                <div
   

                        <div classN
                   

                  </Label>
              </RadioGroup>


            </Button>
        )}
     

            className="spa
            <div className=
              <Progress value
            </div>

        {isComplete && (

            transition={{ type: 'spring', duration: 0.5 }}
          >
              <Export size={32} 

              <p className="tex
              </p>

                setIsCompl
                setProgress(0)
              }}
            >
            </Button>

    </Dialog>
}
















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
        ctx.font = 'bold 36px "Space Grotesk", sans-serif'
        ctx.textAlign = 'left'
        const dateText = format(new Date(memory.date), 'MMMM d, yyyy')
        ctx.fillText(dateText, textX, y + 50)

        if (memory.location) {
          ctx.fillStyle = '#7a7a7a'
          ctx.font = '28px "Space Grotesk", sans-serif'
          ctx.fillText(memory.location, textX, y + 95)
        }

        ctx.fillStyle = '#4a4a4a'
        ctx.font = '32px "Crimson Pro", serif'
        const words = memory.text.split(' ')
        let line = ''
        let lineY = y + (memory.location ? 150 : 120)
        const lineHeight = 42
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
      ctx.font = '24px "Space Grotesk", sans-serif'
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
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
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
              Export as {format === 'image' ? 'Image' : 'Booklet'}
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
