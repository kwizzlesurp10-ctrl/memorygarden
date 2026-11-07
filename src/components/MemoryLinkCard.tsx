import { LinkSimple, ArrowSquareOut, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { getLinkHostname, getLinkPlatformLabel } from '@/lib/memory-link'
import { cn } from '@/lib/utils'

interface MemoryLinkCardProps {
  linkUrl: string
  className?: string
  onRemove?: () => void
  compact?: boolean
}

export function MemoryLinkCard({ linkUrl, className, onRemove, compact }: MemoryLinkCardProps) {
  const host = getLinkHostname(linkUrl)
  const platform = getLinkPlatformLabel(host)
  const title = platform ?? host

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-4',
        compact && 'p-3 gap-1.5',
        className,
      )}
    >
      {onRemove ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRemove}
          aria-label="Remove link"
          className="absolute right-2 top-2 gap-1 shadow-sm"
        >
          <X size={14} weight="bold" aria-hidden />
          Remove link
        </Button>
      ) : null}
      <div className="flex items-start gap-3 pr-24">
        <LinkSimple className="mt-0.5 shrink-0 text-primary" size={compact ? 18 : 22} weight="duotone" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground truncate" title={linkUrl}>
            {host}
          </p>
          <p className="text-xs text-muted-foreground break-all line-clamp-2 mt-1">{linkUrl}</p>
        </div>
      </div>
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={cn(
          'inline-flex w-fit items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90',
        )}
      >
        <ArrowSquareOut size={14} weight="bold" />
        Open
      </a>
    </div>
  )
}
