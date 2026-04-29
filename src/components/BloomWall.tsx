import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flower } from '@phosphor-icons/react'
import type { Memory } from '@/lib/types'
import { getPlantStage } from '@/lib/garden-helpers'
import { bloomWallTileSortWeight, getBloomWallTileSpan } from '@/lib/bloom-wall-layout'
import { format } from 'date-fns'

export interface BloomWallProps {
  memories: Memory[]
  onMemoryClick: (memory: Memory) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
}

const tileVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
}

export function BloomWall({ memories, onMemoryClick }: BloomWallProps) {
  const ordered = useMemo(() => {
    return [...memories].sort(
      (a, b) =>
        bloomWallTileSortWeight(getPlantStage(b)) - bloomWallTileSortWeight(getPlantStage(a)),
    )
  }, [memories])

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto bg-gradient-to-b from-background via-background to-primary/[0.03]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-24 space-y-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Flower size={28} weight="duotone" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bloom wall</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              A living collage — larger tiles are memories that have grown further in your garden.
            </p>
          </div>
        </div>

        {ordered.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            Nothing in bloom here yet. Plant a memory or loosen your filters.
          </p>
        ) : (
          <motion.ul
            className="grid grid-cols-12 gap-2 sm:gap-3 auto-rows-[minmax(4.5rem,1fr)] [grid-auto-flow:dense]"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {ordered.map((memory) => {
              const stage = getPlantStage(memory)
              const { colSpan, rowSpan } = getBloomWallTileSpan(stage)
              const label = memory.text.trim().slice(0, 120) || 'Memory'
              return (
                <motion.li
                  key={memory.id}
                  variants={tileVariants}
                  className="relative group min-h-0"
                  style={{
                    gridColumn: `span ${colSpan} / span ${colSpan}`,
                    gridRow: `span ${rowSpan} / span ${rowSpan}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onMemoryClick(memory)}
                    className="relative h-full w-full min-h-[4.5rem] overflow-hidden rounded-2xl border border-primary/15 bg-card text-left shadow-sm outline-none transition-[box-shadow,transform,border-color] duration-200 hover:border-primary/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Open memory from ${format(new Date(memory.date), 'MMMM d, yyyy')}`}
                  >
                    <img
                      src={memory.photoUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklch,var(--foreground)_55%,transparent)] via-[color-mix(in_oklch,var(--foreground)_12%,transparent)] to-transparent opacity-90"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 pt-8 text-[oklch(0.99_0.01_95)] space-y-0.5 [text-shadow:0_1px_3px_color-mix(in_oklch,var(--foreground)_45%,transparent)]">
                      <p className="text-[0.65rem] uppercase tracking-wider opacity-90 font-medium">
                        {stage.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-medium leading-snug line-clamp-2 drop-shadow-sm">
                        {label}
                        {memory.text.trim().length > 120 ? '…' : ''}
                      </p>
                      <p className="text-[0.7rem] opacity-80">
                        {format(new Date(memory.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </div>
    </div>
  )
}
