import { useEffect, useLayoutEffect } from 'react'
import { dawnAmount, experience } from '@/lib/experience'
import { gsap, ScrollTrigger } from '@/lib/gsap'

/**
 * Maps scroll position onto the WebGL scene.
 *
 * Each trigger watches one section and writes a plain 0 → 1 progress value
 * into `experience`. The render loop turns those numbers into camera moves,
 * lighting and colour, so the 3D background follows the story however long
 * the letter grows.
 */
export function useSceneChoreography() {
  useLayoutEffect(() => {
    const root = document.documentElement

    // The DOM follows the same "dawn" as the canvas through one CSS variable.
    const syncDawn = () => root.style.setProperty('--dawn', dawnAmount().toFixed(3))

    const track = (trigger: string | undefined, start: string | number, end: string, apply: (progress: number) => void) => {
      const update = (self: ScrollTrigger) => {
        apply(self.progress)
        syncDawn()
      }
      ScrollTrigger.create({ trigger, start, end, onUpdate: update, onRefresh: update })
    }

    const context = gsap.context(() => {
      track(undefined, 0, 'max', (p) => (experience.scroll = p))
      // The whole pass of the gallery, from first glimpse to last.
      track('#memories', 'top bottom', 'bottom top', (p) => (experience.gallery = p))
      // Dawn breaks as the letter rises into view.
      track('#letter', 'top 95%', 'top 30%', (p) => (experience.letter = p))
      // Dusk falls across the finale.
      track('#finale', 'top bottom', 'bottom bottom', (p) => (experience.finale = p))
    })

    return () => {
      context.revert()
      root.style.removeProperty('--dawn')
    }
  }, [])

  // Web fonts change line breaks, and line breaks change every scroll position.
  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh()
    })
    return () => {
      alive = false
    }
  }, [])
}

/** Tracks the pointer in normalised device coordinates for the 3D parallax. */
export function usePointerParallax() {
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      experience.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      experience.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
}
