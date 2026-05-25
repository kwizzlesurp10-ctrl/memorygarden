import { Button } from '@/components/ui/button'
import { REACTION_EMOJI, REACTION_LABEL, type ReactionType } from '@/lib/social'

interface MemoryReactionsProps {
  reactions?: Partial<Record<ReactionType, { count: number; reactedBy: string[] }>>
  onReact: (type: ReactionType) => void
  currentUserId?: string
}

export function MemoryReactions({ reactions = {}, onReact, currentUserId = 'self' }: MemoryReactionsProps) {
  const reactionTypes: ReactionType[] = ['sprout', 'water', 'bloom', 'heart', 'sparkle']

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {reactionTypes.map((type) => {
        const reaction = reactions[type]
        const count = reaction?.count || 0
        const hasReacted = reaction?.reactedBy?.includes(currentUserId)

        return (
          <Button
            key={type}
            variant={hasReacted ? "secondary" : "outline"}
            size="sm"
            onClick={() => onReact(type)}
            className={`gap-1.5 transition-all active:scale-95 ${hasReacted ? 'ring-1 ring-primary/30' : ''}`}
          >
            <span className="text-base">{REACTION_EMOJI[type]}</span>
            <span className="text-xs font-medium tabular-nums">{count}</span>
            <span className="sr-only">{REACTION_LABEL[type]}</span>
          </Button>
        )
      })}
    </div>
  )
}
