import { useTheme } from "next-themes"
import { CSSProperties } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "color-mix(in oklch, var(--primary) 20%, transparent)",
          "--success-bg": "color-mix(in oklch, var(--primary) 10%, var(--card))",
          "--success-text": "var(--primary)",
          "--success-border": "color-mix(in oklch, var(--primary) 30%, transparent)",
          "--warning-bg": "color-mix(in oklch, var(--accent) 10%, var(--card))",
          "--warning-text": "color-mix(in oklch, var(--accent) 80%, var(--foreground))",
          "--warning-border": "color-mix(in oklch, var(--accent) 30%, transparent)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
