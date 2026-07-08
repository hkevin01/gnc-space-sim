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
import { Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
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

function BlackCanvasSanityProbe() {
  const cubeRef = useRef<THREE.Mesh | null>(null)
  const { camera, gl, size } = useThree()

  useEffect(() => {
    // Keep projection and drawing buffer in sync with layout changes.
    const safeWidth = Math.max(1, size.width)
    const safeHeight = Math.max(1, size.height)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = safeWidth / safeHeight
      camera.updateProjectionMatrix()
    }
    gl.setSize(safeWidth, safeHeight, false)

    // Ensure the startup camera actually points at the scene origin.
    if (camera.position.lengthSq() < 1e-6) {
      camera.position.set(0.42, 0.08, 0.22)
    }
    camera.lookAt(0, 0, 0)
  }, [camera, gl, size.height, size.width])

  useFrame((_state, delta) => {
    if (!cubeRef.current) return
    cubeRef.current.rotation.x += delta * 0.8
    cubeRef.current.rotation.y += delta * 1.15
  })

  return (
    <mesh ref={cubeRef} position={[0, 0, 0]} frustumCulled={false} renderOrder={998}>
      <boxGeometry args={[0.05, 0.05, 0.05]} />
      <meshStandardMaterial color="#4ade80" emissive="#052e16" emissiveIntensity={0.6} />
    </mesh>
  )
}

function RenderHealthProbe() {
  const frameCountRef = useRef(0)
  const startRef = useRef(performance.now())
  const [fps, setFps] = useState(0)
  const [meshVisible, setMeshVisible] = useState(false)
  const [drawCalls, setDrawCalls] = useState(0)
  const [triangles, setTriangles] = useState(0)
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 0, 0])
  const [originDistance, setOriginDistance] = useState(0)
  const [visibilityState, setVisibilityState] = useState<string>(document.visibilityState)
  const [hasFocus, setHasFocus] = useState<boolean>(document.hasFocus())
  const [contextLost, setContextLost] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const [lastError, setLastError] = useState<string>('none')
  const [contextAlpha, setContextAlpha] = useState<string>('unknown')
  const [originNdc, setOriginNdc] = useState<{ x: number; y: number; z: number } | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { camera, gl } = useThree()

  useEffect(() => {
    const onVisibility = () => {
      setVisibilityState(document.visibilityState)
      setHasFocus(document.hasFocus())
    }
    const onFocus = () => setHasFocus(true)
    const onBlur = () => setHasFocus(false)

    const onWindowError = (event: ErrorEvent) => {
      setErrorCount((count) => count + 1)
      setLastError(event.message || 'window error')
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrorCount((count) => count + 1)
      const reason = typeof event.reason === 'string'
        ? event.reason
        : event.reason?.message || 'unhandled rejection'
      setLastError(reason)
    }

    const onContextLost = () => {
      setContextLost(true)
    }

    const onContextRestored = () => {
      setContextLost(false)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    gl.domElement.addEventListener('webglcontextlost', onContextLost)
    gl.domElement.addEventListener('webglcontextrestored', onContextRestored)

    const ctxAttrs = gl.getContextAttributes()
    setContextAlpha(ctxAttrs?.alpha === undefined ? 'unknown' : ctxAttrs.alpha ? 'true' : 'false')

    // Keep cumulative render stats to avoid per-frame reset ambiguity during debugging.
    gl.info.autoReset = false

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      gl.domElement.removeEventListener('webglcontextlost', onContextLost)
      gl.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      gl.info.autoReset = true
    }
  }, [gl])

  useFrame(() => {
    frameCountRef.current += 1

    const now = performance.now()
    const elapsedMs = now - startRef.current
    if (elapsedMs >= 1000) {
      const computedFps = Math.round((frameCountRef.current * 1000) / elapsedMs)
      setFps(computedFps)
      frameCountRef.current = 0
      startRef.current = now

      const renderInfo = gl.info.render
      setDrawCalls(renderInfo.calls)
      setTriangles(renderInfo.triangles)

      const worldPos = new THREE.Vector3()
      camera.getWorldPosition(worldPos)
      setCameraPos([worldPos.x, worldPos.y, worldPos.z])
      setOriginDistance(worldPos.length())

      const probe = new THREE.Vector3(0, 0, 0).project(camera)
      setOriginNdc({ x: probe.x, y: probe.y, z: probe.z })
      if (meshRef.current) {
        setMeshVisible(meshRef.current.visible)
      }
    }
  })

  return (
    <>
      {/* Always-on fallback mesh near origin to validate draw/material path. */}
      <mesh ref={meshRef} position={[0, 0, 0]} frustumCulled={false} renderOrder={999}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshBasicMaterial color="#00ff88" toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>

      <Html position={[0.08, 0.08, 0]} transform={false} prepend zIndexRange={[1000, 0]}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: 1.4,
            color: '#d1fae5',
            background: 'rgba(0,0,0,0.82)',
            border: '1px solid rgba(16,185,129,0.7)',
            borderRadius: '6px',
            padding: '6px 8px',
            minWidth: '220px',
            pointerEvents: 'none',
            whiteSpace: 'pre-line',
          }}
          aria-label="Render health overlay"
        >
          {[
            `r3f fps: ${fps}`,
            `canvas: ${gl.domElement.width}x${gl.domElement.height}`,
            `draw calls: ${drawCalls} | triangles: ${triangles}`,
            `fallback mesh visible: ${meshVisible ? 'yes' : 'no'}`,
            `visibility: ${visibilityState} | focus: ${hasFocus ? 'yes' : 'no'}`,
            `ctx alpha: ${contextAlpha}`,
            `webgl context lost: ${contextLost ? 'yes' : 'no'}`,
            `runtime errors: ${errorCount} | last: ${lastError}`,
            `camera pos: ${cameraPos.map((value) => value.toFixed(2)).join(', ')} | |cam|=${originDistance.toFixed(2)}`,
            originNdc
              ? `origin ndc: ${originNdc.x.toFixed(2)}, ${originNdc.y.toFixed(2)}, ${originNdc.z.toFixed(2)}`
              : 'origin ndc: pending',
          ].join('\n')}
        </div>
      </Html>
    </>
  )
}

