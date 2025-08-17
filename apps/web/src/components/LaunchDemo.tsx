import {
    GNCSystem,
    GravityTurnGuidance,
    integrateLaunchTrajectory,
    LAUNCH_VEHICLES,
    LaunchPhase,
    LaunchState
} from '@gnc/core'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * Launch Trajectory Visualization Component
 *
 * Real-time simulation of launch vehicle ascent from Earth's surface
 * including all launch phases, atmospheric effects, and guidance systems
 */
export function LaunchDemo() {
  const trajectoryRef = useRef<THREE.Line>(null)
  const vehicleRef = useRef<THREE.Group>(null)
  const [launchTime, setLaunchTime] = useState(-10) // Start in prelaunch
  const [currentState, setCurrentState] = useState<LaunchState | null>(null)
  const [trajectory, setTrajectory] = useState<THREE.Vector3[]>(() => [
    new THREE.Vector3(6.371, 0, 0) // Initial position at Earth surface (megameters)
  ])

  // Initialize launch parameters
  const guidance = useMemo(() => new GravityTurnGuidance(400000, 28.5 * Math.PI / 180), [])
  const gncSystem = useMemo(() => new GNCSystem(0.1), [])
  const vehicle = LAUNCH_VEHICLES.FALCON_9

  // Initialize launch state
  const initialState = useMemo<LaunchState>(() => ({
    r: [6371000, 0, 0], // Earth surface at equator
    v: [0, 463.8, 0],   // Initial velocity from Earth rotation at Cape Canaveral
    phase: LaunchPhase.PRELAUNCH,
    mission_time: 0,
    altitude: 0,
    velocity_magnitude: 463.8,
    flight_path_angle: Math.PI / 2, // Start vertical
    heading: Math.PI / 2,           // Start east
    mass: vehicle.stage1.mass_dry + vehicle.stage1.mass_propellant +
          vehicle.stage2.mass_dry + vehicle.stage2.mass_propellant +
          vehicle.payload_mass + vehicle.fairing_mass,
    thrust: [0, 0, 0],
    drag: [0, 0, 0],
    atmosphere: {
      pressure: 101325,
      density: 1.225,
      temperature: 288.15
    },
    guidance: {
      pitch_program: Math.PI / 2,
      yaw_program: Math.PI / 2,
      throttle: 0
    }
  }), [vehicle])

  const stateRef = useRef<LaunchState>(initialState)

  useFrame((_, delta) => {
    if (launchTime < 0) {
      setLaunchTime(prev => prev + delta)
      return // Not launched yet
    }

    // Simulate launch trajectory
    const dt = Math.min(delta, 0.1) // Clamp timestep for stability

    try {
      const newState = integrateLaunchTrajectory(
        stateRef.current,
        vehicle,
        guidance,
        dt
      )

      // Validate the new state before using it
      const hasValidPosition = newState.r.every(coord => isFinite(coord) && !isNaN(coord))
      const hasValidVelocity = newState.v.every(coord => isFinite(coord) && !isNaN(coord))

      if (!hasValidPosition || !hasValidVelocity) {
        console.warn('Invalid state detected, skipping frame', newState)
        return
      }

      // Update GNC system
      gncSystem.update(newState)

      stateRef.current = newState
      setCurrentState(newState)
      setLaunchTime(prev => prev + dt)

    // Update trajectory visualization
    if (newState.mission_time % 1 < dt) { // Add point every second
      const scale = 1e6 // Convert to megameters for visualization

      // Validate position values to prevent NaN in geometry
      const isValidPosition = newState.r.every(coord =>
        isFinite(coord) && !isNaN(coord)
      )

      if (isValidPosition) {
        const newPoint = new THREE.Vector3(
          newState.r[0] / scale,
          newState.r[1] / scale,
          newState.r[2] / scale
        )

        setTrajectory(prev => {
          const updated = [...prev, newPoint]
          // Keep last 500 points to avoid memory issues
          return updated.length > 500 ? updated.slice(-500) : updated
        })
      }
    }

    // Update vehicle position
    if (vehicleRef.current) {
      const scale = 1e6

      // Validate position values
      const isValidPosition = newState.r.every(coord =>
        isFinite(coord) && !isNaN(coord)
      )

      if (isValidPosition) {
        vehicleRef.current.position.set(
          newState.r[0] / scale,
          newState.r[1] / scale,
          newState.r[2] / scale
        )

        // Orient vehicle based on flight path angle and heading
        if (isFinite(newState.flight_path_angle) && isFinite(newState.heading)) {
          vehicleRef.current.rotation.x = -newState.flight_path_angle
          vehicleRef.current.rotation.z = newState.heading - Math.PI / 2
        }
      }
    }

    // Mission complete check
    if (newState.phase === LaunchPhase.ORBIT_CIRCULARIZATION &&
        newState.altitude > 390000) {
      console.log('Launch successful! Orbit achieved.')
    }

    } catch (error) {
      console.error('Error in trajectory integration:', error)
      return
    }
  })

  // Update trajectory line geometry
  useMemo(() => {
    if (trajectoryRef.current && trajectory.length > 1) {
      // Filter out any invalid points
      const validTrajectory = trajectory.filter(point =>
        isFinite(point.x) && isFinite(point.y) && isFinite(point.z) &&
        !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)
      )

      if (validTrajectory.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(validTrajectory)
        trajectoryRef.current.geometry.dispose()
        trajectoryRef.current.geometry = geometry
      }
    }
  }, [trajectory])

  // Launch initiation
  const initiateLaunch = () => {
    setLaunchTime(0)
    stateRef.current = { ...initialState, phase: LaunchPhase.LIFTOFF }
  }

  return (
    <group>
      {/* Earth */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[6.371, 64, 32]} />
        <meshStandardMaterial
          color="#4A90E2"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Earth atmosphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[6.471, 32, 16]} />
        <meshBasicMaterial
          color="#87CEEB"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Launch vehicle */}
      <group ref={vehicleRef}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
          <meshStandardMaterial
            color={currentState?.phase === LaunchPhase.STAGE1_BURN ||
                   currentState?.phase === LaunchPhase.STAGE2_BURN ?
                   "#FF6B35" : "#FFFFFF"}
          />
        </mesh>

        {/* Engine plume during burn */}
        {(currentState?.phase === LaunchPhase.STAGE1_BURN ||
          currentState?.phase === LaunchPhase.STAGE2_BURN) && (
          <mesh position={[0, -0.4, 0]}>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.8}
            />
          </mesh>
        )}
      </group>

      {/* Trajectory path */}
      <primitive
        object={new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(
            trajectory.length > 0 ? trajectory.filter(point =>
              isFinite(point.x) && isFinite(point.y) && isFinite(point.z) &&
              !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)
            ) : [new THREE.Vector3(0, 0, 0)]
          ),
          new THREE.LineBasicMaterial({ color: "#FF6B35", linewidth: 2 })
        )}
        ref={trajectoryRef}
      />

      {/* Scientific annotations on vehicle */}
      {currentState && currentState.r.every(coord => isFinite(coord) && !isNaN(coord)) && (
        <Html position={[
          currentState.r[0] / 1e6 + 0.5,
          currentState.r[1] / 1e6 + 0.5,
          currentState.r[2] / 1e6
        ]} distanceFactor={8}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs pointer-events-none border border-orange-400">
            <div>Alt: {(currentState.altitude / 1000).toFixed(1)} km</div>
            <div>V: {(currentState.velocity_magnitude / 1000).toFixed(2)} km/s</div>
            <div>γ: {(currentState.flight_path_angle * 180 / Math.PI).toFixed(1)}°</div>
          </div>
        </Html>
      )}

      {/* Launch initiation button */}
      {launchTime < 0 && (
        <Html position={[0, -8, 0]} center>
          <button
            onClick={initiateLaunch}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg"
          >
            🚀 INITIATE LAUNCH
          </button>
        </Html>
      )}
    </group>
  )
}

/**
 * Export current launch state for external components
 */
export function useLaunchState(): LaunchState | null {
  // In a real application, this would use a state management solution
  // For now, return null as placeholder
  return null
}
