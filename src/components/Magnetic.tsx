import { useEffect, useRef, type ReactNode } from 'react'
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

interface MagneticProps {
  children: ReactNode
  /** How far the element follows the pointer: 0 = not at all, 1 = fully. */
  strength?: number
  className?: string
}

/**
 * Makes its child lean toward the pointer while hovered, then settle back.
 * The custom cursor's ring also snaps toward anything marked `data-magnetic`.
 */
export function Magnetic({ children, strength = 0.32, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element || !fine || reduced) return

    const xTo = gsap.quickTo(element, 'x', { duration: 0.7, ease: 'power3.out' })
    const yTo = gsap.quickTo(element, 'y', { duration: 0.7, ease: 'power3.out' })

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      // Measure from where the element rests, not from where it has drifted to.
      const restX = rect.left + rect.width / 2 - Number(gsap.getProperty(element, 'x'))
      const restY = rect.top + rect.height / 2 - Number(gsap.getProperty(element, 'y'))
      xTo((event.clientX - restX) * strength)
      yTo((event.clientY - restY) * strength)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', onLeave)
    return () => {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', onLeave)
      gsap.set(element, { clearProps: 'transform' })
    }
  }, [fine, reduced, strength])

  return (
    <div ref={ref} data-magnetic="" className={cn('inline-block', className)}>
      {children}
    </div>
  )
}
