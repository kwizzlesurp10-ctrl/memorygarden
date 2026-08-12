import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowClockwise, Warning } from '@phosphor-icons/react'

interface Props {
  children: ReactNode
  /** Short label shown in the error message, e.g. "garden view". */
  label: string
}

interface State {
  error: Error | null
}

/**
 * Lightweight error boundary for a single UI section. A crash inside
 * `children` is contained — the rest of the app keeps rendering — and
 * the user can retry the section without a full reload.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    if (typeof console !== 'undefined') {
      console.error(`[${this.props.label}] crashed:`, error)
    }
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="w-full h-full min-h-32 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <Warning size={36} weight="duotone" className="text-destructive mx-auto" />
          <p className="text-sm font-medium">The {this.props.label} hit a snag.</p>
          <p className="text-xs text-muted-foreground">
            Your memories are safe. The rest of the app keeps working — try the section again.
          </p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            <ArrowClockwise size={14} className="mr-2" />
            Try again
          </Button>
        </div>
      </div>
    )
  }
}
