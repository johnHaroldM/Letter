import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { letterConfig } from '@/data/letterConfig'
import { chapters } from '@/lib/chapters'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { cn, EASE_OUT_EXPO } from '@/lib/utils'

/**
 * The quiet header: who the letter is for, which chapter is on screen, and a
 * hairline that fills as the page is read.
 */
export function ChapterHud({ visible }: { visible: boolean }) {
  const bar = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        bar.current,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.4 } },
      )

      chapters.forEach((entry, index) => {
        ScrollTrigger.create({
          trigger: `#${entry.id}`,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(index),
        })
      })
    })
    return () => context.revert()
  }, [])

  const current = chapters[active]

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-40 text-white mix-blend-difference transition-opacity duration-1000',
        visible ? 'opacity-100 delay-700' : 'opacity-0',
      )}
    >
      <div ref={bar} className="h-px origin-left bg-white/70" aria-hidden="true" />

      <div className="flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <p className="eyebrow">For {letterConfig.herName}</p>

        <p className="eyebrow flex items-center gap-3" aria-live="off">
          <span className="relative inline-flex overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={current.id}
                className="inline-flex items-center gap-3"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              >
                <span className="font-serif text-base font-normal normal-case italic leading-none tracking-normal">
                  {current.numeral}
                </span>
                <span className="hidden sm:inline">{current.label}</span>
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="opacity-50">/ {chapters[chapters.length - 1].numeral}</span>
        </p>
      </div>
    </div>
  )
}
