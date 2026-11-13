import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AddEquation,
  BufferAttribute,
  BufferGeometry,
  Color,
  CustomBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'
import { experience } from '@/lib/experience'
import { frame } from './director'

/** The volume the dust lives in. Wider and taller than the camera ever sees. */
const BOX = new Vector3(24, 13, 16)
const BOX_Z_OFFSET = -2

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uLift;
  uniform float uResolutionY;
  uniform vec2 uPointer;
  uniform vec3 uBox;

  // x: size, y: phase, z: speed, w: colour mix
  attribute vec4 aSeed;

  varying float vAlpha;
  varying float vMix;

  void main() {
    vec3 p = position;
    float phase = aSeed.y * 6.2831853;
    float speed = 0.35 + aSeed.z;

    // A lazy, wandering drift.
    p.x += sin(uTime * 0.21 * speed + phase) * 0.42 + sin(uTime * 0.13 + phase * 2.7) * 0.2;
    p.y += cos(uTime * 0.17 * speed + phase * 1.3) * 0.36;

    // Rise slowly. Scrolling lifts the whole field, so it moves with the page.
    float depthBias = 0.35 + aSeed.x * 0.65;
    p.y = mod(p.y + uTime * 0.035 * speed + uLift * depthBias + uBox.y * 0.5, uBox.y) - uBox.y * 0.5;

    // Stream toward the viewer. Opening the gate and fast scrolling speed this up.
    float lane = mod(p.z + uTravel * (0.5 + aSeed.z) + uBox.z * 0.5, uBox.z) / uBox.z;
    p.z = (lane - 0.5) * uBox.z;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = max(-mv.z, 0.2);

    // Pointer parallax: near dust slides further than far dust.
    mv.xy -= uPointer * (1.2 / max(dist, 1.0));

    vec4 clip = projectionMatrix * mv;
    gl_Position = clip;

    // Dust near the pointer catches the light.
    vec2 ndc = clip.xy / clip.w;
    float aspect = projectionMatrix[1][1] / projectionMatrix[0][0];
    float nearPointer = 1.0 - smoothstep(0.0, 0.5, length((ndc - uPointer) * vec2(aspect, 1.0)));

    float twinkle = 0.6 + 0.4 * sin(uTime * (0.6 + aSeed.z * 1.8) + phase * 7.0);
    // Fade out right in front of the lens and where a lane wraps around.
    float fade = smoothstep(0.4, 2.6, dist) * smoothstep(0.0, 0.1, lane) * (1.0 - smoothstep(0.9, 1.0, lane));

    vAlpha = twinkle * fade * (0.5 + nearPointer * 0.9);
    vMix = aSeed.w;
    gl_PointSize = (0.35 + aSeed.x * aSeed.x * 2.4) * uResolutionY * 0.03 * (1.0 + nearPointer * 0.6) / dist;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;
  uniform float uAdditive;

  varying float vAlpha;
  varying float vMix;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;

    float halo = pow(1.0 - d, 2.2);
    float core = smoothstep(0.3, 0.0, d);
    float alpha = clamp((halo * 0.55 + core * 0.75) * vAlpha, 0.0, 1.0);

    vec3 colour = mix(uColorA, uColorB, vMix) * uIntensity;
    vec4 texel = linearToOutputTexel(vec4(colour, 1.0));

    // Premultiplied output: one uniform slides the dust from "emits light"
    // (uAdditive = 1, for the dark chapters) to "pigment" (0, for the dawn).
    gl_FragColor = vec4(texel.rgb * alpha, alpha * (1.0 - uAdditive));
  }
`

function createDust(count: number) {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count * 4)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOX.x
    positions[i * 3 + 1] = (Math.random() - 0.5) * BOX.y
    positions[i * 3 + 2] = (Math.random() - 0.5) * BOX.z
    seeds[i * 4] = Math.random()
    seeds[i * 4 + 1] = Math.random()
    seeds[i * 4 + 2] = Math.random()
    seeds[i * 4 + 3] = Math.random()
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 4))

  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uLift: { value: 0 },
      uResolutionY: { value: 900 },
      uPointer: { value: new Vector2() },
      uBox: { value: BOX },
      uColorA: { value: new Color('#f3d2c8') },
      uColorB: { value: new Color('#e9b98a') },
      uIntensity: { value: 1 },
      uAdditive: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneMinusSrcAlphaFactor,
  })

  return { geometry, material }
}

/**
 * Floating dust that leans away from the pointer, brightens around it, rises
 * with the page and streams past the camera when the gate opens.
 */
export function DustField({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => createDust(count), [count])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = frame.time
    u.uTravel.value = frame.travel
    u.uLift.value = frame.lift
    u.uResolutionY.value = state.size.height * state.viewport.dpr
    u.uPointer.value.set(frame.pointer.x, frame.pointer.y)
    u.uColorA.value.copy(frame.dustA)
    u.uColorB.value.copy(frame.dustB)
    u.uIntensity.value = frame.dust * (1 + experience.afterglow * 0.5 + experience.burst * 1.8)
    u.uAdditive.value = frame.additive
  }, -1)

  return (
    <points
      geometry={geometry}
      material={material}
      position={[0, 0, BOX_Z_OFFSET]}
      frustumCulled={false}
    />
  )
}
