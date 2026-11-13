import { useEffect } from 'react'

type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

function createAudioContext() {
  const AudioContextConstructor = window.AudioContext || (window as AudioContextWindow).webkitAudioContext
  return AudioContextConstructor ? new AudioContextConstructor() : null
}

/** A tiny, warm click synthesized on demand so the page needs no audio files. */
function playPress(context: AudioContext) {
  if (context.state === 'suspended') void context.resume()

  const now = context.currentTime
  const body = context.createOscillator()
  const bodyGain = context.createGain()
  body.type = 'sine'
  body.frequency.setValueAtTime(720, now)
  body.frequency.exponentialRampToValueAtTime(390, now + 0.11)
  bodyGain.gain.setValueAtTime(0.0001, now)
  bodyGain.gain.exponentialRampToValueAtTime(0.075, now + 0.009)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
  body.connect(bodyGain)
  bodyGain.connect(context.destination)
  body.start(now)
  body.stop(now + 0.15)

  const tick = context.createOscillator()
  const tickGain = context.createGain()
  tick.type = 'triangle'
  tick.frequency.setValueAtTime(1450, now)
  tick.frequency.exponentialRampToValueAtTime(900, now + 0.035)
  tickGain.gain.setValueAtTime(0.0001, now)
  tickGain.gain.exponentialRampToValueAtTime(0.018, now + 0.004)
  tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)
  tick.connect(tickGain)
  tickGain.connect(context.destination)
  tick.start(now)
  tick.stop(now + 0.05)
}

/** Add a quiet tactile sound to every button, link, and keyboard activation. */
export function useInteractionSounds() {
  useEffect(() => {
    let context: AudioContext | null = null
    let lastPlayedAt = 0

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const control = event.target.closest<HTMLElement>(
        'button, a[href], [role="button"], input[type="button"], input[type="submit"], summary, [data-sound="press"]',
      )
      if (!control || control.matches(':disabled, [aria-disabled="true"], [data-sound="off"]')) return

      const now = performance.now()
      if (now - lastPlayedAt < 55) return
      lastPlayedAt = now

      try {
        context ??= createAudioContext()
        if (context) playPress(context)
      } catch {
        // Audio is optional; unsupported browsers should keep working silently.
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      void context?.close()
    }
  }, [])
}
