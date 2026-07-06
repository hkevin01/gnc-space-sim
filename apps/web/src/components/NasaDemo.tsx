/**
 * NASA Demo Component
 * Demonstrates the NASA JPL Horizons API integration with real-time planetary positions
 */

import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { NasaSolarSystem, SolarSystem } from './SolarSystem'

interface NasaDemoProps {
  className?: string
}

export function NasaDemo({ className }: NasaDemoProps) {
  const [useNasaData, setUseNasaData] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [centerOn, setCenterOn] = useState<'SUN' | 'EARTH'>('EARTH')

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
          gl={{ antialias: true }}
          shadows
          style={{ width: '100%', height: '100%' }}
          className="scene-canvas"
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
            gl.shadowMap.enabled = false
          }}
        >
          <color attach="background" args={['#000011']} />

          <ambientLight intensity={0.15} />
          <pointLight position={[0, 0, 0]} intensity={12} decay={2} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />

          {useNasaData ? (
            <NasaSolarSystem
              showOrbits={showOrbits}
              centerOn={centerOn}
              useNasaData={true}
            />
          ) : (
            <SolarSystem
              showOrbits={showOrbits}
              missionTime={Date.now() / 1000}
              centerOn={centerOn}
            />
          )}

          <OrbitControls
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
