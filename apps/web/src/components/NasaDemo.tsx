/**
 * NASA Demo Component
 * Demonstrates the NASA JPL Horizons API integration with real-time planetary positions
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import * as THREE from 'three'
import {
  NasaSolarSystem,
  SolarSystem,
  getBodyPositionRelativeToCenter,
  getBodySceneRadius,
  getMaxHeliocentricOrbitRadius,
  type SolarBodyName,
} from './SolarSystem'
import type { PlanetPosition } from '../services/planetaryPositionService'
import {
  buildBodyLookup,
  computeBodySnapPose,
  computeSolarOverviewPose,
  getBodyPositionInReferenceFrame,
  type Vec3,
} from '../utils/orbitalReferenceFrame'

interface NasaDemoProps {
  className?: string
}

type NasaViewTarget = 'HOME' | 'SOLAR_VIEW' | 'SUN' | 'EARTH' | 'MARS' | 'JUPITER'

interface ReferenceFrameSnapshot {
  positions: PlanetPosition[]
  centerOn: SolarBodyName
  dataSource: 'nasa' | 'calculated' | 'mixed'
  loading: boolean
}

export function NasaDemo({ className }: NasaDemoProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const orbitControlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null)
  const [useNasaData, setUseNasaData] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [centerOn, setCenterOn] = useState<'SUN' | 'EARTH'>('EARTH')
  const [selectedTarget, setSelectedTarget] = useState<NasaViewTarget>('HOME')
  const [referenceFrame, setReferenceFrame] = useState<ReferenceFrameSnapshot>({
    positions: [],
    centerOn: 'EARTH',
    dataSource: 'calculated',
    loading: true,
  })

  const setView = useCallback((position: [number, number, number], target: [number, number, number]) => {
    const camera = cameraRef.current
    if (camera) {
      camera.position.set(position[0], position[1], position[2])
      camera.lookAt(target[0], target[1], target[2])
      camera.updateProjectionMatrix()
    }

    const controls = orbitControlsRef.current
    if (controls) {
      controls.target.set(target[0], target[1], target[2])
      controls.update()
    }
  }, [])

  const getLiveTargetInCenterFrame = useCallback((body: SolarBodyName): [number, number, number] | null => {
    if (referenceFrame.positions.length === 0) return null

    const lookup = buildBodyLookup(
      referenceFrame.positions.map((planet) => ({
        name: planet.name,
        position: planet.position as Vec3,
      }))
    )

    return getBodyPositionInReferenceFrame(body, referenceFrame.centerOn, lookup)
  }, [referenceFrame.centerOn, referenceFrame.positions])

  const getFallbackTarget = useCallback((body: SolarBodyName) => {
    return getBodyPositionRelativeToCenter(body, centerOn, Date.now() / 1000)
  }, [centerOn])

  const snapHome = useCallback(() => {
    setSelectedTarget('HOME')
    setView([50, 30, 50], [0, 0, 0])
  }, [setView])

  const snapSolarView = useCallback(() => {
    setSelectedTarget('SOLAR_VIEW')
    const pose = computeSolarOverviewPose(getMaxHeliocentricOrbitRadius())
    setView(pose.position, pose.target)
  }, [setView])

  const snapBody = useCallback((body: SolarBodyName, updateSelection: boolean = true) => {
    if (updateSelection) setSelectedTarget(body as NasaViewTarget)

    const liveTarget = useNasaData ? getLiveTargetInCenterFrame(body) : null
    const target = liveTarget || getFallbackTarget(body)
    const pose = computeBodySnapPose(target, getBodySceneRadius(body))
    setView(pose.position, pose.target)
  }, [getFallbackTarget, getLiveTargetInCenterFrame, setView, useNasaData])

  useEffect(() => {
    if (!useNasaData || referenceFrame.loading) return
    if (selectedTarget === 'HOME' || selectedTarget === 'SOLAR_VIEW') return

    snapBody(selectedTarget as SolarBodyName, false)
  }, [referenceFrame, selectedTarget, snapBody, useNasaData])

  const selectedTelemetry = useMemo(() => {
    if (selectedTarget === 'HOME') {
      return {
        label: 'Home',
        source: 'manual',
        target: [0, 0, 0] as [number, number, number],
      }
    }

    if (selectedTarget === 'SOLAR_VIEW') {
      return {
        label: 'Solar View',
        source: 'system overview',
        target: [0, 0, 0] as [number, number, number],
      }
    }

    const body = selectedTarget as SolarBodyName
    const liveTarget = useNasaData ? getLiveTargetInCenterFrame(body) : null
    const target = liveTarget || getFallbackTarget(body)

    return {
      label: selectedTarget,
      source: useNasaData ? referenceFrame.dataSource : 'calculated',
      target,
    }
  }, [getFallbackTarget, getLiveTargetInCenterFrame, referenceFrame.dataSource, selectedTarget, useNasaData])

  const getTargetButtonClass = useCallback((target: NasaViewTarget, activeClass: string, inactiveClass: string) => {
    return `btn touch-target ${selectedTarget === target ? activeClass : inactiveClass}`
  }, [selectedTarget])

  const cameraConfig = useMemo(() => {
    if (centerOn === 'SUN') {
      return {
        target: [0, 0, 0] as [number, number, number],
        minDistance: 50,
        maxDistance: 2000
      }
    }

    return {
      target: [0, 0, 0] as [number, number, number],
      minDistance: 1,
      maxDistance: 50
    }
  }, [centerOn])

  return (
    <div className={`container-fluid py-3 py-lg-4 ${className || ''}`}>
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6 col-xxl-4">
          <div className="app-card p-3 p-lg-4 h-100 text-white">
            <h3 className="h6 mb-3">NASA Solar System Demo</h3>
            <div className="d-grid gap-3">
              <label className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={useNasaData}
                  onChange={(e) => setUseNasaData(e.target.checked)}
                  className="form-check-input m-0"
                />
                <span>Use NASA JPL Data</span>
              </label>

              <label className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOrbits}
                  onChange={(e) => setShowOrbits(e.target.checked)}
                  className="form-check-input m-0"
                />
                <span>Show Orbital Paths</span>
              </label>

              <div>
                <p className="form-label mb-2">Camera Center</p>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    onClick={() => setCenterOn('SUN')}
                    className={`btn touch-target ${centerOn === 'SUN' ? 'btn-warning' : 'btn-outline-secondary'}`}
                  >
                    Sun
                  </button>
                  <button
                    onClick={() => setCenterOn('EARTH')}
                    className={`btn touch-target ${centerOn === 'EARTH' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    Earth
                  </button>
                </div>
              </div>

              <div>
                <p className="form-label mb-2">Snap Target</p>
                <div className="d-flex flex-wrap gap-2">
                  <button onClick={snapHome} className={getTargetButtonClass('HOME', 'btn-light', 'btn-outline-light')}>Home</button>
                  <button onClick={snapSolarView} className={getTargetButtonClass('SOLAR_VIEW', 'btn-info', 'btn-outline-info')}>Solar View</button>
                  <button onClick={() => snapBody('SUN')} className={getTargetButtonClass('SUN', 'btn-warning', 'btn-outline-warning')}>Sun</button>
                  <button onClick={() => snapBody('EARTH')} className={getTargetButtonClass('EARTH', 'btn-primary', 'btn-outline-primary')}>Earth</button>
                  <button onClick={() => snapBody('MARS')} className={getTargetButtonClass('MARS', 'btn-danger', 'btn-outline-danger')}>Mars</button>
                  <button onClick={() => snapBody('JUPITER')} className={getTargetButtonClass('JUPITER', 'btn-secondary', 'btn-outline-secondary')}>Jupiter</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6 col-xxl-4">
          <div className="app-card p-3 p-lg-4 h-100 text-white small">
            <h3 className="h6 mb-3">Status</h3>
            <div className="text-body-secondary">
              <div>Mode: {useNasaData ? 'NASA JPL Horizons' : 'Calculated Orbits'}</div>
              <div>Center: {centerOn === 'SUN' ? 'Heliocentric' : 'Geocentric'}</div>
              <div>Orbits: {showOrbits ? 'Visible' : 'Hidden'}</div>
              <div>Selected target: {selectedTelemetry.label}</div>
              <div>Source: {selectedTelemetry.source}</div>
              <div>Target: {selectedTelemetry.target.map((value) => value.toFixed(2)).join(', ')}</div>
            </div>
            <div className="mt-3 text-body-secondary">
              <div className="fw-semibold text-white mb-1">Notes</div>
              <div>NASA data updates hourly.</div>
              <div>Fallback positions load when NASA is unavailable.</div>
              <div>Scale: 1 unit ≈ 1e6 km (1 AU ≈ 149.6 units).</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xxl-4">
          <div className="app-card p-3 p-lg-4 h-100 text-white small">
            <h3 className="h6 mb-3">Controls</h3>
            <div>Left click + drag: Rotate</div>
            <div>Right click + drag: Pan</div>
            <div>Scroll: Zoom in/out</div>
            <div className="mt-2">Toggle NASA data to compare.</div>
          </div>
        </div>
      </div>

      <div className="app-surface overflow-hidden p-2 p-md-3 scene-surface">
        <Canvas
          camera={{
            position: [50, 30, 50],
            fov: 60,
            near: 0.1,
            far: 20000
          }}
          onCreated={({ camera, gl }) => {
            cameraRef.current = camera as THREE.PerspectiveCamera
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
            gl.shadowMap.enabled = false
          }}
          gl={{ antialias: true }}
          shadows
          style={{ width: '100%', height: '100%' }}
          className="scene-canvas"
        >
          <color attach="background" args={['#000011']} />

          <ambientLight intensity={0.15} />
          <pointLight position={[0, 0, 0]} intensity={12} decay={2} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />

          {useNasaData ? (
            <NasaSolarSystem
              showOrbits={showOrbits}
              centerOn={centerOn}
              useNasaData={true}
              onReferenceFrameChange={setReferenceFrame}
            />
          ) : (
            <SolarSystem
              showOrbits={showOrbits}
              missionTime={Date.now() / 1000}
              centerOn={centerOn}
            />
          )}

          <OrbitControls
            ref={orbitControlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={cameraConfig.minDistance}
            maxDistance={centerOn === 'SUN' ? 12000 : cameraConfig.maxDistance}
            target={cameraConfig.target}
          />

          {process.env.NODE_ENV === 'development' && <Stats />}
        </Canvas>
      </div>
    </div>
  )
}

export default NasaDemo
