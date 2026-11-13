import { useLayoutEffect, useRef } from 'react'
import { SplitWords } from '@/components/SplitWords'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap } from '@/lib/gsap'

interface RevealTextProps {
  /** Supports *emphasis* markers. */
  text: string
  as?: 'h2' | 'h3' | 'p'
  className?: string
  /** Seconds to wait after the text scrolls into view. */
  delay?: number
}

/** A line of text whose words rise into place, one after another, as it enters the viewport. */
export function RevealText({ text, as = 'h2', className, delay = 0 }: RevealTextProps) {
  const ref = useRef<HTMLHeadingElement>(null)
  const reduced = usePrefersReducedMotion()
  const Tag = as as 'h2' // one ref type covers all three tags

  useLayoutEffect(() => {
    if (reduced || !ref.current) return
    const context = gsap.context(() => {
      gsap.from('.word', {
        yPercent: 118,
        opacity: 0,
        rotate: 3,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.055,
        delay,
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      })
    }, ref)
    return () => context.revert()
  }, [reduced, delay, text])

  return (
    <Tag ref={ref} className={className}>
      <SplitWords text={text} />
    </Tag>
  )
}
