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
                                                                                                                                                                          