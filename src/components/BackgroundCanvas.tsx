import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Scene } from '@/components/scene/Scene'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

/**
 * The single, persistent WebGL canvas behind the whole page.
 *
 * The entry gate (Hero3D) and every scroll section share this one scene, so
 * the heart you click at the gate is the same heart that follows the story.
 * One canvas also means one GPU context, which matters on phones.
 */
export default function BackgroundCanvas() {
  const coarse = useMediaQuery('(pointer: coarse), (max-width: 767px)')
  const [ready, setReady] = useState(false)
  const [throttled, setThrottled] = useState(false)

  const maxDpr = throttled ? 1 : coarse ? 1.5 : 1.75

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh transition-opacity duration-[2200ms] ease-out',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Canvas
        dpr={[1, maxDpr]}
        gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0.3, 7] }}
        style={{ pointerEvents: 'none' }}
        onCreated={() => setReady(true)}
      >
        {/* If the frame rate sags, give up resolution before smoothness. */}
        <PerformanceMonitor onDecline={() => setThrottled(true)} />
        <Scene quality={coarse ? 'low' : 'high'} />
      </Canvas>
    </div>
  )
}
