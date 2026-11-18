import { cn } from '@/lib/utils'

interface SiteFooterProps {
  className?: string
  compact?: boolean
}

export function SiteFooter({ className, compact }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'border-t border-border text-xs text-muted-foreground',
        compact ? 'py-2' : 'py-6',
        className,
      )}
    >
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Legal">
        <a href="/privacy" className="hover:text-foreground underline-offset-2 hover:underline">
          Privacy (draft)
        </a>
        <a href="/terms" className="hover:text-foreground underline-offset-2 hover:underline">
          Terms (draft)
        </a>
        <a href="/refunds" className="hover:text-foreground underline-offset-2 hover:underline">
          Refunds (draft)
        </a>
        {!compact ? (
          <span className="text-muted-foreground/80">© {new Date().getFullYear()} MemoryGarden</span>
        ) : null}
      </nav>
    </footer>
  )
}