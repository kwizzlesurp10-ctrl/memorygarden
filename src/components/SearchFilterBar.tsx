import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass, Funnel, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterPanel } from './FilterPanel'
import type { EmotionalTone, PlantStage, SearchFilters } from '@/lib/types'

interface SearchFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  activeFilterCount: number
  availableLocations: string[]
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  activeFilterCount,
  availableLocations,
}: SearchFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  const handleQueryChange = (value: string) => {
    setLocalQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange(value)
    }, 200)
  }

  const handleClearAll = () => {
    setLocalQuery('')
    onSearchChange('')
    onFiltersChange({
      emotionalTones: [],
      plantStages: [],
      dateRange: {},
      locations: [],
    })
  }

  return (
    <div className="relative z-10">
      <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search memories..."
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-9 pr-8 h-9 bg-background/50"
          />
          {localQuery && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <Button
          variant={isFilterOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="relative"
        >
          <Funnel size={16} className="mr-1" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            Clear all
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <FilterPanel
              filters={filters}
              onFiltersChange={onFiltersChange}
              availableLocations={availableLocations}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
