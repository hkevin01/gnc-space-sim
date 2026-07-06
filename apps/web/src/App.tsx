import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LaunchSimulation } from './components/LaunchSimulation'
import { MISSION_SCENARIOS } from './components/MissionTypes'
import { useLaunchControl } from './state/launchControlStore'
import { useMissionStore, type MissionState } from './state/missionStore'
import { GNCPanel } from './components/GNCPanel'
import { LaunchPhase, type LaunchState } from '@gnc/core'

const EnhancedOrbitalDemo = lazy(async () => {
  const module = await import('./components/EnhancedOrbitalDemo')
  return { default: module.EnhancedOrbitalDemo }
})

const NasaDemo = lazy(async () => {
  const module = await import('./components/NasaDemo')
  return { default: module.NasaDemo }
})

function DemoLoadingFallback() {
  return (
    <div className="app-surface p-4 text-white">
      <div className="h5 mb-2">Loading demo</div>
      <div className="text-body-secondary">Preparing the 3D scene and controls.</div>
    </div>
  )
}

export default function App() {
  const phase = useMissionStore((s: MissionState) => s.phase)
  const setPhase = useMissionStore((s: MissionState) => s.setPhase)
  const [selectedMission, setSelectedMission] = useState<string>('earthOrbit')
  const [demoMode, setDemoMode] = useState<'main' | 'orbital' | 'nasa'>('main')

  // Launch control state
  const { launchTime, initiateLaunch, resetLaunch, isLaunched } = useLaunchControl()
  const launchTelemetryState: LaunchState = {
    r: [6371000, 0, 50000],
    v: [0, 1500, 200],
    phase: LaunchPhase.STAGE1_BURN,
    mission_time: 45,
    altitude: 50000,
    velocity_magnitude: 1520,
    flight_path_angle: 0.5,
    heading: 1.57,
    mass: 450000,
    thrust: [0, 0, 6000000],
    drag: [0, 0, -50000],
    atmosphere: {
      pressure: 15000,
      density: 0.15,
      temperature: 250,
    },
    guidance: {
      pitch_program: 0.3,
      yaw_program: 1.57,
      throttle: 0.85,
    },
  }

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
        <div className="app-shell container-fluid py-3 py-lg-4">
          <div className="row g-3 mb-3">
            <div className="col-12">
              <div className="app-surface p-3 p-lg-4 d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
                <div>
                  <h1 className="h4 mb-1">Enhanced Orbital Mechanics</h1>
                  <p className="mb-0 text-secondary">Responsive controls and readable layout for orbital visualization.</p>
                </div>
                <button
                  onClick={() => setDemoMode('main')}
                  className="btn btn-outline-light touch-target px-4"
                >
                  Back to Main App
                </button>
              </div>
            </div>
          </div>
          <Suspense fallback={<DemoLoadingFallback />}>
            <EnhancedOrbitalDemo />
          </Suspense>
        </div>
      </ErrorBoundary>
    )
  }

  if (demoMode === 'nasa') {
    return (
      <ErrorBoundary>
        <div className="app-shell container-fluid py-3 py-lg-4">
          <div className="row g-3 mb-3">
            <div className="col-12">
              <div className="app-surface p-3 p-lg-4 d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
                <div>
                  <h1 className="h4 mb-1">NASA Solar System</h1>
                  <p className="mb-0 text-secondary">Responsive controls and readable layout for live planetary views.</p>
                </div>
                <button
                  onClick={() => setDemoMode('main')}
                  className="btn btn-outline-light touch-target px-4"
                >
                  Back to Main App
                </button>
              </div>
            </div>
          </div>
          <Suspense fallback={<DemoLoadingFallback />}>
            <NasaDemo />
          </Suspense>
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
      <div className="app-shell container-fluid py-3 py-lg-4 px-3 px-lg-4">
        <div className="row g-3 align-items-stretch app-main-row">
          <aside className="col-12 col-xl-3 d-flex flex-column gap-3">
            <div className="app-surface p-3 p-lg-4">
              <h1 className="h4 mb-2">GNC Space Simulation</h1>
              <p className="app-muted mb-0">Responsive mission control, 3D launch view, and telemetry cards.</p>
            </div>

            <div className="app-card p-3 p-lg-4">
              <h2 className="h6 mb-3 text-light">Mission Selection</h2>
              <div className="d-grid gap-2">
                {Object.entries(MISSION_SCENARIOS).map(([id, mission]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedMission(id)}
                    className={`btn touch-target text-start p-3 ${
                      selectedMission === id ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                  >
                    <div className="fw-semibold">{mission.name}</div>
                    <div className="small opacity-75 mt-1">{mission.description}</div>
                    <div className="small opacity-50 mt-1">
                      Target: {mission.target} | Duration: {Math.round(mission.duration / 3600)}h
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="app-card p-3 p-lg-4">
              <h2 className="h6 mb-3 text-warning">Launch Control</h2>
              <div className="d-grid gap-2 app-text-xs">
                <div className="text-secondary">Mission: {currentMission.name}</div>
                <div className="text-secondary">
                  Mission Time: T{launchTime < 0 ? `${launchTime.toFixed(1)}s` : `+${launchTime.toFixed(1)}s`}
                </div>
                {launchTime < 0 && launchTime > -10 && <div className="text-danger fw-bold">COUNTDOWN ACTIVE: {Math.abs(launchTime).toFixed(0)}</div>}
                {launchTime >= 0 && launchTime < 60 && <div className="text-warning fw-bold">LIFTOFF! Rocket ascending...</div>}
                {launchTime >= 60 && <div className="text-info">In flight - Mission phase active</div>}
                {currentPhase && (
                  <div className="text-info">
                    Phase: {currentPhase.name} {('completed' in currentPhase && currentPhase.completed) ? '(COMPLETE)' : `(${(currentPhase.progress * 100).toFixed(1)}%)`}
                  </div>
                )}
                <div className="d-grid">
                  {launchTime < 0 ? (
                    <button onClick={initiateLaunch} className="btn btn-danger touch-target fw-bold">
                      INITIATE LAUNCH
                    </button>
                  ) : (
                    <button onClick={resetLaunch} className="btn btn-secondary touch-target fw-bold">
                      RESET MISSION
                    </button>
                  )}
                </div>
                <div className="text-secondary">
                  {launchTime < -5
                    ? 'All systems nominal. Ready for launch.'
                    : launchTime < 0
                      ? 'Final countdown sequence initiated. Hold position.'
                      : launchTime < 60
                        ? 'Engines ignited. Vehicle ascending through atmosphere.'
                        : currentPhase
                          ? ('completed' in currentPhase && currentPhase.completed)
                            ? 'Mission complete. All objectives achieved.'
                            : currentPhase.description
                          : 'Mission in progress. Monitoring all systems.'}
                </div>
              </div>
            </div>

            {isLaunched && currentMission && (
              <div className="app-card p-3 p-lg-4">
                <h2 className="h6 mb-3 text-info">Mission Phases</h2>
                <div className="d-grid gap-2">
                  {missionPhases.map((missionPhase, index) => {
                    let accumulatedTime = 0
                    for (let i = 0; i < index; i++) accumulatedTime += missionPhases[i].duration
                    const isActive = currentPhase?.name === missionPhase.name
                    const isCompleted = launchTime > accumulatedTime + missionPhase.duration

                    return (
                      <div
                        key={index}
                        className={`rounded border p-2 small ${
                          isActive
                            ? 'border-primary bg-primary-subtle text-primary-emphasis'
                            : isCompleted
                              ? 'border-success bg-success-subtle text-success-emphasis'
                              : 'border-secondary bg-dark text-body-secondary'
                        }`}
                      >
                        <div className="fw-semibold">
                          {isCompleted ? '✅' : isActive ? '🔄' : '⏳'} {missionPhase.name}
                        </div>
                        <div className="mt-1">{missionPhase.description}</div>
                        {isActive && currentPhase && (
                          <div className="mt-2">
                            <div className="progress" role="progressbar" aria-valuenow={currentPhase.progress * 100} aria-valuemin={0} aria-valuemax={100}>
                              <div className="progress-bar" style={{ width: `${currentPhase.progress * 100}%` }} />
                            </div>
                            <div className="small mt-1">
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

            <div className="app-card p-3 p-lg-4">
              <h2 className="h6 mb-3 text-purple-300">Planetary Demos</h2>
              <div className="d-grid gap-2">
                <button onClick={() => setDemoMode('orbital')} className="btn btn-outline-light text-start touch-target p-3">
                  <div className="fw-semibold">Enhanced Orbital Mechanics</div>
                  <div className="small opacity-75 mt-1">View planets with realistic rotation, axial tilts, and retrograde motion</div>
                </button>
                <button onClick={() => setDemoMode('nasa')} className="btn btn-outline-info text-start touch-target p-3">
                  <div className="fw-semibold">NASA Solar System</div>
                  <div className="small opacity-75 mt-1">Real-time planetary positions using NASA data</div>
                </button>
              </div>
            </div>
          </aside>

          <main className="col-12 col-xl-6 d-flex">
            <LaunchSimulation
              selectedMission={selectedMission}
              currentPhase={currentPhase}
            />
          </main>

          <aside className="col-12 col-xl-3 d-flex flex-column gap-3">
            <div className="app-card p-3 p-lg-4">
              <h2 className="h6 mb-3 text-success">Flight Status</h2>
              <div className="small text-secondary">
                <div>T{launchTime < 0 ? launchTime.toFixed(1) : `+${launchTime.toFixed(1)}`}s</div>
                <div>Mission: {currentMission.name}</div>
                <div>Phase: {currentPhase?.name || 'Pre-Launch'}</div>
              </div>
            </div>

            <GNCPanel
              launchState={launchTelemetryState}
              selectedMission={selectedMission}
              currentPhase={currentPhase}
            />
          </aside>
        </div>
      </div>
    </ErrorBoundary>
  )
}
