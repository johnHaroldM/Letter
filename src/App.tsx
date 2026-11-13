import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { CanvasBoundary } from '@/components/CanvasBoundary'
import { ChapterHud } from '@/components/ChapterHud'
import { CustomCursor } from '@/components/CustomCursor'
import { FilmGrain } from '@/components/FilmGrain'
import { Finale } from '@/components/Finale'
import { Hero3D } from '@/components/Hero3D'
import { IntroSection } from '@/components/IntroSection'
import { LetterSection } from '@/components/LetterSection'
import { MemoryGallery } from '@/components/MemoryGallery'
import { MusicToggle } from '@/components/MusicToggle'
import { SmoothScroll } from '@/components/SmoothScroll'
import { letterConfig } from '@/data/letterConfig'
import { useAmbientAudio } from '@/hooks/useAmbientAudio'
import { useInteractionSounds } from '@/hooks/useInteractionSounds'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { usePointerParallax, useSceneChoreography } from '@/hooks/useSceneChoreography'
import { experience, type Phase } from '@/lib/experience'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { cn } from '@/lib/utils'

// three.js is the heaviest thing on the page. Loading it separately lets the
// gate's typography appear at once while the 3D scene streams in behind it.
const BackgroundCanvas = lazy(() => import('@/components/BackgroundCanvas'))

export default function App() {
  const [phase, setPhase] = useState<Phase>('gate')
  // Becomes true mid-transition, at the brightest moment of the bloom.
  const [revealed, setRevealed] = useState(false)
  const veil = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const { playing, play, toggle } = useAmbientAudio(letterConfig.music.src)

  useInteractionSounds()
  useSceneChoreography()
  usePointerParallax()

  useEffect(() => {
    document.title = letterConfig.meta.title
  }, [])

  const openLetter = useCallback(() => {
    if (phase !== 'gate') return
    setPhase('opening')

    // Browsers only let audio start from a click, so this has to happen here.
    if (letterConfig.music.autoplay && letterConfig.music.src) play()

    const enterStory = () => {
      setPhase('story')
      requestAnimationFrame(() => ScrollTrigger.refresh())
    }

    if (reduced) {
      experience.open = 1
      setRevealed(true)
      enterStory()
      return
    }

    // The camera dives at the heart, light blooms out of it, and the story is
    // waiting on the other side.
    gsap
      .timeline()
      .to(experience, { open: 1, duration: 3.6, ease: 'power2.inOut' }, 0)
      .fromTo(
        veil.current,
        { opacity: 0, scale: 0.55 },
        { opacity: 1, scale: 1.5, duration: 1.3, ease: 'power2.in' },
        0.3,
      )
      .add(() => setRevealed(true), 1.6)
      .to(veil.current, { opacity: 0, scale: 2.3, duration: 2, ease: 'power2.out' }, 1.6)
      .add(enterStory, 2.4)
  }, [phase, reduced, play])

  return (
    <SmoothScroll locked={phase !== 'story'}>
      <CanvasBoundary>
        <Suspense fallback={null}>
          <BackgroundCanvas />
        </Suspense>
      </CanvasBoundary>

      <div className="vignette" aria-hidden="true" />

      <Hero3D phase={phase} onOpen={openLetter} />

      <main inert={!revealed} className={cn('relative z-10', !revealed && 'invisible')}>
        <h1 className="sr-only">{letterConfig.meta.title}</h1>
        <IntroSection active={revealed} />
        <MemoryGallery />
        <LetterSection />
        <Finale />
      </main>

      <ChapterHud visible={revealed} />
      <MusicToggle visible={revealed} playing={playing} title={letterConfig.music.title} onToggle={toggle} />

      <div ref={veil} className="veil" aria-hidden="true" />
      <FilmGrain />
      <CustomCursor />
    </SmoothScroll>
  )
}
