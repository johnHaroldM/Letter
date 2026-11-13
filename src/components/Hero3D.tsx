import { useEffect } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { Heart, MailOpen } from 'lucide-react'
import { Magnetic } from '@/components/Magnetic'
import { letterConfig } from '@/data/letterConfig'
import { useFinePointer } from '@/hooks/useMediaQuery'
import { experience, type Phase } from '@/lib/experience'
import { gsap } from '@/lib/gsap'
import { EASE_OUT_EXPO } from '@/lib/utils'

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.6 } },
  exit: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(12px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.5, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -26, filter: 'blur(14px)', transition: { duration: 0.7, ease: [0.7, 0, 0.84, 0] } },
}

const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1.6, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
}

/** The heart quickens while her cursor rests on it. */
function setHeartHover(value: number) {
  gsap.to(experience, { hover: value, duration: 0.9, ease: 'power2.out', overwrite: 'auto' })
}

interface Hero3DProps {
  phase: Phase
  onOpen: () => void
}

/**
 * Section 1: the entry gate.
 *
 * The glass heart and the dust around it are drawn by the shared WebGL canvas
 * (BackgroundCanvas) so they can carry on into the story. This component is
 * everything on top of them: who the letter is for, and the way in.
 */
export function Hero3D({ phase, onOpen }: Hero3DProps) {
  const fine = useFinePointer()
  const { gate, herName } = letterConfig
  const sealed = phase === 'gate'

  useEffect(() => {
    if (!sealed) setHeartHover(0)
  }, [sealed])

  return (
    <AnimatePresence>
      {sealed && (
        <motion.section
          key="gate"
          aria-label="A sealed letter"
          className="pointer-events-none fixed inset-0 z-30 flex touch-none flex-col items-center justify-between px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5 text-center md:px-10 md:pb-10 md:pt-7"
          variants={stage}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <motion.div variants={fade} className="flex w-full items-center justify-between text-cream/65">
            <p className="eyebrow flex items-center gap-3">
              <Heart className="size-3 fill-rosegold text-rosegold" aria-hidden="true" />
              {gate.eyebrow}
            </p>
            <p className="eyebrow hidden sm:block">{gate.edition}</p>
          </motion.div>

          {/* An invisible target over the 3D heart, so the heart itself opens the letter. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-cursor-label="Open"
            onClick={onOpen}
            onPointerEnter={() => setHeartHover(1)}
            onPointerLeave={() => setHeartHover(0)}
            className="pointer-events-auto absolute left-1/2 top-[39%] size-[min(38svh,62vw)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          />

          <div className="flex flex-col items-center">
            <h1 className="text-balance font-serif font-light text-cream">
              <motion.span variants={rise} className="block text-2xl italic text-rosegold md:text-[1.75rem]">
                For
              </motion.span>
              <motion.span
                variants={rise}
                className="mt-1 block text-[clamp(3.25rem,10.5vw,8.25rem)] leading-[0.94] tracking-[-0.02em]"
              >
                {herName}
              </motion.span>
            </h1>

            <motion.div variants={rise} className="pointer-events-auto mt-8 md:mt-10">
              <Magnetic>
                <button
                  type="button"
                  onClick={onOpen}
                  className="open-pill flex items-center gap-4 rounded-full py-2.5 pl-2.5 pr-7 text-cream"
                >
                  <span className="relative grid size-11 place-items-center rounded-full bg-rosegold text-obsidian">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-rosegold" aria-hidden="true" />
                    <MailOpen className="relative size-[1.05rem]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="eyebrow">{fine ? gate.prompt : gate.promptTouch}</span>
                </button>
              </Magnetic>
            </motion.div>

            <motion.p variants={fade} className="mt-6 text-[0.8125rem] tracking-wide text-cream/55">
              {gate.hint}
            </motion.p>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
