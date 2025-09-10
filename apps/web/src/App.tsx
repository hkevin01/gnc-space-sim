import { MissionPanel } from '@gnc/ui'
import { useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LaunchSimulation } from './components/LaunchSimulation'
import { MISSION_SCENARIOS } from './components/MissionTypes'
import { useLaunchControl } from './state/launchControlStore'
import { useMissionStore, type MissionState } from './state/missionStore'
import { EnhancedOrbitalDemo } from './components/EnhancedOrbitalDemo'
import { NasaDemo } from './components/NasaDemo'

export default function App() {
  const phase = useMissionStore((s: MissionState) => s.phase)
  const setPhase = useMissionStore((s: MissionState) => s.setPhase)
  const [selectedMission, setSelectedMission] = useState<string>('earthOrbit')
  const [demoMode, setDemoMode] = useState<'main' | 'orbital' | 'nasa'>('main')

  // Launch control state
  const { launchTime, initiateLaunch, resetLaunch, isLaunched } = useLaunchControl()

  const currentMission = MISSION_SCENARIOS[selectedMission]
  const missionPhases = useMemo(() => currentMission?.phases || [], [currentMission])
  const phaseItems = useMemo(() => missionPhases.map(p => ({ key: p.name, label: p.name })), [missionPhases])

  // Keep sidebar selected phase relevant to selected mission
  useEffect(() => {
    if (phaseItems.length === 0) return
    if (!phaseItems.some(i => i.key === phase)) {
      setPhase(phaseItems[0].key)
    }
  }, [selectedMission, phaseItems, phase, setPhase])


  // Demo mode selector
  if (demoMode === 'orbital') {
    return (
      <ErrorBoundary>
        <div className="relative">
          <button
            onClick={() => setDemoMode('main')}
            className="absolute top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
          >
            ← Back to Main App
          </button>
          <EnhancedOrbitalDemo />
        </div>
      </ErrorBoundary>
    )
  }

  if (demoMode === 'nasa') {
    return (
      <ErrorBoundary>
        <div className="relative">
          <button
            onClick={() => setDemoMode('main')}
            className="absolute top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
          >
            ← Back to Main App
          </button>
          <NasaDemo />
        </div>
      </ErrorBoundary>
    )
  }

  // Calculate current mission phase based on launch time
  const getCurrentMissionPhase = () => {
    if (!isLaunched || launchTime < 0 || missionPhases.length === 0) return null

    let accumulatedTime = 0
    for (const phase of missionPhases) {
      if (launchTime <= accumulatedTime + phase.duration) {
        return {
          ...phase,
          progress: Math.min((launchTime - accumulatedTime) / phase.duration, 1),
          timeInPhase: launchTime - accumulatedTime
        }
      }
      accumulatedTime += phase.duration
    }

    // Mission completed - return final phase with completed status
    const finalPhase = missionPhases[missionPhases.length - 1]
    return {
      ...finalPhase,
      progress: 1,
      timeInPhase: finalPhase.duration,
      completed: true
    }
  }

  const currentPhase = getCurrentMissionPhase()

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-[350px_1fr] grid-rows-[1fr] h-screen">
        <aside className="border-r border-zinc-700 p-3 overflow-auto bg-zinc-950">
          <h1 className="text-lg font-semibold mb-3">GNC Space Simulation</h1>

          {/* Mission Selection */}
          <div className="mb-4 p-3 bg-zinc-800 rounded">
            <h3 className="text-sm font-semibold mb-2 text-zinc-300">Mission Selection</h3>
            <div className="space-y-2">
              {Object.entries(MISSION_SCENARIOS).map(([id, mission]) => (
                <button
                  key={id}
                  onClick={() => setSelectedMission(id)}
                  className={`w-full p-2 text-xs rounded text-left transition-colors ${
                    selectedMission === id
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 border border-zinc-600'
                  }`}
                >
                  <div className="font-semibold">{mission.name}</div>
                  <div className="text-zinc-400 text-xs mt-1">{mission.description}</div>
                  <div className="text-zinc-500 text-xs mt-1">
                    Target: {mission.target} | Duration: {Math.round(mission.duration/3600)}h
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Demo Modes */}
          <div className="mb-4 p-3 bg-purple-900/30 rounded border border-purple-700">
            <h3 className="text-sm font-semibold mb-2 text-purple-400">🌌 Planetary Demos</h3>
            <div className="space-y-2">
              <button
                onClick={() => setDemoMode('orbital')}
                className="w-full p-2 text-xs rounded text-left transition-colors bg-purple-700 text-white hover:bg-purple-600 border border-purple-400"
              >
                <div className="font-semibold">🪐 Enhanced Orbital Mechanics</div>
                <div className="text-purple-200 text-xs mt-1">
                  View planets with realistic rotation, axial tilts, and retrograde motion
                </div>
              </button>
              <button
                onClick={() => setDemoMode('nasa')}
                className="w-full p-2 text-xs rounded text-left transition-colors bg-blue-700 text-white hover:bg-blue-600 border border-blue-400"
              >
                <div className="font-semibold">🛰️ NASA Solar System</div>
                <div className="text-blue-200 text-xs mt-1">
                  Real-time planetary positions using NASA data
                </div>
              </button>
            </div>
          </div>

          {/* Launch Control Panel */}
          <div className="mb-4 p-3 bg-red-900/30 rounded border border-red-700">
            <h3 className="text-sm font-semibold mb-2 text-red-400">🚀 Launch Control</h3>
            <div className="space-y-2">
              <div className="text-xs text-zinc-300">
                Mission: {currentMission.name}
              </div>
              <div className="text-xs text-zinc-300">
                Mission Time: T{launchTime < 0 ? `${launchTime.toFixed(1)}s` : `+${launchTime.toFixed(1)}s`}
              </div>
              {launchTime < 0 && launchTime > -10 && (
                <div className="text-xs text-red-400 font-bold animate-pulse">
                  🔥 COUNTDOWN ACTIVE: {Math.abs(launchTime).toFixed(0)}
                </div>
              )}
              {launchTime >= 0 && launchTime < 60 && (
                <div className="text-xs text-orange-400 font-bold animate-pulse">
                  🚀 LIFTOFF! Rocket ascending...
                </div>
              )}
              {launchTime >= 60 && (
                <div className="text-xs text-blue-400">
                  🛰️ In flight - Mission phase active
                </div>
              )}
              {currentPhase && (
                <div className="text-xs text-cyan-300">
                  Phase: {currentPhase.name} {('completed' in currentPhase && currentPhase.completed) ? '(COMPLETE)' : `(${(currentPhase.progress * 100).toFixed(1)}%)`}
                </div>
              )}
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
                {launchTime < -5
                  ? 'All systems nominal. Ready for launch.'
                  : launchTime < 0
                    ? '🔥 Final countdown sequence initiated! Hold position.'
                    : launchTime < 60
                      ? '🚀 ENGINES IGNITED! Vehicle ascending through atmosphere.'
                      : currentPhase
                        ? ('completed' in currentPhase && currentPhase.completed)
                          ? '🎉 Mission Complete! All objectives achieved.'
                          : currentPhase.description
                        : '🛰️ Mission in progress. Monitoring all systems.'
                }
              </div>
            </div>
          </div>

          {/* Mission Phase Timeline */}
          {isLaunched && currentMission && (
            <div className="mb-4 p-3 bg-blue-900/30 rounded border border-blue-700">
              <h3 className="text-sm font-semibold mb-2 text-blue-400">📋 Mission Phases</h3>
              <div className="space-y-2">
                {missionPhases.map((missionPhase, index) => {
                  let accumulatedTime = 0
                  for (let i = 0; i < index; i++) {
                    accumulatedTime += missionPhases[i].duration
                  }
                  const isActive = currentPhase?.name === missionPhase.name
                  const isCompleted = launchTime > accumulatedTime + missionPhase.duration

                  return (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded border ${
                        isActive
                          ? 'border-blue-400 bg-blue-900/50 text-blue-200'
                          : isCompleted
                            ? 'border-green-600 bg-green-900/30 text-green-300'
                            : 'border-zinc-600 bg-zinc-800/50 text-zinc-400'
                      }`}
                    >
                      <div className="font-semibold">
                        {isCompleted ? '✅' : isActive ? '🔄' : '⏳'} {missionPhase.name}
                      </div>
                      <div className="text-xs mt-1">{missionPhase.description}</div>
                      {isActive && currentPhase && (
                        <div className="mt-1">
                          <div className="bg-zinc-700 rounded-full h-1">
                            <div
                              className="bg-blue-400 h-1 rounded-full transition-all duration-1000"
                              style={{ width: `${currentPhase.progress * 100}%` }}
                            />
                          </div>
                          <div className="text-xs mt-1">
                            {Math.round(currentPhase.timeInPhase)}s / {missionPhase.duration}s
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <MissionPanel phase={phase} onChange={setPhase} items={phaseItems} />

          {/* Mission Information Panel */}
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <h3 className="text-sm font-semibold mb-2 text-yellow-400">Mission Details</h3>
            <div className="text-xs space-y-2 text-zinc-300">
              <div><strong>🚀 Spacecraft:</strong> {currentMission.spacecraft}</div>
              <div><strong>🎯 Target:</strong> {currentMission.target}</div>
              <div><strong>⏱️ Duration:</strong> {Math.round(currentMission.duration/3600)}h</div>
              <div><strong>🛸 ΔV Required:</strong> {currentMission.trajectory.deltaV.toLocaleString()} m/s</div>
              <div className="mt-2 text-zinc-400">
                {currentMission.description}
              </div>

              {currentMission.objectives.length > 0 && (
                <div className="mt-3">
                  <div className="font-semibold text-yellow-400 mb-1">Mission Objectives:</div>
                  {currentMission.objectives.map((obj, i) => (
                    <div key={i} className="text-xs text-zinc-400">• {obj}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GNC Systems Information */}
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <h3 className="text-sm font-semibold mb-2 text-purple-400">GNC Systems Active</h3>
            <div className="text-xs space-y-2 text-zinc-300">
              <div><strong>🎯 Guidance:</strong> Gravity Turn + Trajectory Optimization</div>
              <div><strong>🧭 Navigation:</strong> IMU + GPS + Deep Space Network</div>
              <div><strong>� Control:</strong> TVC + RCS + Reaction Wheels</div>
              <div className="mt-2 text-zinc-400">
                Integrated guidance, navigation, and control systems providing
                autonomous mission execution from launch through all mission phases.
              </div>
            </div>
          </div>

          {/* Physics Formulas */}
          <div className="mt-4 p-3 bg-zinc-900 rounded">
            <h3 className="text-sm font-semibold mb-2 text-cyan-400">Active Formulas</h3>
            <div className="text-xs space-y-1 text-zinc-300 font-mono">
              {currentPhase?.name === 'Launch' || currentPhase?.name === 'Earth Departure' ? (
                <>
                  <div>F = ma (Newton's 2nd Law)</div>
                  <div>F_g = GMm/r² (Gravity)</div>
                  <div>Δv = I_sp × g₀ × ln(m₀/m_f) (Rocket Equation)</div>
                  <div>a = F_thrust/m - g × sin(γ) (Launch Dynamics)</div>
                </>
              ) : currentPhase?.name.includes('Cruise') || currentPhase?.name.includes('Transit') ? (
                <>
                  <div>v_orbit = √(μ/r) (Orbital Velocity)</div>
                  <div>e = (r_a - r_p)/(r_a + r_p) (Eccentricity)</div>
                  <div>T = 2π√(a³/μ) (Orbital Period)</div>
                  <div>Δv = √(μ/r₁) × |√(2r₂/(r₁+r₂)) - 1| (Hohmann)</div>
                </>
              ) : (
                <>
                  <div>r⃗(t) = r⃗₀ + v⃗₀t + ½a⃗t² (Position)</div>
                  <div>v_esc = √(2μ/r) (Escape Velocity)</div>
                  <div>C₃ = v²∞ (Characteristic Energy)</div>
                  <div>TOF = π√(a³/μ) (Transfer Time)</div>
                </>
              )}
            </div>
          </div>
        </aside>

        <main className="relative">
          <LaunchSimulation
            selectedMission={selectedMission}
            currentPhase={currentPhase}
          />

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900/70 px-3 py-1 rounded text-xs">
            Mission: {currentMission.name} | Phase: {currentPhase?.name || 'Pre-Launch'} | Status: {phase}
          </div>

          {/* Real-time Flight Status */}
          {isLaunched && (
            <div className="absolute top-4 right-4 bg-zinc-900/90 p-3 rounded border border-zinc-600 text-xs">
              <h3 className="text-green-400 font-bold mb-2">🛰️ FLIGHT STATUS</h3>
              <div className="space-y-1 text-zinc-300">
                <div>T{launchTime < 0 ? launchTime.toFixed(1) : `+${launchTime.toFixed(1)}`}s</div>
                <div>Mission: {currentMission.name}</div>
                {currentPhase && (
                  <div className="text-cyan-300">
                    {currentPhase.name} ({(currentPhase.progress * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
