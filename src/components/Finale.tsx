import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Heart } from 'lucide-react'
import { useLenis } from 'lenis/react'
import { ChapterLabel } from '@/components/ChapterLabel'
import { Magnetic } from '@/components/Magnetic'
import { RevealText } from '@/components/RevealText'
import { letterConfig } from '@/data/letterConfig'
import { fireHug } from '@/lib/confetti'
import { experience } from '@/lib/experience'
import { gsap } from '@/lib/gsap'
import { EASE_OUT_EXPO } from '@/lib/utils'

/**
 * Section 5: the finale.
 * A closing note and one button. Each hug throws hearts and gold dust from the
 * button and makes the 3D scene behind it flare, then settle a little warmer
 * than it was before.
 */
export function Finale() {
  const button = useRef<HTMLButtonElement>(null)
  const [hugs, setHugs] = useState(0)
  const lenis = useLenis()
  const { finale, yourName } = letterConfig

  const sendHug = () => {
    const rect = button.current?.getBoundingClientRect()
    fireHug(
      rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.7 },
    )

    // The scene answers: a flare, one full turn of the heart, a lasting warmth.
    experience.burst = 1
    experience.spin += Math.PI * 2
    gsap.to(experience, {
      afterglow: Math.min(1, experience.afterglow + 0.34),
      duration: 2.2,
      ease: 'power2.out',
      overwrite: 'auto',
    })

    setHugs((count) => count + 1)
  }

  const readAgain = () => {
    if (lenis) lenis.scrollTo(0, { duration: 2.6 })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reply = hugs > 0 ? finale.replies[Math.min(hugs, finale.replies.length) - 1] : null

  return (
    <section
      id="finale"
      aria-label={finale.label}
      className="relative flex min-h-[125svh] flex-col items-center justify-end px-6 pb-10 pt-[52svh] text-center md:pb-12"
    >
      <ChapterLabel id="finale" className="text-rosegold" />

      <RevealText
        text={finale.heading}
        className="mt-8 max-w-[18ch] text-balance font-serif text-[clamp(2.4rem,5.6vw,5.25rem)] font-light leading-[1.05] tracking-[-0.015em] text-cream"
      />

      <p className="mt-8 max-w-md text-base leading-relaxed text-cream/75 md:text-[1.0625rem]">{finale.note}</p>

      <div className="mt-11">
        <Magnetic strength={0.3}>
          <motion.button
            ref={button}
            type="button"
            onClick={sendHug}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="hug-button flex min-h-14 items-center gap-3.5 rounded-full px-9 py-4 text-obsidian"
          >
            <Heart className="size-[1.05rem] fill-current" aria-hidden="true" />
            <span className="eyebrow">{hugs === 0 ? finale.button : finale.buttonAgain}</span>
          </motion.button>
        </Magnetic>
      </div>

      {/* Announced politely to screen readers each time it changes. */}
      <div className="mt-7 flex min-h-[4.5rem] flex-col items-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {reply && (
            <motion.p
              key={Math.min(hugs, finale.replies.length)}
              className="font-serif text-[1.45rem] italic text-rosegold md:text-[1.65rem]"
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            >
              {reply}
            </motion.p>
          )}
        </AnimatePresence>
        {hugs > 0 && (
          <p className="eyebrow mt-3 text-cream/60">
            {hugs} {hugs === 1 ? 'hug' : 'hugs'} sent
          </p>
        )}
      </div>

      <footer className="mt-[9svh] flex w-full max-w-[92rem] flex-col items-center gap-6 border-t border-cream/12 pt-7 md:flex-row md:justify-between">
        <p className="text-sm text-cream/60">
          {finale.credit} <span className="font-serif text-lg italic text-cream/90">{yourName}</span>
        </p>
        <button
          type="button"
          onClick={readAgain}
          className="group flex min-h-11 items-center gap-3 text-cream/75 transition-colors duration-500 hover:text-cream"
        >
          <span className="eyebrow">{finale.replay}</span>
          <span className="grid size-9 place-items-center rounded-full border border-cream/20 transition-colors duration-500 group-hover:border-rosegold group-hover:text-rosegold">
            <ArrowUp className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
        </button>
      </footer>
    </section>
  )
}
