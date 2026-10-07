import { useCallback, useRef } from 'react'

interface VirtualJoystickProps {
  onChange: (stick: { x: number; y: number } | null) => void
}

export function VirtualJoystick({ onChange }: VirtualJoystickProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)

  const emit = useCallback((clientX: number, clientY: number) => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const nx = (clientX - cx) / (rect.width / 2)
    const ny = (cy - clientY) / (rect.height / 2)
    const mag = Math.hypot(nx, ny)
    const scale = mag > 1 ? 1 / mag : 1
    onChange({ x: nx * scale, y: ny * scale })
  }, [onChange])

  return (
    <div
      ref={rootRef}
      data-testid="open-world-joystick"
      className="relative h-28 w-28 rounded-full border border-[#f0e7da]/35 bg-black/35 backdrop-blur-sm touch-none"
      role="application"
      aria-label="Walk joystick"
      onPointerDown={(e) => {
        pointerId.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        emit(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (pointerId.current !== e.pointerId) return
        emit(e.clientX, e.clientY)
      }}
      onPointerUp={(e) => {
        if (pointerId.current !== e.pointerId) return
        pointerId.current = null
        onChange(null)
      }}
      onPointerCancel={() => {
        pointerId.current = null
        onChange(null)
      }}
    >
      <div className="pointer-events-none absolute inset-6 rounded-full border border-[#f0e7da]/25" />
    </div>
  )
}
