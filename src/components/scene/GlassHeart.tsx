import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import {
  AdditiveBlending,
  Color,
  MathUtils,
  ShaderMaterial,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import { experience } from '@/lib/experience'
import { frame } from './director'
import { createHeartGeometry } from './heartGeometry'

export type Quality = 'high' | 'low'

const TAU = Math.PI * 2

/** A soft additive glow that sits just behind the heart. */
function createHaloMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color('#ffd9cc') },
      uStrength: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;

      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float glow = pow(max(0.0, 1.0 - d), 2.4);
        vec4 texel = linearToOutputTexel(vec4(uColor, 1.0));
        gl_FragColor = vec4(texel.rgb, glow * uStrength);
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
}

/**
 * The glass heart: a refractive shell around a small glowing heart that beats.
 * Position, scale and mood all come from the director's `frame`.
 */
export function GlassHeart({ quality }: { quality: Quality }) {
  const anchor = useRef<Group>(null)
  const turn = useRef<Group>(null)
  const core = useRef<Mesh>(null)
  const coreMaterial = useRef<MeshBasicMaterial>(null)
  const motion = useRef({ appear: 0, hugSpin: 0 })

  const high = quality === 'high'
  const geometry = useMemo(() => createHeartGeometry(high ? 30 : 18), [high])
  const halo = useMemo(createHaloMaterial, [])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => halo.dispose(), [halo])

  useFrame((_, delta) => {
    if (!anchor.current || !turn.current || !core.current || !coreMaterial.current) return
    const dt = Math.min(delta, 1 / 20)
    const e = experience
    const m = motion.current
    const t = frame.time

    // Arrive softly when the canvas first appears.
    m.appear = MathUtils.damp(m.appear, 1, 2.4, dt)
    m.hugSpin = MathUtils.damp(m.hugSpin, e.spin, 2.2, dt)

    const [x, y, z, scale] = frame.heart
    const pulse = 1 + frame.beat * 0.032 + e.burst * 0.1
    anchor.current.position.set(x, y + Math.sin(t * 0.7) * 0.07, z)
    anchor.current.scale.setScalar(scale * pulse * (0.72 + 0.28 * m.appear))

    // A slow sway keeps the silhouette readable; opening the gate adds two
    // full turns, and every hug one more.
    const sway = Math.sin(t * 0.42) * 0.55
    const flourish = MathUtils.smootherstep(e.open, 0, 1) * TAU * 2
    turn.current.rotation.set(
      -frame.pointer.y * 0.26 + Math.sin(t * 0.5) * 0.06,
      sway + flourish + m.hugSpin + frame.pointer.x * 0.45,
      Math.sin(t * 0.37) * 0.05,
    )

    // The inner heart is what the glass refracts: brighter on every beat.
    core.current.scale.setScalar(0.36 * (1 + frame.beat * 0.16))
    coreMaterial.current.color
      .copy(frame.keyLight)
      .multiplyScalar(frame.core * (1.1 + frame.beat * 1.3 + e.hover * 0.8 + e.burst * 2.6))

    halo.uniforms.uColor.value.copy(frame.keyLight)
    halo.uniforms.uStrength.value =
      frame.halo * m.appear * (1 + frame.beat * 0.22 + e.hover * 0.35 + e.burst * 1.5 + e.afterglow * 0.45)
  }, -1)

  return (
    <group ref={anchor}>
      <mesh position={[0, 0, -0.9]} material={halo} renderOrder={-1}>
        <planeGeometry args={[7.5, 7.5]} />
      </mesh>

      <group ref={turn}>
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            samples={high ? 8 : 4}
            resolution={high ? 1024 : 384}
            backside={high}
            backsideResolution={512}
            backsideThickness={0.5}
            transmission={1}
            thickness={1.15}
            ior={1.32}
            roughness={0.07}
            chromaticAberration={0.32}
            anisotropicBlur={0.25}
            distortion={0.22}
            distortionScale={0.42}
            temporalDistortion={0.06}
            clearcoat={1}
            clearcoatRoughness={0.1}
            color="#f8dcd6"
            attenuationColor="#e39aa3"
            attenuationDistance={2.4}
          />
        </mesh>

        <mesh ref={core} geometry={geometry} scale={0.36}>
          <meshBasicMaterial ref={coreMaterial} color="#ffd9cc" toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
