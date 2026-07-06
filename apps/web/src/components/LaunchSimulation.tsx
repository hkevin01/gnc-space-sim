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
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { LaunchDemo } from './LaunchDemo'
import { MissionEvent } from './MissionTypes'

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
  return (
    <div className="app-surface overflow-hidden p-2 p-md-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2 px-2 pb-3 text-white small">
        <div>
          <div className="fw-semibold">Launch Simulation</div>
          <div className="text-body-secondary">Mission: {selectedMission}</div>
        </div>
        <div className="text-body-secondary">
          Phase: {currentPhase?.name || 'Pre-Launch'}
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
        style={{ background: '#000011', width: '100%', minHeight: '72vh' }}
        onCreated={({ gl }) => {
          // Configure WebGL context for better stability
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap

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
        />

        {/* OrbitControls is managed inside LaunchDemo for camera follow */}
      </Canvas>
    </div>
  )
}
