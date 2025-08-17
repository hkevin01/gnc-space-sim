import { MissionPanel } from '@gnc/ui'
import { OrbitControls, StatsGl } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitDemo } from './components/OrbitDemo'
import { useMissionStore } from './state/missionStore'

export default function App() {
  const phase = useMissionStore((s) => s.phase)
  return (
    <div className="grid grid-cols-[320px_1fr] grid-rows-[1fr] h-screen">
      <aside className="border-r border-zinc-700 p-3 overflow-auto bg-zinc-950">
        <h1 className="text-lg font-semibold mb-3">GNC Space Sim</h1>
        <MissionPanel />
      </aside>
      <main className="relative">
        <Canvas shadows camera={{ position: [6, 4, 8], fov: 50 }}>
          <ambientLight intensity={0.2} />
          <directionalLight castShadow position={[10, 10, 5]} intensity={1.2} />
          <Suspense>
            <OrbitDemo />
          </Suspense>
          <OrbitControls makeDefault />
          <StatsGl />
        </Canvas>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900/70 px-3 py-1 rounded text-xs">
          Phase: {phase}
        </div>
      </main>
    </div>
  )
}