/**
 * Main Launch Simulation Container
 *
 * Combines the 3D visualization with comprehensive scientific displays
 */
export function LaunchSimulation({ selectedMission, currentPhase }: LaunchSimulationProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const orbitControlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null)
  const pendingViewTargetRef = useRef<[number, number, number] | null>(null)
  const hasLockedInitialViewRef = useRef(false)
  const [cameraMode, setCameraMode] = useState<'follow' | 'free'>('free')
  const [selectedTarget, setSelectedTarget] = useState<LaunchViewTarget>('HOME')
  const [referenceFrame, setReferenceFrame] = useState<LiveReferenceFrame | null>(null)
  const isLaunched = useLaunchControl((state) => state.isLaunched)

  useEffect(() => {
    if (isLaunched) {
      setCameraMode('follow')
    }
  }, [isLaunched])

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
      return {
        label: 'Home',
        dataSource: 'launch frame',
        target: [0, 0, 0] as [number, number, number],
        targetLabel: 'Earth-centered origin',
      }
    }

    if (selectedTarget === 'SOLAR_VIEW') {
      return {
        label: 'Solar View',
        dataSource: 'condensed orbital model',
        target: [0, 0, 0] as [number, number, number],
        targetLabel: 'Sun-centered overview origin',
      }
    }

    return {
      label: selectedTarget,
      dataSource: 'condensed orbital model',
      target: getBodyPositionRelativeToCenter(selectedTarget, 'EARTH', 0),
      targetLabel: `${selectedTarget} focus point`,
    }
  }, [selectedTarget])

  const setView = useCallback((position: [number, number, number], target: [number, number, number]) => {
    if (!cameraRef.current) return

    cameraRef.current.position.set(position[0], position[1], position[2])
    cameraRef.current.lookAt(target[0], target[1], target[2])
    pendingViewTargetRef.current = target

    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(target[0], target[1], target[2])
      orbitControlsRef.current.update()
    }
  }, [])

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
          <div className="fw-semibold scene-heading">Launch Simulation</div>
          <div className="scene-subheading">Mission: {selectedMission}</div>
        </div>
        <div className="d-flex flex-column align-items-start align-items-lg-end gap-2 w-100 w-lg-auto">
          <div className="scene-meta-chip" aria-label="Current mission phase">
            <span className="scene-meta-label">Phase</span>
            <span className="scene-meta-value">{currentPhase?.name || 'Pre-Launch'}</span>
          </div>
          <div className="scene-meta-chip scene-meta-chip-wide" aria-label="Current camera frame metadata">
            <span className="scene-meta-label">View</span>
            <span className="scene-meta-value">{selectedTelemetry.label}</span>
            <span className="scene-meta-separator" aria-hidden="true">|</span>
            <span className="scene-meta-label">Source</span>
            <span className="scene-meta-value">{selectedTelemetry.dataSource}</span>
            <span className="scene-meta-separator" aria-hidden="true">|</span>
            <span className="scene-meta-label">Target</span>
            <span className="scene-meta-value">
              {selectedTelemetry.targetLabel}
              {' '}
              ({selectedTelemetry.target.map((value) => value.toFixed(2)).join(', ')})
            </span>
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
        key="launch-sim-canvas-debug-v2"
        frameloop="always"
        gl={(defaults) => {
          // Build renderer with explicit params once so context behavior is stable across reloads.
          const renderer = new THREE.WebGLRenderer({
            ...(defaults as THREE.WebGLRendererParameters),
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          })
          renderer.setClearColor(0x000000, 1)
          renderer.shadowMap.enabled = false
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
          renderer.autoClear = true
          return renderer
        }}
        camera={{
          // Tilted overview gives a city-view style oblique read on the solar system.
          position: INITIAL_LAUNCH_VIEW.position,
          fov: 60,
          near: 0.001,
          far: 2500
        }}
        style={{ background: '#000000', width: '100%', height: '100%' }}
        className="scene-canvas"
        onCreated={({ gl, camera, invalidate }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera

          if (!hasLockedInitialViewRef.current) {
            const initialPose = computeLaunchHomePose()
            camera.position.set(initialPose.position[0], initialPose.position[1], initialPose.position[2])
            camera.lookAt(initialPose.target[0], initialPose.target[1], initialPose.target[2])
            if (camera instanceof THREE.PerspectiveCamera) {
              camera.updateProjectionMatrix()
            }
            pendingViewTargetRef.current = initialPose.target
            hasLockedInitialViewRef.current = true
          }

          // Force an initial render tick after layout settles.
          window.requestAnimationFrame(() => {
            const rect = gl.domElement.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
              gl.setSize(rect.width, rect.height, false)
            }
            invalidate()
          })

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

        <BlackCanvasSanityProbe />

        <RenderHealthProbe />

        <LaunchDemo
          selectedMission={selectedMission}
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
