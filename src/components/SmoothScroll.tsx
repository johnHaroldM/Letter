import { useEffect, type ReactNode } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import type { LenisOptions } from 'lenis'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { experience } from '@/lib/experience'
import { gsap, ScrollTrigger } from '@/lib/gsap'

const OPTIONS: LenisOptions = {
  // GSAP's ticker drives Lenis (see the bridge below), so both stay in step.
  autoRaf: false,
  lerp: 0.09,
  wheelMultiplier: 0.95,
}

/** Keeps Lenis, GSAP's ticker and ScrollTrigger on one clock. */
function LenisBridge({ locked }: { locked: boolean }) {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    const onScroll = () => {
      experience.velocity = lenis.velocity
      ScrollTrigger.update()
    }
    const tick = (time: number) => lenis.raf(time * 1000)

    lenis.on('scroll', onScroll)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(tick)
    }
  }, [lenis])

  useEffect(() => {
    if (!lenis) return
    if (locked) lenis.stop()
    else lenis.start()
  }, [lenis, locked])

  return null
}

interface SmoothScrollProps {
  children: ReactNode
  /** While true the page cannot scroll (used until the gate has been opened). */
  locked: boolean
}

/**
 * Inertial smooth scrolling for the whole page.
 * Visitors who prefer reduced motion get plain native scrolling instead.
 */
export function SmoothScroll({ children, locked }: SmoothScrollProps) {
  const reduced = usePrefersReducedMotion()

  // A CSS lock as well, so the page holds still before Lenis has even started.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('is-locked', locked)
    return () => root.classList.remove('is-locked')
  }, [locked])

  if (reduced) return <>{children}</>

  return (
    <ReactLenis root options={OPTIONS}>
      <LenisBridge locked={locked} />
      {children}
    </ReactLenis>
  )
}
