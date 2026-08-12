import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plant, Drop, Lightning, UserPlus, SignOut, FunnelSimple } from '@phosphor-icons/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import type { ActivityEvent, GardenMember } from '@/lib/types'

interface ActivityFeedProps {
  events: ActivityEvent[]
  /** Garden members, used to populate the "filter by member" control. */
  members?: GardenMember[]
}

type TypeFilter = ActivityEvent['type'] | 'all'

const eventIcons = {
  plant: Plant,
  reflect: Drop,
  boost: Lightning,
  join: UserPlus,
  leave: SignOut,
}

const eventColors = {
  plant: 'text-green-500',
  reflect: 'text-blue-500',
  boost: 'text-yellow-500',
  join: 'text-primary',
  leave: 'text-muted-foreground',
}

const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'plant', label: 'Plants' },
  { value: 'reflect', label: 'Reflections' },
  { value: 'boost', label: 'Boosts' },
  { value: 'join', label: 'Joins' },
]

export function ActivityFeed({ events, members = [] }: ActivityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')

  // Only offer members who actually appear in the stream.
  const memberOptions = useMemo(() => {
    const activeIds = new Set(events.map((e) => e.userId))
    const seen = new Set<string>()
    const opts: { id: string; login: string }[] = []
    for (const m of members) {
      if (activeIds.has(m.userId) && !seen.has(m.userId)) {
        seen.add(m.userId)
        opts.push({ id: m.userId, login: m.login })
      }
    }
    // Include any actors present in events but not in the member list.
    for (const e of events) {
      if (!seen.has(e.userId)) {
        seen.add(e.userId)
        opts.push({ id: e.userId, login: e.userLogin })
      }
    }
    return opts
  }, [events, members])

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (typeFilter === 'all' || e.type === typeFilter) &&
          (memberFilter === 'all' || e.userId === memberFilter)
      ),
    [events, typeFilter, memberFilter]
  )

  if (events.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold">Recent Activity</h3>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {typeFilters.map((f) => (
            <Button
              key={f.value}
              variant={typeFilter === f.value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => setTypeFilter(f.value)}
              aria-pressed={typeFilter === f.value}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {memberOptions.length > 1 && (
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger size="sm" className="h-7 text-xs w-full">
              <FunnelSimple size={12} className="mr-1 flex-shrink-0" />
              <SelectValue placeholder="All members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {memberOptions.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.login}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No activity matches these filters</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filtered.slice(0, 20).map((event, index) => {
            const Icon = eventIcons[event.type] || Plant
            const colorClass = eventColors[event.type] || 'text-muted-foreground'

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 py-1"
              >
                <Icon size={16} weight="duotone" className={`mt-0.5 flex-shrink-0 ${colorClass}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium">{event.userLogin}</span> {event.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
