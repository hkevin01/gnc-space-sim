/**
 * NASA Space Launch System (SLS) 3D Visualization Component
 *
 * React Three Fiber component for rendering SLS Block 1 vehicle
 * with realistic staging animations and visual effects.
 */

import { useFrame } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import { Group, Mesh } from 'three'
import { VehicleState } from '../../../packages/gnc-core/src/launch/integration'

interface SLSProps {
  position?: [number, number, number]
  vehicleState: VehicleState
  scale?: number
  showExhaust?: boolean
  showSeparation?: boolean
}

/**
 * SLS Block 1 3D Component
 *
 * Renders NASA SLS vehicle with:
 * - Twin Solid Rocket Boosters (SRBs)
 * - Core Stage (orange tank)
 * - Interim Cryogenic Propulsion Stage (ICPS)
 * - Orion spacecraft
 * - Realistic exhaust plumes
 * - Staging animations
 */
export const SLSBlock1: React.FC<SLSProps> = ({
  position = [0, 0, 0],
  vehicleState,
  scale = 1,
  showExhaust = true,
  showSeparation = false
}) => {
  const groupRef = useRef<Group>(null!)
  const srbLeftRef = useRef<Group>(null!)
  const srbRightRef = useRef<Group>(null!)
  const coreStageRef = useRef<Mesh>(null!)
  const icpsRef = useRef<Mesh>(null!)
  const orionRef = useRef<Mesh>(null!)

  // Exhaust plume references
  const srbExhaustLeftRef = useRef<Mesh>(null!)
  const srbExhaustRightRef = useRef<Mesh>(null!)
  const coreExhaustRef = useRef<Mesh>(null!)

  // Vehicle dimensions (scaled to Three.js units)
  const dimensions = useMemo(() => ({
    // SLS total height: 98m
    totalHeight: 98 * scale,

    // Core Stage (orange tank)
    coreHeight: 64.6 * scale,
    coreDiameter: 8.4 * scale,

    // Solid Rocket Boosters
    srbHeight: 54.0 * scale,
    srbDiameter: 3.7 * scale,
    srbSeparation: 12.0 * scale, // distance from core center

    // ICPS upper stage
    icpsHeight: 13.7 * scale,
    icpsDiameter: 5.1 * scale,

    // Orion spacecraft
    orionHeight: 3.3 * scale,
    orionDiameter: 5.0 * scale
  }), [scale])

  // Animation state
  const animationState = useMemo(() => {
    const srbActive = vehicleState.activeStages.includes('SRB')
    const coreActive = vehicleState.activeStages.includes('Core Stage')
    const icpsActive = vehicleState.activeStages.includes('ICPS')

    return {
      srbActive,
      coreActive,
      icpsActive,
      srbSeparated: !srbActive && vehicleState.time > 120, // SRB separation ~T+2min
      engineIgnited: srbActive || coreActive,
      missionTime: vehicleState.time
    }
  }, [vehicleState])

  // Update staging animations
  useFrame(() => {
    if (!groupRef.current) return

    const { srbSeparated, missionTime } = animationState

    // SRB separation animation
    if (srbSeparated && showSeparation) {
      const separationTime = Math.min((missionTime - 120) / 5, 1) // 5 second separation

      if (srbLeftRef.current) {
        srbLeftRef.current.position.x = -dimensions.srbSeparation - (separationTime * 20)
        srbLeftRef.current.rotation.z = separationTime * 0.3
      }

      if (srbRightRef.current) {
        srbRightRef.current.position.x = dimensions.srbSeparation + (separationTime * 20)
        srbRightRef.current.rotation.z = -separationTime * 0.3
      }
    }

    // Exhaust plume animations
    if (showExhaust) {
      const throttle = vehicleState.thrust / 16000000 // Normalize to max thrust

      // SRB exhaust (if active)
      if (animationState.srbActive) {
        [srbExhaustLeftRef, srbExhaustRightRef].forEach(ref => {
          if (ref.current) {
            ref.current.scale.y = 10 + throttle * 20
            ref.current.material.opacity = 0.6 + throttle * 0.4
          }
        })
      }

      // Core stage exhaust
      if (animationState.coreActive && coreExhaustRef.current) {
        coreExhaustRef.current.scale.y = 8 + throttle * 15
        coreExhaustRef.current.material.opacity = 0.5 + throttle * 0.3
      }
    }

    // Vehicle attitude (simple pitch program)
    if (groupRef.current && missionTime > 10) {
      const pitchAngle = Math.min((missionTime - 10) / 100, 1) * 0.3 // Gradual pitch over
      groupRef.current.rotation.z = pitchAngle
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Core Stage (Orange External Tank) */}
      <mesh
        ref={coreStageRef}
        position={[0, 0, 0]}
      >
        <cylinderGeometry args={[
          dimensions.coreDiameter / 2,
          dimensions.coreDiameter / 2,
          dimensions.coreHeight,
          32
        ]} />
        <meshStandardMaterial
          color="#ff6b35" // NASA orange
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>

      {/* Solid Rocket Boosters */}
      <group ref={srbLeftRef} position={[-dimensions.srbSeparation, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[
            dimensions.srbDiameter / 2,
            dimensions.srbDiameter / 2,
            dimensions.srbHeight,
            16
          ]} />
          <meshStandardMaterial
            color="#f5f5f5" // White
            metalness={0.05}
            roughness={0.4}
          />
        </mesh>

        {/* SRB Nozzle */}
        <mesh position={[0, -dimensions.srbHeight / 2 - 2, 0]}>
          <coneGeometry args={[dimensions.srbDiameter / 2, 4, 16]} />
          <meshStandardMaterial color="#444444" metalness={0.8} />
        </mesh>
      </group>

      <group ref={srbRightRef} position={[dimensions.srbSeparation, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[
            dimensions.srbDiameter / 2,
            dimensions.srbDiameter / 2,
            dimensions.srbHeight,
            16
          ]} />
          <meshStandardMaterial
            color="#f5f5f5" // White
            metalness={0.05}
            roughness={0.4}
          />
        </mesh>

        {/* SRB Nozzle */}
        <mesh position={[0, -dimensions.srbHeight / 2 - 2, 0]}>
          <coneGeometry args={[dimensions.srbDiameter / 2, 4, 16]} />
          <meshStandardMaterial color="#444444" metalness={0.8} />
        </mesh>
      </group>

      {/* ICPS Upper Stage */}
      <mesh
        ref={icpsRef}
        position={[0, dimensions.coreHeight / 2 + dimensions.icpsHeight / 2, 0]}
      >
        <cylinderGeometry args={[
          dimensions.icpsDiameter / 2,
          dimensions.icpsDiameter / 2,
          dimensions.icpsHeight,
          32
        ]} />
        <meshStandardMaterial
          color="#e0e0e0" // Light gray
          metalness={0.2}
          roughness={0.2}
        />
      </mesh>

      {/* Orion Spacecraft */}
      <mesh
        ref={orionRef}
        position={[0, dimensions.coreHeight / 2 + dimensions.icpsHeight + dimensions.orionHeight / 2, 0]}
      >
        <capsuleGeometry args={[
          dimensions.orionDiameter / 2,
          dimensions.orionHeight,
          8,
          16
        ]} />
        <meshStandardMaterial
          color="#2c3e50" // Dark blue-gray
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>

      {/* Launch Escape System */}
      <mesh position={[0, dimensions.coreHeight / 2 + dimensions.icpsHeight + dimensions.orionHeight + 2, 0]}>
        <coneGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>

      {/* Exhaust Plumes */}
      {showExhaust && (
        <>
          {/* SRB Exhaust */}
          {animationState.srbActive && (
            <>
              <mesh
                ref={srbExhaustLeftRef}
                position={[-dimensions.srbSeparation, -dimensions.srbHeight / 2 - 15, 0]}
              >
                <coneGeometry args={[3, 30, 8]} />
                <meshStandardMaterial
                  color="#ffaa00"
                  transparent
                  opacity={0.7}
                  emissive="#ff6600"
                  emissiveIntensity={0.5}
                />
              </mesh>

              <mesh
                ref={srbExhaustRightRef}
                position={[dimensions.srbSeparation, -dimensions.srbHeight / 2 - 15, 0]}
              >
                <coneGeometry args={[3, 30, 8]} />
                <meshStandardMaterial
                  color="#ffaa00"
                  transparent
                  opacity={0.7}
                  emissive="#ff6600"
                  emissiveIntensity={0.5}
                />
              </mesh>
            </>
          )}

          {/* Core Stage Exhaust */}
          {animationState.coreActive && (
            <mesh
              ref={coreExhaustRef}
              position={[0, -dimensions.coreHeight / 2 - 12, 0]}
            >
              <coneGeometry args={[2, 25, 8]} />
              <meshStandardMaterial
                color="#00aaff"
                transparent
                opacity={0.6}
                emissive="#0066cc"
                emissiveIntensity={0.3}
              />
            </mesh>
          )}
        </>
      )}

      {/* Engine Details */}
      {/* RS-25 Engines (4x) */}
      {[-1.5, -0.5, 0.5, 1.5].map((offset, index) => (
        <mesh
          key={index}
          position={[offset, -dimensions.coreHeight / 2 - 1, 0]}
        >
          <cylinderGeometry args={[0.8, 1.2, 3, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Launch Complex 39B Pad Visualization
 */
export const LaunchPad: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  return (
    <group position={[0, -200, 0]}>
      {/* Launch Platform */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[100 * scale, 5 * scale, 100 * scale]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Mobile Launcher */}
      <mesh position={[0, 50 * scale, 0]}>
        <boxGeometry args={[20 * scale, 100 * scale, 20 * scale]} />
        <meshStandardMaterial color="#bbbbbb" />
      </mesh>

      {/* Service Umbilicals */}
      <mesh position={[15 * scale, 25 * scale, 0]}>
        <boxGeometry args={[30 * scale, 2 * scale, 2 * scale]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
    </group>
  )
}

export default SLSBlock1;
