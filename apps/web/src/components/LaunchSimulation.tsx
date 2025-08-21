import { LaunchPhase, LaunchState } from '@gnc/core'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { LaunchDemo } from './LaunchDemo'
import { ScientificDisplay } from './ScientificDisplay'

/**
 * Main Launch Simulation Container
 *
 * Combines the 3D visualization with comprehensive scientific displays
 */
export function LaunchSimulation() {
  // Demo state for scientific display
  const [demoState] = useState<LaunchState>({
    r: [6371000, 0, 50000], // 50km altitude
    v: [0, 1500, 200],      // Example velocity vector
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
      temperature: 250
    },
    guidance: {
      pitch_program: 0.3,
      yaw_program: 1.57,
      throttle: 0.85
    }
  })

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <Canvas
        camera={{
          position: [0, 0, 20],
          fov: 75,
          near: 0.1,
          far: 1000000
        }}
        style={{ background: "#000011" }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <LaunchDemo />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={2}
          panSpeed={1}
          rotateSpeed={0.5}
        />
      </Canvas>

      {/* Scientific Information Overlay */}
      <div className="absolute top-4 right-4 w-96 max-h-screen overflow-y-auto">
        <div className="bg-black/90 backdrop-blur-sm border border-zinc-600 rounded-lg">
          <ScientificDisplay launchState={demoState} />
        </div>
      </div>

      {/* Launch Controls */}
      {demoState.mission_time < 0 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-red-900/90 border border-red-600 rounded-lg p-4 text-center">
            <div className="text-white mb-2">
              <div className="text-lg font-bold">🚀 MISSION READY</div>
              <div className="text-sm text-gray-300">All systems nominal</div>
            </div>
          </div>
        </div>
      )}

      {/* Mission Status */}
      <div className="absolute top-4 left-4">
        <div className="bg-black/90 backdrop-blur-sm border border-zinc-600 rounded-lg p-4 text-white font-mono">
          <div className="text-orange-400 font-bold mb-2">🎯 MISSION STATUS</div>
          <div className="space-y-1 text-sm">
            <div>Time: T+{Math.max(0, demoState.mission_time).toFixed(1)}s</div>
            <div>Phase: {demoState.phase.replace(/_/g, ' ')}</div>
            <div>Alt: {(demoState.altitude / 1000).toFixed(1)} km</div>
            <div>Vel: {(demoState.velocity_magnitude / 1000).toFixed(2)} km/s</div>
          </div>
        </div>
      </div>
    </div>
  )
}
