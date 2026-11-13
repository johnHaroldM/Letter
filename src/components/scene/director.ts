import { Color, MathUtils } from 'three'
import type { RootState } from '@react-three/fiber'
import { experience } from '@/lib/experience'

const { clamp, damp, lerp, smoothstep, smootherstep } = MathUtils

type Vec4 = readonly [number, number, number, number]

/**
 * One "look" for the scene. The story has five of them, and the render loop
 * blends from each to the next as the gate opens and the page scrolls.
 */
interface SceneChapter {
  /** Heart on wide screens: x, y, z, scale. */
  heart: Vec4
  /** Heart on narrow portrait screens. */
  heartNarrow: Vec4
  /** Camera: distance, azimuth, elevation, look-at height. */
  camera: Vec4
  background: Color
  keyLight: Color
  rimLight: Color
  dustA: Color
  dustB: Color
  /** Dust brightness. */
  dust: number
  /** 1 = dust emits light (dark backdrops), 0 = dust is pigment (light backdrops). */
  additive: number
  /** Colour and strength of the glow behind the heart. */
  glow: Color
  halo: number
  /** Light inside the heart. */
  core: number
  /** Strength of the studio reflections on the glass. */
  env: number
}

const c = (hex: string) => new Color(hex)

const CHAPTERS: readonly SceneChapter[] = [
  // 0 · The gate: the heart waits, centre stage.
  {
    heart: [0, 0.72, 0, 0.9],
    heartNarrow: [0, 0.8, 0, 0.5],
    camera: [7, 0, 0.02, 0.15],
    background: c('#0f0e13'),
    keyLight: c('#ffd9cc'),
    rimLight: c('#9a7fb8'),
    dustA: c('#f6d5ca'),
    dustB: c('#ecbb88'),
    glow: c('#d98a76'),
    dust: 1,
    additive: 1,
    halo: 0.5,
    core: 1,
    env: 1,
  },
  // 1 · Prelude: it steps aside to make room for the words.
  {
    heart: [2.35, 0.1, -0.4, 0.95],
    heartNarrow: [0.42, 1.45, -0.6, 0.42],
    camera: [7.6, -0.08, 0, 0],
    background: c('#0f0e13'),
    keyLight: c('#f2c1b0'),
    rimLight: c('#e6b17e'),
    dustA: c('#f3c8bb'),
    dustB: c('#e9b47f'),
    glow: c('#d08a70'),
    dust: 0.95,
    additive: 1,
    halo: 0.4,
    core: 0.9,
    env: 0.95,
  },
  // 2 · Memories: it drifts across the room, behind the frosted cards.
  {
    heart: [-2.9, 0.4, -2.4, 0.66],
    heartNarrow: [-0.5, 1.2, -2.6, 0.36],
    camera: [8.4, 0.22, 0.05, 0],
    background: c('#120f16'),
    keyLight: c('#e9b07a'),
    rimLight: c('#b0445a'),
    dustA: c('#e9b47f'),
    dustB: c('#dc9090'),
    glow: c('#c98452'),
    dust: 0.9,
    additive: 1,
    halo: 0.36,
    core: 0.85,
    env: 0.9,
  },
  // 3 · The letter: night turns to dawn and the heart retreats to the margin.
  {
    heart: [4.3, 1.7, -3.6, 0.5],
    heartNarrow: [0.6, 1.9, -3.8, 0.3],
    camera: [9.2, 0, 0.1, 0.2],
    background: c('#f5ecdf'),
    keyLight: c('#fff4e6'),
    rimLight: c('#e2b6b6'),
    dustA: c('#c98d7c'),
    dustB: c('#c9a05a'),
    glow: c('#e6b17e'),
    dust: 0.9,
    additive: 0,
    halo: 0,
    core: 0.4,
    env: 1.35,
  },
  // 4 · Finale: back to centre, held high above the last words, warmer than it began.
  {
    heart: [0, 1.82, 0, 0.6],
    heartNarrow: [0, 1.95, 0, 0.36],
    camera: [7.4, 0, -0.03, 0.35],
    background: c('#140c11'),
    keyLight: c('#ffb3a6'),
    rimLight: c('#e8b35f'),
    dustA: c('#ffccba'),
    dustB: c('#f2c670'),
    glow: c('#e07a72'),
    dust: 1.2,
    additive: 1,
    halo: 0.62,
    core: 1.3,
    env: 1.1,
  },
]

