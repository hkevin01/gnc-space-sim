import { MissionPanel } from '@gnc/ui'
import { OrbitControls, StatsGl } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LaunchSimulation } from './components/LaunchSimulation'
import { OrbitDemo } from './components/OrbitDemo'
import { SimpleSLSDemo } from './components/SimpleSLSDemo'
import { TrajectoryPlanningDemo } from './components/TrajectoryPlanningDemo'
import { useLaunchControl } from './state/launchControlStore'
import { useMissionStore, type MissionState } from './state/missionStore'

export default function App() {
  const phase = useMissionStore((s: MissionState) => s.phase)
  const setPhase = useMissionStore((s: MissionState) => s.setPhase)
  const [simMode, setSimMode] = useState<'launch' | 'orbit' | 'trajectory' | 'sls'>('sls')

  // Launch control state
  const { launchTime, initiateLaunch, resetLaunch } = useLaunchControl()

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-[320px_1fr] grid-rows-[1fr] h-screen">
        <aside className="border-r border-zinc-700 p-3 overflow-auto bg-zinc-950">
          <h1 className="text-lg font-semibold mb-3">GNC Space Sim</h1>

          {/* Simulation Mode Selector */}
          <div className="mb-4 p-3 bg-zinc-800 rounded">
            <h3 className="text-sm font-semibold mb-2 text-zinc-300">Simulation Mode</h3>
            <div className="flex gap-2 flex-wrap">
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
              <button
                onClick={() => setSimMode('trajectory')}
                className={`px-3 py-1 text-xs rounded ${
                  simMode === 'trajectory'
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                🎯 Trajectory
              </button>
              <button
                onClick={() => setSimMode('sls')}
                className={`px-3 py-1 text-xs rounded ${
                  simMode === 'sls'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                🌙 SLS Artemis
              </button>
            </div>
          </div>

          {/* Launch Control Panel */}
          {simMode === 'launch' && (
            <div className="mb-4 p-3 bg-red-900/30 rounded border border-red-700">
              <h3 className="text-sm font-semibold mb-2 text-red-400">🚀 Launch Control</h3>
              <div className="space-y-2">
                <div className="text-xs text-zinc-300">
                  Mission Time: T{launchTime < 0 ? `${launchTime.toFixed(1)}s` : `+${launchTime.toFixed(1)}s`}
                </div>
                <div className="flex gap-2">
                  {launchTime < 0 ? (
                    <button
                      onClick={initiateLaunch}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm shadow-lg transition-colors flex-1"
                    >
                      🚀 INITIATE LAUNCH
                    </button>
                  ) : (
                    <button
                      onClick={resetLaunch}
                      className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors flex-1"
                    >
                      🔄 RESET MISSION
                    </button>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-2">
                  {launchTime < 0
                    ? 'All systems nominal. Ready for launch.'
                    : 'Mission in progress. Monitor telemetry on the right.'
                  }
                </div>
              </div>
            </div>
          )}

          <MissionPanel phase={phase} onChange={setPhase} />

          {/* GNC Information Panel */}
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <h3 className="text-sm font-semibold mb-2 text-yellow-400">GNC Systems</h3>
            <div className="text-xs space-y-2 text-zinc-300">
              {simMode === 'sls' ? (
                <>
                  <div><strong>🚀 Vehicle:</strong> SLS Block 1</div>
                  <div><strong>🎯 Mission:</strong> Artemis II Lunar Flyby</div>
                  <div><strong>🌙 Destination:</strong> 10,000 km Lunar Flyby</div>
                  <div className="mt-2 text-zinc-400">
                    NASA's most powerful rocket with twin SRBs and RS-25 engines.
                    First crewed mission beyond Earth orbit since Apollo 17.
                  </div>
                </>
              ) : simMode === 'launch' ? (
                <>
                  <div><strong>🎯 Guidance:</strong> Gravity Turn Algorithm</div>
                  <div><strong>🧭 Navigation:</strong> IMU + GPS Fusion</div>
                  <div><strong>🎮 Control:</strong> TVC + RCS Systems</div>
                  <div className="mt-2 text-zinc-400">
                    Launch from Earth surface through orbital insertion with
                    real-time atmospheric modeling and multi-stage guidance.
                  </div>
                </>
              ) : simMode === 'orbit' ? (
                <>
                  <div><strong>🎯 Guidance:</strong> Hohmann Transfers</div>
                  <div><strong>🧭 Navigation:</strong> Keplerian Elements</div>
                  <div><strong>🎮 Control:</strong> Orbital Maneuvers</div>
                  <div className="mt-2 text-zinc-400">
                    Two-body orbital mechanics with real-time propagation
                    and mission trajectory planning.
                  </div>
                </>
              ) : (
                <>
                  <div><strong>🎯 Guidance:</strong> Enhanced SSSP Algorithm</div>
                  <div><strong>🧭 Navigation:</strong> Graph-Based Planning</div>
                  <div><strong>🎮 Control:</strong> Real-Time Optimization</div>
                  <div className="mt-2 text-zinc-400">
                    Breakthrough SSSP algorithm beating Dijkstra's O(m + n log n)
                    bound for spacecraft trajectory optimization.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Enhanced Trajectory Algorithm Details */}
          {simMode === 'trajectory' && (
            <div className="mt-4 p-3 bg-green-900/30 rounded border border-green-700">
              <h3 className="text-sm font-semibold mb-2 text-green-400">Enhanced SSSP Algorithm</h3>
              <div className="text-xs space-y-2 text-zinc-300">
                <div><strong>🔬 Research:</strong> Stanford, Tsinghua, Max Planck</div>
                <div><strong>⚡ Performance:</strong> 2-4x faster than Dijkstra</div>
                <div><strong>🏗️ Method:</strong> Hierarchical decomposition</div>
                <div><strong>📊 Complexity:</strong> Near-linear time bounds</div>
                <div><strong>🎯 Application:</strong> Real-time trajectory planning</div>
                <div className="mt-2 text-xs text-green-300 bg-green-900/20 p-2 rounded">
                  First deterministic SSSP algorithm to break the O(m + n log n)
                  barrier for sparse directed graphs. Enables real-time replanning
                  for spacecraft trajectory optimization.
                </div>
              </div>
            </div>
          )}

          {/* Scientific Formulas */}
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <h3 className="text-sm font-semibold mb-2 text-cyan-400">Physics Formulas</h3>
            <div className="text-xs space-y-1 text-zinc-300 font-mono">
              {simMode === 'trajectory' ? (
                <>
                  <div>O(m + n log n) → O(m + n) (Enhanced SSSP)</div>
                  <div>d[v] = min(d[u] + w(u,v)) (Relaxation)</div>
                  <div>H = {'{'}h₁, h₂, ..., hₖ{'}'} (Hop Sets)</div>
                  <div>deg(G) ≤ β (Bounded Degree)</div>
                  <div>T(n) = O(m + n √log log n) (Query Time)</div>
                  <div>S(n) = O(n √log log n) (Space)</div>
                </>
              ) : (
                <>
                  <div>F = ma (Newton's 2nd Law)</div>
                  <div>F_g = GMm/r² (Gravity)</div>
                  <div>v_orbit = √(μ/r) (Orbital Velocity)</div>
                  <div>Δv = I_sp × g₀ × ln(m₀/m_f) (Rocket Equation)</div>
                  <div>e = (r_a - r_p)/(r_a + r_p) (Eccentricity)</div>
                  <div>T = 2π√(a³/μ) (Orbital Period)</div>
                </>
              )}
            </div>
          </div>
        </aside>

        <main className="relative">
          {simMode === 'launch' ? (
            <LaunchSimulation />
          ) : simMode === 'sls' ? (
            <SimpleSLSDemo />
          ) : simMode === 'orbit' ? (
            <Canvas shadows camera={{ position: [12, 8, 12], fov: 50 }}>
              <ambientLight intensity={0.3} />
              <directionalLight castShadow position={[10, 10, 5]} intensity={1.2} />
              <Suspense fallback={null}>
                <OrbitDemo />
              </Suspense>
              <OrbitControls makeDefault />
              <StatsGl />
            </Canvas>
          ) : (
            <Canvas shadows camera={{ position: [0, 0, 15], fov: 60 }}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1.0} />
              <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4a90e2" />
              <Suspense fallback={null}>
                <TrajectoryPlanningDemo />
              </Suspense>
              <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.05}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={5}
                maxDistance={50}
              />
              <StatsGl />
            </Canvas>
          )}

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900/70 px-3 py-1 rounded text-xs">
            Mode: {simMode === 'launch' ? '🚀 Launch Simulation' : simMode === 'orbit' ? '🛰️ Orbital Mechanics' : '🎯 Trajectory Planning'} | Phase: {phase}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
