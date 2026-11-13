import { useEffect, useLayoutEffect, useRef } from 'react'
import { ChapterLabel } from '@/components/ChapterLabel'
import { SplitWords } from '@/components/SplitWords'
import { letterConfig } from '@/data/letterConfig'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const BEAT_TEXT =
  'text-balance font-serif text-[clamp(2.2rem,5.4vw,5.25rem)] font-light leading-[1.07] tracking-[-0.012em] text-cream'

/**
 * Section 2: the prelude.
 *
 * A tall section with a sticky stage inside it. As she scrolls through, each
 * line takes its turn: words rise in one by one, hold, then dissolve to make
 * room for the next. The opening quote is already there when the gate lifts.
 */
export function IntroSection({ active }: { active: boolean }) {
  const root = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()
  const { openingQuote, prelude } = letterConfig

  // Scroll-scrubbed choreography for the stage.
  useLayoutEffect(() => {
    if (reduced) return
    const context = gsap.context(() => {
      const beats = gsap.utils.toArray<HTMLElement>('.beat')

      // Until the gate opens, the quote waits below its masks.
      gsap.set(beats[0].querySelectorAll('.word'), { yPercent: 118, opacity: 0 })
      gsap.set('.beat-aside', { opacity: 0, y: 14 })
      gsap.set(beats.slice(1), { autoAlpha: 0 })

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
      })

      timeline.to('.scroll-hint', { autoAlpha: 0, duration: 0.3 }, 0)

      beats.forEach((beat, index) => {
        const last = index === beats.length - 1
        if (index > 0) {
          timeline.set(beat, { autoAlpha: 1 }).fromTo(
            beat.querySelectorAll('.word'),
            { yPercent: 118, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.07 },
          )
        }
        // Hold long enough to read; the first beat was already on screen.
        timeline.to({}, { duration: index === 0 ? 0.5 : last ? 1.3 : 0.9 })
        if (!last) {
          timeline.to(beat, { autoAlpha: 0, yPercent: -14, filter: 'blur(12px)', duration: 0.7, ease: 'power2.in' })
        }
      })
    }, root)

    return () => context.revert()
  }, [reduced])

  // The moment the gate lifts, the quote arrives on its own time.
  useEffect(() => {
    if (!active || reduced) return
    const context = gsap.context(() => {
      gsap.to('.beat:first-child .word', {
        yPercent: 0,
        opacity: 1,
        duration: 1.6,
        ease: 'expo.out',
        stagger: 0.075,
        delay: 0.3,
      })
      gsap.to('.beat-aside', { opacity: 1, y: 0, duration: 1.3, ease: 'power2.out', stagger: 0.25, delay: 1.5 })
    }, root)
    return () => context.revert()
  }, [active, reduced])

  return (
    <section
      ref={root}
      id="prelude"
      aria-label={prelude.label}
      className={cn('relative', reduced ? 'py-[18vh]' : 'h-[430svh]')}
    >
      <div
        className={cn(
          'flex flex-col px-6 md:px-14 lg:px-24',
          reduced ? 'gap-[12vh]' : 'sticky top-0 h-svh overflow-hidden pb-8 pt-24 md:pb-10',
        )}
      >
        <ChapterLabel id="prelude" className="beat-aside text-rosegold" />

        <div className={cn('grid md:max-w-[60vw]', reduced ? 'gap-[12vh]' : 'flex-1 items-center')}>
          <figure className={cn('beat', !reduced && 'col-start-1 row-start-1')}>
            <blockquote className={BEAT_TEXT}>
              <SplitWords text={openingQuote.text} />
            </blockquote>
            <figcaption className="beat-aside mt-8 flex items-center gap-4 text-cream/65 md:mt-10">
              <span className="h-px w-10 bg-current opacity-50" aria-hidden="true" />
              <span className="eyebrow">{openingQuote.attribution}</span>
            </figcaption>
          </figure>

          {prelude.lines.map((line, index) => (
            <p key={index} className={cn('beat', BEAT_TEXT, !reduced && 'col-start-1 row-start-1')}>
              <SplitWords text={line} />
            </p>
          ))}
        </div>

        {!reduced && (
          <div className="scroll-hint">
            <div className="beat-aside flex items-center gap-4 text-cream/65">
              <span className="relative block h-12 w-px overflow-hidden bg-cream/15" aria-hidden="true">
                <span className="absolute inset-0 animate-scroll-line bg-rosegold" />
              </span>
              <span className="eyebrow">{prelude.scrollHint}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
