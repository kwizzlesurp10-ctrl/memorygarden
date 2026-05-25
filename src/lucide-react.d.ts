declare module 'lucide-react/dist/esm/icons/*' {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'
  
  export interface LucideProps extends Partial<Omit<SVGProps<SVGSVGElement>, "ref">> {
    size?: string | number
    absoluteStrokeWidth?: boolean
    // Lucide forwards arbitrary SVG attributes; keep the index open for icon consumers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }

  export type LucideIcon = ForwardRefExoticComponent<
    LucideProps & RefAttributes<SVGSVGElement>
  >

  const Icon: LucideIcon
  export default Icon
}
