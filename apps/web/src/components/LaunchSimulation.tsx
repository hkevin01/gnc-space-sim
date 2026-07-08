/**
 * ID: SSIM-LAUNCHSIM-001
 * Requirement: Render the full SLS mission simulation: 3D WebGL canvas at
 *   correct scale + GNC telemetry overlay, wired to the selected mission config.
 * Purpose: Top-level container that composes LaunchDemo (physics + 3D) and
 *   GNCPanel (telemetry readout) so the UI layer stays thin and testable.
 * Rationale: Separating canvas setup (camera, lights, OrbitControls) from
 *   guidance/integration logic means each can be tested independently.
 * References: LaunchDemo.tsx SSIM-LAUNCHDEMO-001; SolarSystem.tsx SSIM-SOLARSYS-001.
 */
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  getBodyPositionInReferenceFrame,
  type Vec3,
} from '../utils/orbitalReferenceFrame'
import { useLaunchControl } from '../state/launchControlStore'

type LaunchViewTarget =
  | 'HOME'
  | 'SOLAR_VIEW'
  | 'SUN'
  | 'MERCURY'
  | 'VENUS'
  | 'EARTH'
  | 'MARS'
  | 'JUPITER'
  | 'SATURN'
  | 'URANUS'
  | 'NEPTUNE'

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

