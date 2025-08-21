import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Spacecraft Models for GNC Space Simulator
 *
 * Provides 3D spacecraft models for different mission types:
 * - Launch vehicles (Falcon 9, SLS, etc.)
 * - Crew capsules (Dragon, Orion, etc.)
 * - Cargo vehicles
 * - Interplanetary probes
 */

interface SpacecraftProps {
  type: SpacecraftType
  position: THREE.Vector3
  rotation: THREE.Euler
  scale?: number
  phase: string
  showEngineEffects?: boolean
}

export enum SpacecraftType {
  FALCON9 = 'falcon9',
  DRAGON = 'dragon',
  SLS = 'sls',
  ORION = 'orion',
  STARSHIP = 'starship',
  INTERPLANETARY_PROBE = 'probe'
}

export function SpacecraftModel({
  type,
  position,
  rotation,
  scale = 1,
  phase,
  showEngineEffects = false
}: SpacecraftProps) {
  const spacecraftRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (spacecraftRef.current) {
      spacecraftRef.current.position.copy(position)
      spacecraftRef.current.rotation.copy(rotation)
      spacecraftRef.current.scale.setScalar(scale)
    }
  })

  const spacecraftComponent = useMemo(() => {
    switch (type) {
      case SpacecraftType.FALCON9:
        return <Falcon9Model showEngineEffects={showEngineEffects} phase={phase} />
      case SpacecraftType.DRAGON:
        return <DragonModel />
      case SpacecraftType.SLS:
        return <SLSModel showEngineEffects={showEngineEffects} phase={phase} />
      case SpacecraftType.ORION:
        return <OrionModel />
      case SpacecraftType.STARSHIP:
        return <StarshipModel showEngineEffects={showEngineEffects} phase={phase} />
      case SpacecraftType.INTERPLANETARY_PROBE:
        return <InterplanetaryProbeModel />
      default:
        return <Falcon9Model showEngineEffects={showEngineEffects} phase={phase} />
    }
  }, [type, showEngineEffects, phase])

  return (
    <group ref={spacecraftRef}>
      {spacecraftComponent}
    </group>
  )
}

/**
 * Falcon 9 Launch Vehicle
 */
function Falcon9Model({ showEngineEffects, phase }: { showEngineEffects: boolean; phase: string }) {
  const stage1Ref = useRef<THREE.Group>(null)
  const stage2Ref = useRef<THREE.Group>(null)
  const fairingRef = useRef<THREE.Group>(null)

  const showStage1 = !phase.includes('STAGE1_SEPARATION')
  const showFairing = !phase.includes('FAIRING_JETTISON')

  return (
    <group>
      {/* Stage 1 - First stage booster */}
      {showStage1 && (
        <group ref={stage1Ref}>
          <mesh position={[0, -8, 0]}>
            <cylinderGeometry args={[1.8, 1.8, 14, 16]} />
            <meshStandardMaterial
              color="#f0f0f0"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Grid fins */}
          {[0, Math.PI/2, Math.PI, 3*Math.PI/2].map((angle, i) => (
            <mesh
              key={i}
              position={[Math.cos(angle) * 2, -2, Math.sin(angle) * 2]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[0.1, 2, 1]} />
              <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}

          {/* Engine effects for Stage 1 */}
          {showEngineEffects && phase.includes('STAGE1_BURN') && (
            <EngineEffects position={[0, -15, 0]} intensity={1.0} color="#FF6600" />
          )}
        </group>
      )}

      {/* Stage 2 - Second stage */}
      <group ref={stage2Ref}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 6, 16]} />
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Engine effects for Stage 2 */}
        {showEngineEffects && phase.includes('STAGE2_BURN') && (
          <EngineEffects position={[0, -1, 0]} intensity={0.5} color="#4444FF" />
        )}
      </group>

      {/* Payload Fairing */}
      {showFairing && (
        <group ref={fairingRef}>
          <mesh position={[0, 6, 0]}>
            <cylinderGeometry args={[1.8, 1.8, 4, 16]} />
            <meshStandardMaterial
              color="#e0e0e0"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>

          {/* Fairing nose cone */}
          <mesh position={[0, 9, 0]}>
            <coneGeometry args={[1.8, 3, 16]} />
            <meshStandardMaterial
              color="#e0e0e0"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

/**
 * Dragon Crew Capsule
 */
function DragonModel() {
  return (
    <group>
      {/* Main capsule body */}
      <mesh>
        <cylinderGeometry args={[2, 2.5, 3, 16]} />
        <meshStandardMaterial
          color="#f5f5f5"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Heat shield */}
      <mesh position={[0, -2, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.5, 16]} />
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Draco thrusters */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2]}
            rotation={[0, angle, 0]}
          >
            <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * SLS (Space Launch System)
 */
function SLSModel({ showEngineEffects, phase }: { showEngineEffects: boolean; phase: string }) {
  return (
    <group>
      {/* Core Stage */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[4.2, 4.2, 20, 16]} />
        <meshStandardMaterial
          color="#ff7700"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Solid Rocket Boosters */}
      {[-6, 6].map((x, i) => (
        <mesh key={i} position={[x, -5, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 18, 16]} />
          <meshStandardMaterial
            color="#f0f0f0"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Engine effects */}
      {showEngineEffects && phase.includes('BURN') && (
        <group>
          <EngineEffects position={[0, -15, 0]} intensity={1.5} color="#FF4400" />
          <EngineEffects position={[-6, -14, 0]} intensity={1.2} color="#FF6600" />
          <EngineEffects position={[6, -14, 0]} intensity={1.2} color="#FF6600" />
        </group>
      )}
    </group>
  )
}

/**
 * Orion Crew Capsule
 */
function OrionModel() {
  return (
    <group>
      {/* Main capsule */}
      <mesh>
        <cylinderGeometry args={[2.5, 3, 3.5, 16]} />
        <meshStandardMaterial
          color="#d0d0d0"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Service module */}
      <mesh position={[0, -3, 0]}>
        <cylinderGeometry args={[3, 3, 2, 16]} />
        <meshStandardMaterial
          color="#333333"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Solar panels */}
      {[0, Math.PI].map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[4, -3, 0]}>
            <boxGeometry args={[3, 0.1, 2]} />
            <meshStandardMaterial
              color="#001122"
              metalness={0.9}
              roughness={0.1}
              emissive={new THREE.Color("#004488")}
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * Starship
 */
function StarshipModel({ showEngineEffects, phase }: { showEngineEffects: boolean; phase: string }) {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[4.5, 4.5, 25, 16]} />
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 15, 0]}>
        <coneGeometry args={[4.5, 8, 16]} />
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Engine effects */}
      {showEngineEffects && phase.includes('BURN') && (
        <EngineEffects position={[0, -12.5, 0]} intensity={2.0} color="#66AAFF" />
      )}
    </group>
  )
}

