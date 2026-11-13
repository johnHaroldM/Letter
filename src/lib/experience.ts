/**
 * A tiny mutable state bag shared by the DOM layer (GSAP, ScrollTrigger,
 * pointer events) and the WebGL render loop.
 *
 * Everything in here changes many times a second, so it deliberately lives
 * outside React: writers mutate it, the render loop reads it, and nothing
 * re-renders.
 */
export const experience = {
  /** 0 → 1 while the entry gate opens. Tweened once by GSAP. */
  open: 0,
  /** 0 → 1 while the pointer rests on the heart at the gate. */
  hover: 0,
  /** Whole-page scroll progress, 0 → 1. */
  scroll: 0,
  /** Scroll velocity in px per frame, written by Lenis and decayed by the render loop. */
  velocity: 0,
  /** Progress through the memory gallery, 0 → 1. */
  gallery: 0,
  /** 0 → 1 as the letter arrives: night turns to dawn. */
  letter: 0,
  /** 0 → 1 across the finale. */
  finale: 0,
  /** Jumps to 1 on every virtual hug, then decays in the render loop. */
  burst: 0,
  /** Rises a little with each hug and stays: the scene keeps the warmth. */
  afterglow: 0,
  /** Extra rotation owed to the heart, in radians. Each hug adds a full turn. */
  spin: 0,
  /** Pointer in normalised device coordinates, -1 → 1, y up. */
  pointer: { x: 0, y: 0 },
}

/**
 * How far the letter's "dawn" has risen, 0 → 1.
 * Shared by the WebGL background and the CSS `--dawn` variable so they never disagree.
 */
export function dawnAmount() {
  const rise = smooth(experience.letter, 0, 1)
  const dusk = smooth(experience.finale, 0, 0.45)
  return rise * (1 - dusk)
}

function smooth(value: number, min: number, max: number) {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

/** Where the visitor is: at the sealed gate, mid-transition, or reading. */
export type Phase = 'gate' | 'opening' | 'story'