function computeLaunchPlanetOverviewPose(
  target: [number, number, number],
  sceneRadius: number,
  orbitSpan: number,
) {
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

const INITIAL_LAUNCH_VIEW = computeLaunchHomePose()

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

export function LaunchSimulation({ selectedMission, currentPhase }: LaunchSimulationProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const orbitControlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null)
  const pendingViewTargetRef = useRef<[number, number, number] | null>(null)
  const [cameraMode, setCameraMode] = useState<'follow' | 'free'>('free')
  const [selectedTarget, setSelectedTarget] = useState<LaunchViewTarget>('HOME')
  const [referenceFrame, setReferenceFrame] = useState<LiveReferenceFrame | null>(null)
  const isLaunched = useLaunchControl((state) => state.isLaunched)
  const launchTime = useLaunchControl((state) => state.launchTime)

  useEffect(() => {
    if (isLaunched) setCameraMode('follow')
  }, [isLaunched])

  const getPlanetView = useCallback(
    (bodyName: SolarBodyName) => {
      if (referenceFrame?.positions.length) {
        const lookup = buildBodyLookup(referenceFrame.positions)
        const liveTarget = getBodyPositionInReferenceFrame(bodyName, referenceFrame.centerOn, lookup)
        if (liveTarget) {
          const t: [number, number, number] = [liveTarget[0], liveTarget[1], liveTarget[2]]
          return computeLaunchPlanetOverviewPose(
            t,
            getBodySceneRadius(bodyName),
            getMaxHeliocentricOrbitRadius() / READABLE_SOLAR_DISTANCE_SCALE,
          )
        }
      }
      const raw = getBodyPositionRelativeToCenter(bodyName, 'EARTH', 0)
      const t: [number, number, number] = [raw[0], raw[1], raw[2]]
      return computeLaunchPlanetOverviewPose(
        t,
        getBodySceneRadius(bodyName),
        getMaxHeliocentricOrbitRadius() / READABLE_SOLAR_DISTANCE_SCALE,
      )
    },
    [referenceFrame],
  )

  const selectedTelemetry = useMemo(() => {
    if (selectedTarget === 'HOME') {
      return { label: 'Home', dataSource: 'launch frame', target: [0, 0, 0] as [number, number, number] }
    }
    if (selectedTarget === 'SOLAR_VIEW') {
      return {
        label: 'Solar View',
        dataSource: 'condensed orbital model',
        target: [0, 0, 0] as [number, number, number],
      }
    }
    return {
      label: selectedTarget,
      dataSource: 'condensed orbital model',
      target: getBodyPositionRelativeToCenter(selectedTarget, 'EARTH', 0),
    }
  }, [selectedTarget])

  const setView = useCallback(
    (position: [number, number, number], target: [number, number, number]) => {
      if (!cameraRef.current) return
      cameraRef.current.position.set(position[0], position[1], position[2])
      cameraRef.current.lookAt(target[0], target[1], target[2])
      pendingViewTargetRef.current = target
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(target[0], target[1], target[2])
        orbitControlsRef.current.update()
      }
    },
    [],
  )

  // Sync pending orbit target once controls become available after mount
  useEffect(() => {
    if (!orbitControlsRef.current || !pendingViewTargetRef.current) return
    const [x, y, z] = pendingViewTargetRef.current
    orbitControlsRef.current.target.set(x, y, z)
    orbitControlsRef.current.update()
    pendingViewTargetRef.current = null
  })

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

  const snapPlanet = useCallback(
    (bodyName: SolarBodyName) => {
      setCameraMode('free')
      setSelectedTarget(bodyName as LaunchViewTarget)
      const view = getPlanetView(bodyName)
      setView(view.position, view.target)
    },
    [getPlanetView, setView],
  )

  const btnClass = useCallback(
    (target: LaunchViewTarget, active: string, inactive: string) =>
      `btn btn-sm touch-target ${selectedTarget === target ? active : inactive}`,
    [selectedTarget],
  )

  // Silence linter — setReferenceFrame used when NASA live data is wired
  void setReferenceFrame

  return (
    <div className="app-surface overflow-hidden p-2 p-md-3 d-flex flex-column flex-grow-1 scene-surface">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 px-2 pb-3 text-white small">
        <div>
          <div className="fw-semibold scene-heading">Launch Simulation</div>
          <div className="scene-subheading">Mission: {selectedMission}</div>
        </div>
        <div className="d-flex flex-column align-items-start align-items-lg-end gap-2 w-100 w-lg-auto">
          <div className="scene-meta-chip" aria-label="Current mission phase">
            <span className="scene-meta-label">Phase</span>
            <span className="scene-meta-value">{currentPhase?.name || 'Pre-Launch'}</span>
          </div>
          <div
            className="scene-meta-chip scene-meta-chip-wide"
            aria-label="Current camera frame metadata"
          >
            <span className="scene-meta-label">View</span>
            <span className="scene-meta-value">{selectedTelemetry.label}</span>
            <span className="scene-meta-separator" aria-hidden="true">|</span>
            <span className="scene-meta-label">Source</span>
            <span className="scene-meta-value">{selectedTelemetry.dataSource}</span>
            <span className="scene-meta-separator" aria-hidden="true">|</span>
            <span className="scene-meta-label">Target</span>
            <span className="scene-meta-value">
              {selectedTelemetry.target.map((v) => v.toFixed(2)).join(', ')}
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button onClick={snapHome} className={btnClass('HOME', 'btn-light', 'btn-outline-light')}>
              Home
            </button>
            <button
              onClick={snapSolarView}
              className={btnClass('SOLAR_VIEW', 'btn-info', 'btn-outline-info')}
            >
              Solar View
            </button>
            <button
              onClick={() => snapPlanet('SUN')}
              className={btnClass('SUN', 'btn-warning', 'btn-outline-warning')}
            >
              Sun
            </button>
            <button
              onClick={() => snapPlanet('MERCURY')}
              className={btnClass('MERCURY', 'btn-secondary', 'btn-outline-secondary')}
            >
              Mercury
            </button>
            <button
              onClick={() => snapPlanet('VENUS')}
              className={btnClass('VENUS', 'btn-secondary', 'btn-outline-secondary')}
            >
              Venus
            </button>
            <button
              onClick={() => snapPlanet('EARTH')}
              className={btnClass('EARTH', 'btn-primary', 'btn-outline-primary')}
            >
              Earth
            </button>
            <button
              onClick={() => snapPlanet('MARS')}
              className={btnClass('MARS', 'btn-danger', 'btn-outline-danger')}
            >
              Mars
            </button>
            <button
              onClick={() => snapPlanet('JUPITER')}
              className={btnClass('JUPITER', 'btn-secondary', 'btn-outline-secondary')}
            >
              Jupiter
            </button>
            <button
              onClick={() => snapPlanet('SATURN')}
              className={btnClass('SATURN', 'btn-secondary', 'btn-outline-secondary')}
            >
              Saturn
            </button>
            <button
              onClick={() => snapPlanet('URANUS')}
              className={btnClass('URANUS', 'btn-secondary', 'btn-outline-secondary')}
            >
              Uranus
            </button>
            <button
              onClick={() => snapPlanet('NEPTUNE')}
              className={btnClass('NEPTUNE', 'btn-secondary', 'btn-outline-secondary')}
            >
              Neptune
            </button>
            <button
              onClick={() => setCameraMode((m) => (m === 'free' ? 'follow' : 'free'))}
              className={`btn btn-sm touch-target ${cameraMode === 'free' ? 'btn-warning' : 'btn-outline-secondary'}`}
            >
              {cameraMode === 'free' ? 'Follow Launch' : 'Free Explore'}
            </button>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 rounded-3 border border-white border-opacity-25 bg-dark bg-opacity-50 px-2 py-1 scene-legend">
            <span className="text-uppercase fw-semibold scene-legend-title">Outer planet index</span>
            {OUTER_PLANET_LEGEND.map((planet) => (
              <span key={planet.name} className="d-inline-flex align-items-center gap-1">
                <span
                  aria-hidden="true"
                  className="d-inline-block rounded-circle"
                  style={{ width: '0.55rem', height: '0.55rem', backgroundColor: planet.color }}
                />
                <span className="scene-legend-item-label">{planet.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Canvas
        frameloop="always"
        gl={{ antialias: true, alpha: false }}
        camera={{
          position: INITIAL_LAUNCH_VIEW.position,
          fov: 60,
          near: 0.001,
          far: 12000,
        }}
        style={{ background: '#000000' }}
        className="scene-canvas"
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 1)
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1))
          gl.shadowMap.enabled = false
          cameraRef.current = camera as THREE.PerspectiveCamera
          camera.position.set(
            INITIAL_LAUNCH_VIEW.position[0],
            INITIAL_LAUNCH_VIEW.position[1],
            INITIAL_LAUNCH_VIEW.position[2],
          )
          camera.lookAt(0, 0, 0)
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.updateProjectionMatrix()
          }
        }}
      >
        <LaunchDemo
          selectedMission={selectedMission}
          timeMultiplier={100}
          showTrajectory={true}
          cameraMode={cameraMode}
          allowAutoEarthResnap={selectedTarget === 'HOME' || selectedTarget === 'EARTH'}
          onCameraRef={(ref) => {
            orbitControlsRef.current = ref.current
          }}
        />
      </Canvas>
    </div>
  )
}
