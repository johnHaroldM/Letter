import { useEffect, useRef, useState } from 'react'
import { useFinePointer } from '@/hooks/useMediaQuery'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type CursorMode = 'default' | 'hover' | 'label'

/**
 * A custom cursor for mouse and trackpad users:
 *
 *  • a small dot that tracks the pointer exactly,
 *  • a ring that trails it and leans toward `data-magnetic` elements,
 *  • a wide, slow glow that follows behind both,
 *  • a labelled badge over anything with `data-cursor-label="…"`.
 *
 * Touch devices keep their native behaviour; nothing is rendered there.
 */
export function CustomCursor() {
  const enabled = useFinePointer()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const badge = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<CursorMode>('default')
  const [label, setLabel] = useState('')
  const [pressed, setPressed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current || !glow.current || !badge.current) return

    const root = document.documentElement
    root.classList.add('has-custom-cursor')

    gsap.set([dot.current, ring.current, glow.current, badge.current], {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    // Each layer chases the pointer at its own pace; the lag is the trail.
    const follow = (element: HTMLElement, duration: number) => {
      const x = gsap.quickTo(element, 'x', { duration, ease: 'power3.out' })
      const y = gsap.quickTo(element, 'y', { duration, ease: 'power3.out' })
      return (px: number, py: number) => {
        x(px)
        y(py)
      }
    }
    const moveDot = follow(dot.current, 0.08)
    const moveRing = follow(ring.current, 0.4)
    const moveBadge = follow(badge.current, 0.3)
    const moveGlow = follow(glow.current, 1)

    let magnet: Element | null = null

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const { clientX: x, clientY: y } = event
      setVisible(true)
      moveDot(x, y)
      moveBadge(x, y)
      moveGlow(x, y)

      if (magnet) {
        // Pull the ring most of the way to the centre of the magnetic element.
        const rect = magnet.getBoundingClientRect()
        moveRing(x + (rect.left + rect.width / 2 - x) * 0.6, y + (rect.top + rect.height / 2 - y) * 0.6)
      } else {
        moveRing(x, y)
      }
    }

    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const labelled = target?.closest<HTMLElement>('[data-cursor-label]')
      magnet = target?.closest('[data-magnetic]') ?? null

      if (labelled) {
        setLabel(labelled.dataset.cursorLabel ?? '')
        setMode('label')
      } else if (target?.closest('a, button')) {
        setMode('hover')
      } else {
        setMode('default')
      }
    }

    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)
    const onLeave = () => setVisible(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    root.addEventListener('pointerleave', onLeave)

    return () => {
      root.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-0 z-[70] transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div ref={glow} className="cursor-glow" />

      {/* Difference blending keeps the dot and ring visible on night and dawn alike. */}
      <div className="absolute inset-0 mix-blend-difference">
        <div
          ref={ring}
          className={cn(
            'cursor-ring',
            mode === 'hover' && 'is-hover',
            mode === 'label' && 'is-hidden',
            pressed && 'is-pressed',
          )}
        />
        <div ref={dot} className={cn('cursor-dot', mode !== 'default' && 'is-hidden')} />
      </div>

      <div ref={badge} className={cn('cursor-badge', mode === 'label' && 'is-visible', pressed && 'is-pressed')}>
        {label}
      </div>
    </div>
  )
}
