import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Magnetic } from '@/components/Magnetic'
import { cn, EASE_OUT_EXPO } from '@/lib/utils'

interface MusicToggleProps {
  visible: boolean
  playing: boolean
  title: string
  onToggle: () => void
}

/**
 * The sound control that lives in the corner: five bars that dance while the
 * music plays and rest when it is paused.
 */
export function MusicToggle({ visible, playing, title, onToggle }: MusicToggleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 md:bottom-8 md:right-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.5 }}
        >
          <Magnetic strength={0.22}>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Music"
              aria-pressed={playing}
              className="sound-pill flex min-h-12 items-center gap-3.5 rounded-full py-2.5 pl-4 pr-4 text-left text-cream sm:pr-6"
            >
              <span className={cn('equalizer', playing && 'is-playing')} aria-hidden="true">
                {[0, 1, 2, 3, 4].map((bar) => (
                  <span key={bar} style={{ '--bar': bar } as CSSProperties} />
                ))}
              </span>
              <span className="hidden flex-col leading-tight sm:flex" aria-hidden="true">
                <span className="text-[0.625rem] font-medium uppercase tracking-[0.26em] text-cream/60">
                  {playing ? 'Sound on' : 'Sound off'}
                </span>
                <span className="font-serif text-[1.05rem] italic text-cream">{title}</span>
              </span>
            </button>
          </Magnetic>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
