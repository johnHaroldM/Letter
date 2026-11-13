import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Color, type PerspectiveCamera, type PointLight } from 'three'
import { experience } from '@/lib/experience'
import { DustField } from './DustField'
import { GlassHeart, type Quality } from './GlassHeart'
import { frame, updateFrame } from './director'

/**
 * The whole 3D world: one heart, a field of dust and the lights around them.
 * This component owns the camera, the background colour and the lighting; the
 * numbers it uses are computed each frame by the director.
 */
export function Scene({ quality }: { quality: Quality }) {
  const scene = useThree((state) => state.scene)
  const keyLight = useRef<PointLight>(null)
  const rimLight = useRef<PointLight>(null)
  const background = useMemo(() => new Color('#0f0e13'), [])

  useLayoutEffect(() => {
    scene.background = background
    return () => {
      scene.background = null
    }
  }, [scene, background])

  // Priority -2: runs before the heart and the dust read `frame`.
  useFrame((state, delta) => {
    updateFrame(state, delta)

    const e = experience
    const t = frame.time
    const camera = state.camera as PerspectiveCamera

    // Camera: orbits a point at the heart's height, leans with the pointer and
    // dives forward while the gate opens.
    const [distance, azimuth, elevation, lookAtY] = frame.camera
    const d = distance - frame.rush * 3.2
    const a = azimuth + frame.pointer.x * 0.075 + Math.sin(t * 0.11) * 0.025
    const b = elevation - frame.pointer.y * 0.05 + Math.cos(t * 0.14) * 0.012
    camera.position.set(Math.sin(a) * Math.cos(b) * d, lookAtY + Math.sin(b) * d, Math.cos(a) * Math.cos(b) * d)
    camera.lookAt(0, lookAtY, 0)

    const fov = 35 + frame.rush * 13
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    background.copy(frame.background)

    // Lights travel with the heart so it is lit the same way wherever it goes.
    const [hx, hy, hz] = frame.heart
    const warmth = 1 + e.burst * 1.4 + e.afterglow * 0.3
    if (keyLight.current) {
      keyLight.current.color.copy(frame.keyLight)
      keyLight.current.intensity = 55 * warmth * (1 + frame.beat * 0.12)
      keyLight.current.position.set(hx + Math.cos(t * 0.3) * 4.4, hy + 2.6 + Math.sin(t * 0.2) * 0.6, hz + 4.2 + Math.sin(t * 0.3) * 1.5)
    }
    if (rimLight.current) {
      rimLight.current.color.copy(frame.rimLight)
      rimLight.current.intensity = 42 * warmth
      rimLight.current.position.set(hx - 4.2, hy - 1.4, hz - 2.6)
    }

    // The reflections turn slowly, and a little more as the page scrolls.
    scene.environmentIntensity = frame.env * (1 + e.burst * 0.6)
    scene.environmentRotation.set(0, t * 0.04 + e.scroll * 2.2, 0)
  }, -2)

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight ref={keyLight} decay={2} />
      <pointLight ref={rimLight} decay={2} />

      <GlassHeart quality={quality} />
      <DustField count={quality === 'high' ? 1100 : 520} />

      {/* A tiny studio, rendered once into a cube map. No HDRI download needed. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#08070b']} />
        {/* Soft box overhead */}
        <Lightformer form="rect" intensity={2.4} color="#fff1e6" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 7, 1]} />
        {/* Rose strip, camera left */}
        <Lightformer form="rect" intensity={3.2} color="#f2c0bd" position={[-7, 1, 2]} rotation-y={Math.PI / 2} scale={[9, 2.2, 1]} />
        {/* Amber strip, camera right */}
        <Lightformer form="rect" intensity={2.6} color="#e6b17e" position={[7, -1, 1]} rotation-y={-Math.PI / 2} scale={[9, 1.6, 1]} />
        {/* Ring catch-light from behind the camera */}
        <Lightformer form="ring" intensity={4} color="#ffe1d2" position={[0, 0.5, 9]} scale={2.4} />
        {/* Deep crimson bounce from the floor */}
        <Lightformer form="circle" intensity={1.5} color="#b0445a" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={6} />
      </Environment>
    </>
  )
}
