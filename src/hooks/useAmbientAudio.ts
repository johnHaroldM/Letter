import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveAsset } from '@/lib/utils'

interface Engine {
  play: () => Promise<void>
  pause: () => void
  dispose: () => void
}

/** Plays an audio file on a loop, with gentle fades in and out. */
function createFileEngine(url: string): Engine {
  const audio = new Audio(url)
  audio.loop = true
  audio.preload = 'auto'
  audio.volume = 0

  let raf = 0
  const fadeTo = (target: number, ms: number, done?: () => void) => {
    cancelAnimationFrame(raf)
    const from = audio.volume
    const start = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms)
      audio.volume = from + (target - from) * k
      if (k < 1) raf = requestAnimationFrame(step)
      else done?.()
    }
    raf = requestAnimationFrame(step)
  }

  return {
    play: async () => {
      await audio.play()
      fadeTo(0.7, 1800)
    },
    pause: () => fadeTo(0, 600, () => audio.pause()),
    dispose: () => {
      cancelAnimationFrame(raf)
      audio.pause()
      audio.removeAttribute('src')
    },
  }
}

/**
 * The fallback when no song is configured: a quiet generative pad.
 * Six soft voices on an open major-ninth chord, each swelling at its own slow
 * pace, through a low-pass filter and a long echo.
 */
function createPadEngine(): Engine {
  let context: AudioContext | undefined
  let master: GainNode | undefined
  let suspendTimer = 0

  const build = () => {
    const ctx = new AudioContext()
    const out = ctx.createGain()
    out.gain.value = 0
    out.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 950
    filter.Q.value = 0.4
    filter.connect(out)

    const echo = ctx.createDelay(2)
    echo.delayTime.value = 0.47
    const feedback = ctx.createGain()
    feedback.gain.value = 0.36
    const wet = ctx.createGain()
    wet.gain.value = 0.32
    filter.connect(echo)
    echo.connect(feedback)
    feedback.connect(echo)
    echo.connect(wet)
    wet.connect(out)

    // C major ninth, spread over three octaves.
    const chord = [130.81, 196.0, 246.94, 329.63, 392.0, 587.33]
    chord.forEach((frequency, i) => {
      const voice = ctx.createGain()
      voice.gain.value = 0.085 - i * 0.008
      voice.connect(filter)

      const layers: Array<[OscillatorType, number, number]> = [
        ['sine', -5, 0.62],
        ['triangle', 6, 0.16],
      ]
      for (const [type, cents, level] of layers) {
        const oscillator = ctx.createOscillator()
        oscillator.type = type
        oscillator.frequency.value = frequency
        oscillator.detune.value = cents
        const gain = ctx.createGain()
        gain.gain.value = level
        oscillator.connect(gain)
        gain.connect(voice)
        oscillator.start()
      }

      // Each voice breathes at its own pace, so the chord never sits still.
      const swell = ctx.createOscillator()
      swell.frequency.value = 0.05 + i * 0.017
      const depth = ctx.createGain()
      depth.gain.value = 0.045
      swell.connect(depth)
      depth.connect(voice.gain)
      swell.start()
    })

    context = ctx
    master = out
  }

  return {
    play: async () => {
      if (!context) build()
      window.clearTimeout(suspendTimer)
      await context!.resume()
      master!.gain.setTargetAtTime(0.42, context!.currentTime, 0.9)
    },
    pause: () => {
      if (!context || !master) return
      master.gain.setTargetAtTime(0, context.currentTime, 0.3)
      // Let the fade finish, then stop the audio clock entirely.
      suspendTimer = window.setTimeout(() => void context?.suspend(), 1600)
    },
    dispose: () => {
      window.clearTimeout(suspendTimer)
      void context?.close()
      context = undefined
      master = undefined
    },
  }
}

export interface AmbientAudio {
  playing: boolean
  play: () => void
  pause: () => void
  toggle: () => void
}

/**
 * Sound for the letter. Give it `src` to play your own song; leave `src`
 * empty and it plays a soft built-in pad instead.
 *
 * Browsers only allow audio to start from a click or tap, so call `play` or
 * `toggle` directly inside an event handler.
 */
export function useAmbientAudio(src: string): AmbientAudio {
  const [playing, setPlaying] = useState(false)
  const engine = useRef<Engine | null>(null)
  const wanted = useRef(false)

  const play = useCallback(() => {
    wanted.current = true
    try {
      engine.current ??= src ? createFileEngine(resolveAsset(src)) : createPadEngine()
    } catch {
      return // No audio support here; the toggle simply stays off.
    }
    engine.current
      .play()
      .then(() => setPlaying(wanted.current))
      .catch(() => {
        wanted.current = false
        setPlaying(false)
      })
  }, [src])

  const pause = useCallback(() => {
    wanted.current = false
    engine.current?.pause()
    setPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (wanted.current) pause()
    else play()
  }, [pause, play])

  useEffect(
    () => () => {
      engine.current?.dispose()
      engine.current = null
    },
    [],
  )

  return useMemo(() => ({ playing, play, pause, toggle }), [playing, play, pause, toggle])
}
