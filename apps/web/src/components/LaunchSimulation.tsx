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
import { useCallback, useMemo, useRef, useState } from 'react'
import { LaunchDemo } from './LaunchDemo'
import { MissionEvent } from './MissionTypes'
import * as THREE from 'three'
import {
  getBodyPositionRelativeToCenter,
  getBodySceneRadius,
  getMaxHeliocentricOrbitRadius,
  type SolarBodyName,
} from './SolarSystem'
import {
  buildBodyLookup,
  computeSolarOverviewPose,
  computePlanetOverviewPose,
  getBodyPositionInReferenceFrame,
  type Vec3,
} from '../utils/orbitalReferenceFrame'

type LaunchViewTarget = 'HOME' | 'SOLAR_VIEW' | 'SUN' | 'EARTH' | 'MARS' | 'JUPITER'

const READABLE_SOLAR_DISTANCE_SCALE = 8

const OUTER_PLANET_LEGEND = [
  { name: 'Mars', color: '#c85d4b' },
  { name: 'Jupiter', color: '#d9b38c' },
  { name: 'Saturn', color: '#e9d39a' },
  { name: 'Uranus', color: '#7dd3fc' },
  { name: 'Neptune', color: '#60a5fa' },
]

function computeLaunchHomePose() {
  return {
    target: [0, 0, 0] as [number, number, number],
    distance: 0.48,
    position: [0.42, 0.08, 0.22] as [number, number, number],
  }
}

function computeLaunchSolarOverviewPose() {
  const condensedMaxOrbitRadius = getMaxHeliocentricOrbitRadius() / READABLE_SOLAR_DISTANCE_SCALE
  const distance = Math.max(condensedMaxOrbitRadius * 0.72, 48)

  return {
    target: [0, 0, 0] as [number, number, number],
    distance,
    position: [distance, distance * 0.24, distance * 0.92] as [number, number, number],
  }
}

function computeLaunchPlanetOverviewPose(target: [number, number, number], sceneRadius: number, orbitSpan: number) {
  const distance = Math.max(sceneRadius * 24, orbitSpan * 0.26, 7)

  return {
    target,
    distance,
    position: [
      target[0] + distance * 0.58,
      target[1] + distance * 0.24,
      target[2] + distance * 0.9,
    ] as [number, number, number],
  }
}

const INITIAL_SOLAR_VIEW = computeLaunchSolarOverviewPose()

