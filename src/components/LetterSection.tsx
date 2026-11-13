import { useLayoutEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import { ChapterLabel } from '@/components/ChapterLabel'
import { letterConfig } from '@/data/letterConfig'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap, SplitText } from '@/lib/gsap'

/**
 * One paragraph of the letter.
 *
 * The visible copy is split into lines for the reveal, so it is hidden from
 * assistive technology and a clean, unsplit copy is read out instead.
 */
function Paragraph({ text, dropCap = false }: { text: string; dropCap?: boolean }) {
  return (
    <div className="letter-paragraph">
      <p className="sr-only">{text}</p>
      <div aria-hidden="true">
        {dropCap && <span className="drop-cap">{text.charAt(0)}</span>}
        <p className="letter-lines">{dropCap ? text.slice(1) : text}</p>
      </div>
    </div>
  )
}

/**
 * Section 4: the letter itself.
 * A sheet of warm paper under morning light. Each paragraph fades up line by
 * line as it is reached, and the signature writes itself at the end.
 */
export function LetterSection() {
  const root = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()
  const { letter, yourName } = letterConfig

  useLayoutEffect(() => {
    if (reduced) return
    const splits: SplitText[] = []

    const context = gsap.context(() => {
      // The sheet settles onto the desk.
      gsap.from('.parchment', {
        y: 90,
        opacity: 0,
        duration: 1.7,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.parchment', start: 'top 94%', once: true },
      })

      // Short, single-line pieces fade up as they are reached.
      gsap.utils.toArray<HTMLElement>('.letter-fade').forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 18,
          duration: 1.3,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        })
      })

      // Paragraphs arrive line by line. `autoSplit` re-measures the lines when
      // the web font lands or the window changes width.
      gsap.utils.toArray<HTMLElement>('.letter-lines').forEach((block) => {
        splits.push(
          SplitText.create(block, {
            type: 'lines',
            linesClass: 'letter-line',
            aria: 'none',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                opacity: 0,
                y: 16,
                duration: 1.15,
                ease: 'power2.out',
                stagger: 0.13,
                scrollTrigger: { trigger: block, start: 'top 86%', once: true },
              }),
          }),
        )
      })

      gsap.from('.drop-cap', {
        opacity: 0,
        scale: 0.82,
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.drop-cap', start: 'top 86%', once: true },
      })

      // The signature is revealed left to right, as if being written.
      gsap.fromTo(
        '.signature',
        { clipPath: 'inset(-30% 100% -30% -5%)' },
        {
          clipPath: 'inset(-30% -5% -30% -5%)',
          duration: 2.6,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '.signature', start: 'top 88%', once: true },
        },
      )
    }, root)

    return () => {
      splits.forEach((split) => split.revert())
      context.revert()
    }
  }, [reduced])

  return (
    <section ref={root} id="letter" aria-label={letter.label} className="relative px-4 pb-[18vh] pt-[30vh] sm:px-6">
      <ChapterLabel id="letter" className="text-adaptive mx-auto mb-10 max-w-[47rem] justify-center md:mb-14" />

      <article className="parchment mx-auto max-w-[47rem] px-7 py-14 sm:px-12 sm:py-16 md:px-20 md:py-24">
        <header className="letter-fade flex flex-col items-center gap-5 text-center">
          <span className="flex items-center gap-4 text-crimson" aria-hidden="true">
            <span className="h-px w-12 bg-current opacity-35" />
            <Heart className="size-3.5 fill-current" />
            <span className="h-px w-12 bg-current opacity-35" />
          </span>
          <p className="eyebrow text-ink/70">{letter.dateline}</p>
        </header>

        <h2 className="letter-fade mt-12 font-serif text-[2.1rem] font-normal italic leading-tight text-crimson md:mt-16 md:text-[2.75rem]">
          {letter.salutation}
        </h2>

        <div className="mt-8 space-y-7 md:mt-10 md:space-y-8">
          {letter.paragraphs.map((paragraph, index) => (
            <Paragraph key={index} text={paragraph} dropCap={index === 0} />
          ))}
        </div>

        <footer className="mt-14 md:mt-16">
          <p className="letter-fade font-serif text-[1.35rem] italic text-ink/80 md:text-2xl">{letter.closing}</p>
          <p className="signature mt-4 font-script text-[4rem] leading-none text-ink md:text-[5rem]">{yourName}</p>

          {letter.postscript && (
            <p className="letter-fade mt-14 border-t border-crimson/15 pt-7 font-serif text-lg italic text-ink/75 md:text-xl">
              {letter.postscript}
            </p>
          )}
        </footer>
      </article>
    </section>
  )
}