/**
 * Interplanetary Probe
 */
function InterplanetaryProbeModel() {
  return (
    <group>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[2, 2, 3]} />
        <meshStandardMaterial
          color="#333333"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Solar panels */}
      {[0, Math.PI].map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[3, 0, 0]}>
            <boxGeometry args={[4, 0.1, 2]} />
            <meshStandardMaterial
              color="#001122"
              metalness={0.9}
              roughness={0.1}
              emissive={new THREE.Color("#004488")}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* High-gain antenna */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[0.5, 0.5, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * Engine Effects Component
 */
interface EngineEffectsProps {
  position: THREE.Vector3 | [number, number, number]
  intensity: number
  color: string
}

function EngineEffects({ position, intensity, color }: EngineEffectsProps) {
  const flameRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (flameRef.current) {
      // Animated flame effect
      const time = state.clock.elapsedTime
      const scale = intensity * (1 + Math.sin(time * 10) * 0.2)
      flameRef.current.scale.set(1, scale, 1)
    }
  })

  // Create particle system for exhaust
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const particleCount = 100
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2
      positions[i * 3 + 1] = Math.random() * -5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  return (
    <group position={position}>
      {/* Main flame */}
      <mesh ref={flameRef}>
        <coneGeometry args={[1 * intensity, 3 * intensity, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Exhaust particles */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          color={color}
          size={0.1}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Engine light */}
      <pointLight
        color={color}
        intensity={intensity * 2}
        distance={20}
        decay={2}
      />
    </group>
  )
}

/**
 * Mission-specific spacecraft selector
 */
export function getMissionSpacecraft(missionType: string) {
  const spacecraftConfigs = {
    'earth-orbit': {
      type: SpacecraftType.FALCON9,
      payload: SpacecraftType.DRAGON
    },
    'lunar': {
      type: SpacecraftType.SLS,
      payload: SpacecraftType.ORION
    },
    'mars': {
      type: SpacecraftType.STARSHIP,
      payload: SpacecraftType.INTERPLANETARY_PROBE
    },
    'asteroid': {
      type: SpacecraftType.FALCON9,
      payload: SpacecraftType.INTERPLANETARY_PROBE
    }
  }

  return spacecraftConfigs[missionType as keyof typeof spacecraftConfigs] || spacecraftConfigs['earth-orbit']
}
