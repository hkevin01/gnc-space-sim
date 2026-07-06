/**
 * ID: SSIM-LAUNCHSIM-001
 * Requirement: Render the full SLS mission simulation: 3D WebGL canvas at
 *   correct scale + GNC telemetry overlay, wired to the selected mission config.
 * Purpose: Top-level container that composes LaunchDemo (physics + 3D) and
 *   GNCPanel (telemetry readout) so the UI layer stays thin and testable.
 * Rationale: Separating canvas setup (camera, lights, OrbitControls) from
 *   guidance/integration logic means each can be tested independently.
 *   Camera near-plane = 0.0001 prevents Z-fighting at the ~0.159 unit Earth radius.
 * Inputs: selectedMission (string ID), currentPhase (mission progress object)
 * Outputs: JSX – Canvas + GNCPanel; side-effects: sets vehicleState via callback
 * Preconditions: @react-three/fiber Canvas must be supported by the runtime browser.
 * Assumptions: Scene units are millions of km (1 unit = 1×10⁶ km) per SolarSystem.tsx.
 *   Camera placed at [0.35, 0.05, 0.15] to frame Earth visual sphere (r ≈ 0.159 units).
 * Failure Modes: WebGL context loss → blank canvas; caught by React error boundary in App.tsx.
 * Verification: Manual smoke test; slsMockSimulation.spec.ts for state data contract.
 * References: LaunchDemo.tsx SSIM-LAUNCHDEMO-001; SolarSystem.tsx SSIM-SOLARSYS-001.
 */
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useCallback, useRef, useState } from 'react'
import { LaunchDemo } from './LaunchDemo'
import { MissionEvent } from './MissionTypes'
import * as THREE from 'three'
import { getBodyPositionRelativeToCenter, type SolarBodyName } from './SolarSystem'

interface LaunchSimulationProps {
  selectedMission: string
  currentPhase: {
    progress: number
    timeInPhase: number
    name: string
    description: string
    duration: number
    requirements: string[]
    events: MissionEvent[]
  } | null
}

/**
 * Main Launch Simulation Container
 *
 * Combines the 3D visualization with comprehensive scientific displays
 */
export function LaunchSimulation({ selectedMission, currentPhase }: LaunchSimulationProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const orbitControlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null)
  const [cameraMode, setCameraMode] = useState<'follow' | 'free'>('follow')

  const getPlanetView = useCallback((bodyName: SolarBodyName) => {
    const target = getBodyPositionRelativeToCenter(bodyName, 'EARTH', 0)
    const radialDistance = Math.max(2.5, Math.hypot(target[0], target[1], target[2]) * 0.35)

    return {
      target,
      position: [
        target[0] + radialDistance,
        target[1] + radialDistance * 0.3,
        target[2] + radialDistance,
      ] as [number, number, number],
    }
  }, [])

  const setView = useCallback((position: [number, number, number], target: [number, number, number]) => {
    if (!cameraRef.current || !orbitControlsRef.current) return

    cameraRef.current.position.set(position[0], position[1], position[2])
    orbitControlsRef.current.target.set(target[0], target[1], target[2])
    cameraRef.current.lookAt(target[0], target[1], target[2])
    orbitControlsRef.current.update()
  }, [])

  const snapHome = useCallback(() => {
    setCameraMode('free')
    setView([0.35, 0.05, 0.15], [0, 0, 0])
  }, [setView])

  const snapSolarView = useCallback(() => {
    setCameraMode('free')
    setView([1200, 320, 1200], [0, 0, 0])
  }, [setView])

  const snapPlanet = useCallback((bodyName: SolarBodyName) => {
    setCameraMode('free')
    const view = getPlanetView(bodyName)
    setView(view.position, view.target)
  }, [getPlanetView, setView])

  return (
    <div className="app-surface overflow-hidden p-2 p-md-3 d-flex flex-column flex-grow-1 scene-surface">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 px-2 pb-3 text-white small">
        <div>
          <div className="fw-semibold">Launch Simulation</div>
          <div className="text-body-secondary">Mission: {selectedMission}</div>
        </div>
        <div className="d-flex flex-column align-items-start align-items-lg-end gap-2 w-100 w-lg-auto">
          <div className="text-body-secondary">
            Phase: {currentPhase?.name || 'Pre-Launch'}
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button onClick={snapHome} className="btn btn-outline-light btn-sm touch-target">Home</button>
            <button onClick={snapSolarView} className="btn btn-outline-info btn-sm touch-target">Solar View</button>
            <button onClick={() => snapPlanet('SUN')} className="btn btn-outline-warning btn-sm touch-target">Sun</button>
            <button onClick={() => snapPlanet('EARTH')} className="btn btn-outline-primary btn-sm touch-target">Earth</button>
            <button onClick={() => snapPlanet('MARS')} className="btn btn-outline-danger btn-sm touch-target">Mars</button>
            <button onClick={() => snapPlanet('JUPITER')} className="btn btn-outline-secondary btn-sm touch-target">Jupiter</button>
            <button
              onClick={() => setCameraMode((mode) => (mode === 'free' ? 'follow' : 'free'))}
              className={`btn btn-sm touch-target ${cameraMode === 'free' ? 'btn-warning' : 'btn-outline-secondary'}`}
            >
              {cameraMode === 'free' ? 'Follow Launch' : 'Free Explore'}
            </button>
          </div>
        </div>
      </div>

      <Canvas
        camera={{
          // EARTH_RADIUS_SCENE ≈ 0.159 units (visual Earth sphere radius).
          // Camera positioned radially outward from Earth surface where rocket starts.
          // x=0.35 is just outside Earth visual sphere; y/z offset gives oblique view.
          position: [0.35, 0.05, 0.15],
          fov: 60,
          near: 0.0001,
          far: 50000
        }}
        style={{ background: '#000011', width: '100%', height: '100%' }}
        className="scene-canvas"
        onCreated={({ gl, camera }) => {
          // Favor interaction smoothness over expensive high-DPI/shadow rendering.
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
          gl.shadowMap.enabled = false
          cameraRef.current = camera as THREE.PerspectiveCamera

          // Add context loss handling
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            console.warn('WebGL context lost, preventing default behavior')
            event.preventDefault()
          })

          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored')
          })
        }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <LaunchDemo
          timeMultiplier={100}
          showTrajectory={true}
          cameraMode={cameraMode}
          onCameraRef={(ref) => {
            orbitControlsRef.current = ref.current
          }}
        />

        {/* OrbitControls is managed inside LaunchDemo for camera follow */}
      </Canvas>
    </div>
  )
}