// The sky does not go from night to day through grey. For a moment it blushes.
const SUNRISE = c('#e39a78')
const SUNSET = c('#b4526a')

/**
 * Everything the scene needs for the current frame, computed once by
 * `updateFrame` and read by the camera rig, the heart and the dust.
 */
export const frame = {
  time: 0,
  /** 0 on narrow portrait screens → 1 on wide ones. */
  wide: 1,
  /** The camera's rush through the gate: 0 → 1 → 0. */
  rush: 0,
  /** Heartbeat: 0 at rest, about 1 at the peak of the beat. */
  beat: 0,
  /** Damped pointer, -1 → 1. */
  pointer: { x: 0, y: 0 },
  /** Damped scroll speed, roughly -1 → 1. */
  velocity: 0,
  /** How far the dust has streamed toward the viewer. */
  travel: 0,
  /** Vertical dust offset tied to page scroll. */
  lift: 0,
  heart: [0, 0.72, 0, 0.9] as [number, number, number, number],
  camera: [7, 0, 0.02, 0.15] as [number, number, number, number],
  background: c('#0f0e13'),
  keyLight: c('#ffd9cc'),
  rimLight: c('#9a7fb8'),
  dustA: c('#f6d5ca'),
  dustB: c('#ecbb88'),
  glow: c('#d98a76'),
  dust: 1,
  additive: 1,
  halo: 0.5,
  core: 1,
  env: 1,
}

// Blend weights toward chapters 1 → 4. `weights` moves things, `tones` colours them.
const weights = [0, 0, 0, 0]
const tones = [0, 0, 0, 0]
const narrow: [number, number, number, number] = [0, 0, 0, 1]
let beatPhase = 0

// Each chapter is blended on top of the result of the previous ones, so the
// scene is always a pure function of "how open" and "how far scrolled".
function mixNumber(pick: (chapter: SceneChapter) => number, w: number[]) {
  let value = pick(CHAPTERS[0])
  for (let i = 1; i < CHAPTERS.length; i++) value += (pick(CHAPTERS[i]) - value) * w[i - 1]
  return value
}

function mixColor(out: Color, pick: (chapter: SceneChapter) => Color, w: number[]) {
  out.copy(pick(CHAPTERS[0]))
  for (let i = 1; i < CHAPTERS.length; i++) out.lerp(pick(CHAPTERS[i]), w[i - 1])
}

function mixVec4(out: number[], pick: (chapter: SceneChapter) => Vec4, w: number[]) {
  const first = pick(CHAPTERS[0])
  for (let k = 0; k < 4; k++) out[k] = first[k]
  for (let i = 1; i < CHAPTERS.length; i++) {
    const next = pick(CHAPTERS[i])
    for (let k = 0; k < 4; k++) out[k] += (next[k] - out[k]) * w[i - 1]
  }
}

const pickHeart = (chapter: SceneChapter) => chapter.heart
const pickHeartNarrow = (chapter: SceneChapter) => chapter.heartNarrow
const pickCamera = (chapter: SceneChapter) => chapter.camera
const pickBackground = (chapter: SceneChapter) => chapter.background
const pickKeyLight = (chapter: SceneChapter) => chapter.keyLight
const pickRimLight = (chapter: SceneChapter) => chapter.rimLight
const pickDustA = (chapter: SceneChapter) => chapter.dustA
const pickDustB = (chapter: SceneChapter) => chapter.dustB
const pickGlow = (chapter: SceneChapter) => chapter.glow
const pickDust = (chapter: SceneChapter) => chapter.dust
const pickAdditive = (chapter: SceneChapter) => chapter.additive
const pickHalo = (chapter: SceneChapter) => chapter.halo
const pickCore = (chapter: SceneChapter) => chapter.core
const pickEnv = (chapter: SceneChapter) => chapter.env

