import { cn } from '@/lib/utils'

interface CheckoutLegalLinksProps {
  className?: string
}

export function CheckoutLegalLinks({ className }: CheckoutLegalLinksProps) {
  return (
    <p className={cn('text-xs text-muted-foreground leading-relaxed', className)}>
      By continuing to checkout you agree to our{' '}
      <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
        Terms (draft)
      </a>{' '}
      and acknowledge our{' '}
      <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
        Privacy policy (draft)
      </a>
      . Refund details:{' '}
      <a href="/refunds" className="underline underline-offset-2 hover:text-foreground">
        Refund policy (draft)
      </a>
      .
    </p>
  )
}