import { LaunchPhase, LaunchState } from '@gnc/core'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { LaunchDemo } from './LaunchDemo'
import { GNCPanel } from './GNCPanel'

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
    <div className="flex w-full h-full">
      {/* 3D Scene Container */}
      <div className="flex-1 relative">
        <Canvas
          camera={{
            position: [0, 0, 20],
            fov: 75,
            near: 0.1,
            far: 1000000
          }}
          style={{ background: "#000011", maxHeight: "100vh", maxWidth: "100vw" }}
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
      </div>

      {/* GNC Panel */}
      <div className="w-96 h-full border-l border-zinc-600">
        <GNCPanel launchState={demoState} />
      </div>
    </div>
  )
}