/** Advance the scene by one frame. Called once, before anything else renders. */
export function updateFrame(state: RootState, rawDelta: number) {
  const dt = Math.min(rawDelta, 1 / 20)
  const e = experience

  frame.time += dt
  frame.wide = smoothstep(state.size.width / Math.max(1, state.size.height), 0.7, 1.45)
  frame.rush = Math.max(0, Math.sin(Math.PI * e.open)) ** 1.3

  // Pointer, with a slow idle sway so touch screens are never perfectly still.
  frame.pointer.x = damp(frame.pointer.x, e.pointer.x + Math.sin(frame.time * 0.23) * 0.06, 3.2, dt)
  frame.pointer.y = damp(frame.pointer.y, e.pointer.y + Math.cos(frame.time * 0.19) * 0.05, 3.2, dt)

  // Scroll speed. Lenis stops reporting once the page settles, so decay it here.
  frame.velocity = damp(frame.velocity, clamp(e.velocity / 45, -1.5, 1.5), 5, dt)
  e.velocity *= Math.exp(-dt * 6)

  // A hug flares, then fades.
  e.burst = damp(e.burst, 0, 1.5, dt)

  // The heartbeat quickens under her cursor and after a hug.
  const period = lerp(1.75, 1.0, e.hover) / (1 + e.burst * 0.9)
  beatPhase = (beatPhase + dt / period) % 1
  const lub = Math.exp(-(((beatPhase - 0.1) / 0.045) ** 2))
  const dub = Math.exp(-(((beatPhase - 0.3) / 0.06) ** 2))
  frame.beat = lub + dub * 0.6

  // Dust streams toward the viewer: gently at rest, hard through the gate.
  frame.travel += dt * (0.1 + frame.rush * 9 + Math.abs(frame.velocity) * 1.2 + e.burst * 1.2)
  frame.lift = damp(frame.lift, e.scroll * 10, 5, dt)

  // The heart changes places at the height of the bloom, while the light hides it.
  weights[0] = smoothstep(e.open, 0.44, 0.6)
  weights[1] = smootherstep(e.gallery, 0, 1)
  weights[2] = smoothstep(e.letter, 0, 1)
  weights[3] = smoothstep(e.finale, 0.08, 1)

  // Colour turns faster than the heart travels, so dusk is complete before the
  // finale's words arrive.
  tones[0] = weights[0]
  tones[1] = weights[1]
  tones[2] = weights[2]
  tones[3] = smoothstep(e.finale, 0, 0.45)

  mixVec4(frame.heart, pickHeart, weights)
  mixVec4(narrow, pickHeartNarrow, weights)
  for (let k = 0; k < 4; k++) frame.heart[k] = lerp(narrow[k], frame.heart[k], frame.wide)
  mixVec4(frame.camera, pickCamera, weights)

  mixColor(frame.background, pickBackground, tones)
  frame.background.lerp(SUNRISE, 4 * tones[2] * (1 - tones[2]) * (1 - tones[3]) * 0.32)
  frame.background.lerp(SUNSET, 4 * tones[3] * (1 - tones[3]) * tones[2] * 0.4)
  mixColor(frame.keyLight, pickKeyLight, tones)
  mixColor(frame.rimLight, pickRimLight, tones)
  mixColor(frame.dustA, pickDustA, tones)
  mixColor(frame.dustB, pickDustB, tones)
  mixColor(frame.glow, pickGlow, tones)

  frame.dust = mixNumber(pickDust, tones)
  frame.additive = mixNumber(pickAdditive, tones)
  frame.halo = mixNumber(pickHalo, tones)
  frame.core = mixNumber(pickCore, tones)
  frame.env = mixNumber(pickEnv, tones)
}
