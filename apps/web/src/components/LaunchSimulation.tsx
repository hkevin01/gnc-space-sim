import { LaunchPhase, LaunchState } from '@gnc/core'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'
import { LaunchDemo } from './LaunchDemo'
import { GNCPanel } from './GNCPanel'
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
            // Start camera looking at Earth's surface where rocket is
            // Rocket starts at [6.371, 0, 0] (Earth radius in scene units)
            position: [7.5, 0.5, 1.5],  // Slightly behind and above rocket
            fov: 60,
            near: 0.001,
            far: 50000
          }}
          style={{ background: "#000011", maxHeight: "100vh", maxWidth: "100vw" }}
          onCreated={({ gl }) => {
            // Configure WebGL context for better stability
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;

            // Add context loss handling
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              console.warn('WebGL context lost, preventing default behavior');
              event.preventDefault();
            });

            gl.domElement.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
            });
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

      {/* GNC Panel */}
      <div className="w-96 h-full border-l border-zinc-600">
        <GNCPanel
          launchState={demoState}
          selectedMission={selectedMission}
          currentPhase={currentPhase}
        />
      </div>
    </div>
  )
}
