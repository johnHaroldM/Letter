import confetti from 'canvas-confetti'

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

const ROSE = ['#e2b6b6', '#c58f8f', '#9c3848', '#f5ecdf']
const GOLD = ['#d8b36a', '#e6b17e', '#f3d9a4', '#fdfbf7']

let heart: confetti.Shape | undefined

/** Path shapes need Path2D; older browsers simply get round confetti instead. */
function heartShape(): confetti.Shape {
  if (heart) return heart
  try {
    heart = confetti.shapeFromPath({ path: HEART_PATH })
  } catch {
    heart = 'circle'
  }
  return heart
}

/**
 * A burst of rose hearts and gold dust from `origin`
 * (viewport fractions: 0,0 is top left and 1,1 is bottom right).
 */
export function fireHug(origin: { x: number; y: number }) {
  const shared = { origin, disableForReducedMotion: true, zIndex: 60 }

  // Hearts: slow, large, tumbling.
  confetti({
    ...shared,
    particleCount: 34,
    spread: 80,
    startVelocity: 40,
    gravity: 0.72,
    decay: 0.92,
    scalar: 1.9,
    ticks: 280,
    shapes: [heartShape()],
    colors: ROSE,
  })

  // Gold dust: small, quick, wide.
  confetti({
    ...shared,
    particleCount: 80,
    spread: 130,
    startVelocity: 30,
    gravity: 0.55,
    decay: 0.9,
    scalar: 0.62,
    ticks: 220,
    shapes: ['circle'],
    colors: GOLD,
  })

  // A softer second wave from both edges of the screen.
  window.setTimeout(() => {
    for (const side of [0, 1]) {
      confetti({
        ...shared,
        origin: { x: side, y: 0.78 },
        angle: side === 0 ? 62 : 118,
        particleCount: 22,
        spread: 58,
        startVelocity: 46,
        gravity: 0.7,
        scalar: 1.35,
        ticks: 300,
        shapes: [heartShape(), 'circle'],
        colors: [...ROSE, ...GOLD],
      })
    }
  }, 220)
}
