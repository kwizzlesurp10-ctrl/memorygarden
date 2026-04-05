import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarBlank } from '@phosphor-icons/react'
import { format } from 'date-fns'
import type { EmotionalTone, PlantStage, SearchFilters } from '@/lib/types'
import { getPlantColor } from '@/lib/garden-helpers'

interface FilterPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableLocations: string[]
}

const EMOTIONAL_TONES: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']
const PLANT_STAGES: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']

export function FilterPanel({ filters, onFiltersChange, availableLocations }: FilterPanelProps) {
  const toggleTone = (tone: EmotionalTone) => {
    const tones = filters.emotionalTones.includes(tone)
      ? filters.emotionalTones.filter((t) => t !== tone)
      : [...filters.emotionalTones, tone]
    onFiltersChange({ ...filters, emotionalTones: tones })
  }

  const toggleStage = (stage: PlantStage) => {
    const stages = filters.plantStages.includes(stage)
      ? filters.plantStages.filter((s) => s !== stage)
      : [...filters.plantStages, stage]
    onFiltersChange({ ...filters, plantStages: stages })
  }

  const toggleLocation = (location: string) => {
    const locs = filters.locations.includes(location)
      ? filters.locations.filter((l) => l !== location)
      : [...filters.locations, location]
    onFiltersChange({ ...filters, locations: locs })
  }

  return (
    <div className="px-4 py-3 bg-card/60 backdrop-blur-sm border-b border-border space-y-3">
      {/* Emotional Tones */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Emotional Tone</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONAL_TONES.map((tone) => (
            <button
              key={tone}
              onClick={() => toggleTone(tone)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                filters.emotionalTones.includes(tone)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background/50 text-muted-foreground hover:border-primary/50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getPlantColor(tone) }}
              />
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Plant Stages */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Growth Stage</p>
        <div className="flex flex-wrap gap-1.5">
          {PLANT_STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => toggleStage(stage)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                filters.plantStages.includes(stage)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background/50 text-muted-foreground hover:border-primary/50'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Date Range</p>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <CalendarBlank size={14} className="mr-1" />
                {filters.dateRange.start
                  ? format(new Date(filters.dateRange.start), 'MMM d, yyyy')
                  : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange.start ? new Date(filters.dateRange.start) : undefined}
                onSelect={(date) =>
                  onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: date?.toISOString() },
                  })
                }
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-7">
                <CalendarBlank size={14} className="mr-1" />
                {filters.dateRange.end
                  ? format(new Date(filters.dateRange.end), 'MMM d, yyyy')
                  : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange.end ? new Date(filters.dateRange.end) : undefined}
                onSelect={(date) =>
                  onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: date?.toISOString() },
                  })
                }
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
          {(filters.dateRange.start || filters.dateRange.end) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => onFiltersChange({ ...filters, dateRange: {} })}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Locations */}
      {availableLocations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Location</p>
          <div className="flex flex-wrap gap-1.5">
            {availableLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => toggleLocation(loc)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                  filters.locations.includes(loc)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background/50 text-muted-foreground hover:border-primary/50'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