interface LiveReferenceFrame {
  positions: Array<{ name: SolarBodyName; position: Vec3 }>
  centerOn: SolarBodyName
  dataSource: 'nasa' | 'calculated' | 'mixed'
  loading: boolean
}

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
  const [cameraMode, setCameraMode] = useState<'follow' | 'free'>('free')
  const [selectedTarget, setSelectedTarget] = useState<LaunchViewTarget>('SOLAR_VIEW')
  const [referenceFrame, setReferenceFrame] = useState<LiveReferenceFrame | null>(null)

  const getPlanetView = useCallback((bodyName: SolarBodyName) => {
    const liveFrame = referenceFrame

    if (liveFrame?.positions.length) {
      const lookup = buildBodyLookup(liveFrame.positions)
      const liveTarget = getBodyPositionInReferenceFrame(bodyName, liveFrame.centerOn, lookup)

      if (liveTarget) {
        const readableTarget: [number, number, number] = [
          liveTarget[0],
          liveTarget[1],
          liveTarget[2],
        ]
        return computeLaunchPlanetOverviewPose(
          readableTarget,
          getBodySceneRadius(bodyName),
          getMaxHeliocentricOrbitRadius() / READABLE_SOLAR_DISTANCE_SCALE,
        )
      }
    }

    const target = getBodyPositionRelativeToCenter(bodyName, 'EARTH', 0)
    const readableTarget: [number, number, number] = [
      target[0] / READABLE_SOLAR_DISTANCE_SCALE,
      target[1] / READABLE_SOLAR_DISTANCE_SCALE,
      target[2] / READABLE_SOLAR_DISTANCE_SCALE,
    ]
    return computeLaunchPlanetOverviewPose(
      readableTarget,
      getBodySceneRadius(bodyName),
      getMaxHeliocentricOrbitRadius() / READABLE_SOLAR_DISTANCE_SCALE,
    )
  }, [referenceFrame])

  const selectedTelemetry = useMemo(() => {
    if (selectedTarget === 'HOME') {
      return { label: 'Home', dataSource: 'launch frame', target: [0, 0, 0] as [number, number, number] }
    }

    if (selectedTarget === 'SOLAR_VIEW') {
      return { label: 'Solar View', dataSource: 'condensed orbital model', target: [0, 0, 0] as [number, number, number] }
    }

    return {
      label: selectedTarget,
      dataSource: 'condensed orbital model',
      target: getBodyPositionRelativeToCenter(selectedTarget, 'EARTH', 0),
    }
  }, [selectedTarget])

  const setView = useCallback((position: [number, number, number], target: [number, number, number]) => {
    if (!cameraRef.current || !orbitControlsRef.current) return

    cameraRef.current.position.set(position[0], position[1], position[2])
    orbitControlsRef.current.target.set(target[0], target[1], target[2])
    cameraRef.current.lookAt(target[0], target[1], target[2])
    orbitControlsRef.current.update()
  }, [])

  const snapHome = useCallback(() => {
    setCameraMode('free')
    setSelectedTarget('HOME')
    const pose = computeLaunchHomePose()
    setView(pose.position, pose.target)
  }, [setView])

  const snapSolarView = useCallback(() => {
    setCameraMode('free')
    setSelectedTarget('SOLAR_VIEW')
    const pose = computeLaunchSolarOverviewPose()
    setView(pose.position, pose.target)
  }, [setView])

  const snapPlanet = useCallback((bodyName: SolarBodyName) => {
    setCameraMode('free')
    setSelectedTarget(bodyName as LaunchViewTarget)
    const view = getPlanetView(bodyName)
    setView(view.position, view.target)
  }, [getPlanetView, setView])

  const getTargetButtonClass = useCallback((target: LaunchViewTarget, activeClass: string, inactiveClass: string) => {
    return `btn btn-sm touch-target ${selectedTarget === target ? activeClass : inactiveClass}`
  }, [selectedTarget])

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
          <div className="text-body-secondary small">
            View: {selectedTelemetry.label} · Source: {selectedTelemetry.dataSource} · Target: {selectedTelemetry.target.map((value) => value.toFixed(2)).join(', ')}
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button onClick={snapHome} className={getTargetButtonClass('HOME', 'btn-light', 'btn-outline-light')}>Home</button>
            <button onClick={snapSolarView} className={getTargetButtonClass('SOLAR_VIEW', 'btn-info', 'btn-outline-info')}>Solar View</button>
            <button onClick={() => snapPlanet('SUN')} className={getTargetButtonClass('SUN', 'btn-warning', 'btn-outline-warning')}>Sun</button>
            <button onClick={() => snapPlanet('EARTH')} className={getTargetButtonClass('EARTH', 'btn-primary', 'btn-outline-primary')}>Earth</button>
            <button onClick={() => snapPlanet('MARS')} className={getTargetButtonClass('MARS', 'btn-danger', 'btn-outline-danger')}>Mars</button>
            <button onClick={() => snapPlanet('JUPITER')} className={getTargetButtonClass('JUPITER', 'btn-secondary', 'btn-outline-secondary')}>Jupiter</button>
            <button
              onClick={() => setCameraMode((mode) => (mode === 'free' ? 'follow' : 'free'))}
              className={`btn btn-sm touch-target ${cameraMode === 'free' ? 'btn-warning' : 'btn-outline-secondary'}`}
            >
              {cameraMode === 'free' ? 'Follow Launch' : 'Free Explore'}
            </button>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 rounded-3 border border-white border-opacity-10 bg-dark bg-opacity-25 px-2 py-1 text-body-secondary small">
            <span className="text-uppercase fw-semibold text-white-50">Outer planet index</span>
            {OUTER_PLANET_LEGEND.map((planet) => (
              <span key={planet.name} className="d-inline-flex align-items-center gap-1">
                <span
                  aria-hidden="true"
                  className="d-inline-block rounded-circle"
                  style={{ width: '0.55rem', height: '0.55rem', backgroundColor: planet.color }}
                />
                <span>{planet.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Canvas
        camera={{
          // Tilted overview gives a city-view style oblique read on the solar system.
          position: INITIAL_SOLAR_VIEW.position,
          fov: 60,
          near: 0.0001,
          far: 50000
        }}
        style={{ background: '#000000', width: '100%', height: '100%' }}
        className="scene-canvas"
        onCreated={({ gl, camera }) => {
          // Favor interaction smoothness over expensive high-DPI/shadow rendering.
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1))
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
