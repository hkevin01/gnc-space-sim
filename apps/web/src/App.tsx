import { MissionPanel } from '@gnc/ui'
import { OrbitControls, StatsGl } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LaunchSimulation } from './components/LaunchSimulation'
import { OrbitDemo } from './components/OrbitDemo'
import { useMissionStore, type MissionState } from './state/missionStore'

export default function App() {
  const phase = useMissionStore((s: MissionState) => s.phase)
  const setPhase = useMissionStore((s: MissionState) => s.setPhase)
  const [simMode, setSimMode] = useState<'launch' | 'orbit'>('launch')

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-[320px_1fr] grid-rows-[1fr] h-screen">
        <aside className="border-r border-zinc-700 p-3 overflow-auto bg-zinc-950">
          <h1 className="text-lg font-semibold mb-3">GNC Space Sim</h1>

          {/* Simulation Mode Selector */}
          <div className="mb-4 p-3 bg-zinc-800 rounded">
            <h3 className="text-sm font-semibold mb-2 text-zinc-300">Simulation Mode</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSimMode('launch')}
                className={`px-3 py-1 text-xs rounded ${
                  simMode === 'launch'
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                🚀 Launch
              </button>
              <button
                onClick={() => setSimMode('orbit')}
                className={`px-3 py-1 text-xs rounded ${
                  simMode === 'orbit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                🛰️ Orbit
              </button>
            </div>
          </div>

          <MissionPanel phase={phase} onChange={setPhase} />

          {/* GNC Information Panel */}
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <h3 className="text-sm font-semibold mb-2 text-yellow-400">GNC Systems</h3>
            <div className="text-xs space-y-2 text-zinc-300">
              {simMode === 'launch' ? (
                <>
                  <div><strong>🎯 Guidance:</strong> Gravity Turn Algorithm</div>
                  <div><strong>🧭 Navigation:</strong> IMU + GPS Fusion</div>
                  <div><strong>🎮 Control:</strong> TVC + RCS Systems</div>
                  <div className="mt-2 text-zinc-400">
                    Launch from Earth surface through orbital insertion with
                    real-time atmospheric modeling and multi-stage guidance.
                  </div>
                </>
              ) : (
                <>
                  <div><strong>🎯 Guidance:</strong> Hohmann Transfers</div>
                  <div><strong>🧭 Navigation:</strong> Keplerian Elements</div>
                  <div><strong>🎮 Control:</strong> Orbital Maneuvers</div>
                  <div className="mt-2 text-zinc-400">
                    Two-body orbital mechanics with real-time propagation
                    and mission trajectory planning.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scientific Formulas */}
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <h3 className="text-sm font-semibold mb-2 text-cyan-400">Physics Formulas</h3>
            <div className="text-xs space-y-1 text-zinc-300 font-mono">
              <div>F = ma (Newton's 2nd Law)</div>
              <div>F_g = GMm/r² (Gravity)</div>
              <div>v_orbit = √(μ/r) (Orbital Velocity)</div>
              <div>Δv = I_sp × g₀ × ln(m₀/m_f) (Rocket Equation)</div>
              <div>e = (r_a - r_p)/(r_a + r_p) (Eccentricity)</div>
              <div>T = 2π√(a³/μ) (Orbital Period)</div>
            </div>
          </div>
        </aside>

        <main className="relative">
          {simMode === 'launch' ? (
            <LaunchSimulation />
          ) : (
            <Canvas shadows camera={{ position: [12, 8, 12], fov: 50 }}>
              <ambientLight intensity={0.3} />
              <directionalLight castShadow position={[10, 10, 5]} intensity={1.2} />
              <Suspense fallback={null}>
                <OrbitDemo />
              </Suspense>
              <OrbitControls makeDefault />
              <StatsGl />
            </Canvas>
          )}

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900/70 px-3 py-1 rounded text-xs">
            Mode: {simMode === 'launch' ? '🚀 Launch Simulation' : '🛰️ Orbital Mechanics'} | Phase: {phase}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
