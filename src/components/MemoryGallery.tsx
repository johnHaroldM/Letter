import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ChapterLabel } from '@/components/ChapterLabel'
import { RevealText } from '@/components/RevealText'
import { letterConfig, type Memory } from '@/data/letterConfig'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap } from '@/lib/gsap'
import { cn, resolveAsset } from '@/lib/utils'

/**
 * The editorial grid. Each slot decides where a card sits on desktop, the
 * shape of its photo, which way it leans on phones and how far it drifts
 * while scrolling (px, positive = slower than the page). Slots repeat if
 * there are more than four memories.
 */
const SLOTS = [
  { cell: 'md:col-span-5 md:col-start-1', frame: 'aspect-[4/5]', lean: 'mr-auto', drift: 44 },
  { cell: 'md:col-span-6 md:col-start-7 md:mt-[24vh]', frame: 'aspect-[5/4]', lean: 'ml-auto', drift: -36 },
  { cell: 'md:col-span-6 md:col-start-2 md:mt-[4vh]', frame: 'aspect-[16/11]', lean: 'mr-auto', drift: 30 },
  { cell: 'md:col-span-4 md:col-start-9 md:-mt-[14vh]', frame: 'aspect-[3/4]', lean: 'ml-auto', drift: -54 },
] as const

type Slot = (typeof SLOTS)[number]

const SPRING = { stiffness: 170, damping: 18, mass: 0.6 }

/** Pointer-driven 3D tilt with a soft glare that follows the cursor. */
function useTilt(enabled: boolean) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const hover = useMotionValue(0)

  const smoothX = useSpring(x, SPRING)
  const smoothY = useSpring(y, SPRING)
  const glareOpacity = useSpring(hover, { stiffness: 120, damping: 20 })

  const rotateY = useTransform(smoothX, [0, 1], [-9, 9])
  const rotateX = useTransform(smoothY, [0, 1], [7, -7])
  const glareX = useTransform(smoothX, (value) => `${value * 100}%`)
  const glareY = useTransform(smoothY, (value) => `${value * 100}%`)
  const glare = useMotionTemplate`radial-gradient(38rem circle at ${glareX} ${glareY}, rgb(255 238 226 / 0.2), transparent 55%)`

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!enabled || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - rect.left) / rect.width)
    y.set((event.clientY - rect.top) / rect.height)
    hover.set(1)
  }

  const onPointerLeave = () => {
    x.set(0.5)
    y.set(0.5)
    hover.set(0)
  }

  return { rotateX, rotateY, glare, glareOpacity, onPointerMove, onPointerLeave }
}

interface MemoryCardProps {
  memory: Memory
  index: number
  slot: Slot
  tiltEnabled: boolean
}

function MemoryCard({ memory, index, slot, tiltEnabled }: MemoryCardProps) {
  const tilt = useTilt(tiltEnabled)
  const [broken, setBroken] = useState(false)

  return (
    <div className={cn('memory-cell w-[92%] md:w-auto', slot.lean, slot.cell)}>
      {/* Scroll parallax lives on this wrapper... */}
      <div className="memory-drift" data-drift={slot.drift}>
        {/* ...the entrance on this one, which also measures the pointer for the tilt... */}
        <div
          className="memory-enter [perspective:1100px]"
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
        >
          {/* ...and the tilt itself here, so no two animations fight over one transform. */}
          <motion.figure
            className="relative [transform-style:preserve-3d]"
            style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
          >
            <div className="glass-card absolute inset-0 rounded-[1.75rem]" />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
              style={{ background: tilt.glare, opacity: tilt.glareOpacity }}
            />

            <div className="relative p-3 [transform:translateZ(34px)] sm:p-3.5">
              <div className={cn('relative overflow-hidden rounded-[1.25rem] bg-obsidian-raised', slot.frame)}>
                {broken ? (
                  <div className="memory-placeholder absolute inset-0" role="img" aria-label={memory.alt} />
                ) : (
                  <img
                    className="memory-image absolute inset-x-0 -top-[9%] h-[118%] w-full max-w-none object-cover"
                    src={resolveAsset(memory.src)}
                    alt={memory.alt}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={() => setBroken(true)}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-obsidian/45 via-transparent to-obsidian/25" />
                <span className="absolute left-4 top-3 font-serif text-xl italic text-cream" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <figcaption className="px-2 pb-3 pt-5 sm:px-3 sm:pt-6">
                <p className="eyebrow text-rosegold">
                  {memory.date} <span className="mx-1.5 opacity-50">/</span> {memory.place}
                </p>
                <h3 className="mt-2.5 font-serif text-[1.75rem] italic leading-tight text-cream md:text-[2rem]">
                  {memory.title}
                </h3>
                <p className="mt-2 max-w-[38ch] text-[0.95rem] leading-relaxed text-cream/75">{memory.caption}</p>
              </figcaption>
            </div>
          </motion.figure>
        </div>
      </div>
    </div>
  )
}

/**
 * Section 3: the memory gallery.
 * Frosted cards in a staggered grid; each drifts at its own speed, its photo
 * slides inside its frame, and it tilts toward the cursor.
 */
export function MemoryGallery() {
  const root = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()
  const { memories } = letterConfig

  useLayoutEffect(() => {
    if (reduced) return
    const media = gsap.matchMedia(root)

    media.add({ desktop: '(min-width: 768px)', phone: '(max-width: 767px)' }, (context) => {
      const amount = context.conditions?.desktop ? 1 : 0.4

      gsap.utils.toArray<HTMLElement>('.memory-cell').forEach((cell) => {
        const drift = cell.querySelector<HTMLElement>('.memory-drift')
        const enter = cell.querySelector<HTMLElement>('.memory-enter')
        const image = cell.querySelector<HTMLElement>('.memory-image')
        if (!drift || !enter) return

        const offset = Number(drift.dataset.drift) * amount
        const scrub = { trigger: cell, start: 'top bottom', end: 'bottom top', scrub: true }

        gsap.fromTo(drift, { y: offset }, { y: -offset, ease: 'none', scrollTrigger: scrub })
        if (image) gsap.fromTo(image, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: scrub })

        gsap.from(enter, {
          opacity: 0,
          y: 90,
          scale: 0.96,
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: { trigger: cell, start: 'top 90%', once: true },
        })
      })
    })

    return () => media.revert()
  }, [reduced, memories.items.length])

  return (
    <section ref={root} id="memories" aria-label={memories.label} className="relative px-5 py-[16vh] md:px-14 lg:px-24">
      <header className="mx-auto grid max-w-[92rem] gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <ChapterLabel id="memories" className="text-rosegold" />
          <RevealText
            text={memories.heading}
            className="mt-7 text-balance font-serif text-[clamp(2.6rem,6.4vw,6.25rem)] font-light leading-[1.02] tracking-[-0.015em] text-cream"
          />
        </div>
        <p className="max-w-sm text-base leading-relaxed text-cream/70 md:col-span-4 md:pb-3">{memories.lede}</p>
      </header>

      <div className="mx-auto mt-[12vh] grid max-w-[92rem] gap-y-14 md:grid-cols-12 md:gap-x-8 md:gap-y-0">
        {memories.items.map((memory, index) => (
          <MemoryCard
            key={memory.src + index}
            memory={memory}
            index={index}
            slot={SLOTS[index % SLOTS.length]}
            tiltEnabled={!reduced}
          />
        ))}
      </div>
    </section>
  )
}
