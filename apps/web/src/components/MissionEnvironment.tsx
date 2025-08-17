import { LaunchPhase } from '@gnc/core'
import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Mission Environment Visualizer
 *
 * Renders appropriate celestial bodies and environments based on mission phase
 */

interface MissionEnvironmentProps {
  phase: LaunchPhase
  missionTime: number
  altitude: number
}

export function MissionEnvironment({ phase, missionTime, altitude }: MissionEnvironmentProps) {
  // Calculate which celestial bodies to show based on mission phase and parameters
  const environment = useMemo(() => {
    const showEarth = altitude < 10000000 // Show Earth within 10,000 km
    const showMoon = altitude > 1000000   // Show Moon after 1,000 km altitude
    const showSun = altitude > 500000     // Show Sun after 500 km altitude
    const showMars = phase === LaunchPhase.ORBITAL_INSERTION ||
                     phase === LaunchPhase.ORBIT_CIRCULARIZATION ||
                     missionTime > 300 // Show Mars for deep space phases or after 5 minutes
    const showAsteroid = missionTime > 200 && altitude > 2000000 // Show asteroid after 3.3 min and high altitude

    return { showEarth, showMoon, showSun, showMars, showAsteroid }
  }, [phase, missionTime, altitude])

  return (
    <group>
      {/* Earth - always visible during launch */}
      {environment.showEarth && <EarthVisual />}

      {/* Sun - visible after reaching space */}
      {environment.showSun && <SunVisual />}

      {/* Moon - visible during orbital phases */}
      {environment.showMoon && <MoonVisual />}

      {/* Mars - visible during deep space phases */}
      {environment.showMars && <MarsVisual />}

      {/* Asteroid - visible during interplanetary transfer */}
      {environment.showAsteroid && <AsteroidVisual />}

      {/* Starfield background */}
      <StarfieldBackground />
    </group>
  )
}

function EarthVisual() {
  return (
    <group>
      {/* Earth surface */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[6.371, 64, 32]} />
        <meshPhongMaterial
          color="#1E3A8A"
          transparent
          opacity={0.9}
          shininess={30}
        />
      </mesh>

      {/* Earth continents (simplified) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[6.372, 64, 32]} />
        <meshPhongMaterial
          color="#22C55E"
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Earth atmosphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[6.471, 32, 16]} />
        <meshBasicMaterial
          color="#87CEEB"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Earth clouds */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[6.375, 32, 16]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function SunVisual() {
  return (
    <group position={[-150, 50, -200]}>
      {/* Sun core */}
      <mesh>
        <sphereGeometry args={[8, 32, 16]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFA500"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Sun corona */}
      <mesh>
        <sphereGeometry args={[12, 16, 8]} />
        <meshBasicMaterial
          color="#FFE55C"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sunlight */}
      <pointLight
        color="#FFE55C"
        intensity={1.0}
        distance={500}
        decay={2}
      />
    </group>
  )
}

function MoonVisual() {
  return (
    <group position={[60, 10, 30]}>
      {/* Moon surface */}
      <mesh>
        <sphereGeometry args={[1.737, 32, 16]} />
        <meshPhongMaterial
          color="#C0C0C0"
          transparent
          opacity={0.8}
          shininess={5}
        />
      </mesh>

      {/* Moon craters (simplified) */}
      <mesh position={[0.5, 0.3, 0.8]}>
        <sphereGeometry args={[0.2, 8, 4]} />
        <meshPhongMaterial
          color="#A0A0A0"
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh position={[-0.4, -0.2, 0.9]}>
        <sphereGeometry args={[0.15, 8, 4]} />
        <meshPhongMaterial
          color="#A0A0A0"
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

function MarsVisual() {
  return (
    <group position={[200, -30, 150]}>
      {/* Mars surface */}
      <mesh>
        <sphereGeometry args={[3.39, 32, 16]} />
        <meshPhongMaterial
          color="#CD5C5C"
          transparent
          opacity={0.9}
          shininess={10}
        />
      </mesh>

      {/* Mars polar ice caps */}
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.5, 8, 4]} />
        <meshPhongMaterial
          color="#FFFFFF"
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh position={[0, -3.2, 0]}>
        <sphereGeometry args={[0.3, 8, 4]} />
        <meshPhongMaterial
          color="#FFFFFF"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Mars thin atmosphere */}
      <mesh>
        <sphereGeometry args={[3.42, 16, 8]} />
        <meshBasicMaterial
          color="#FFB6C1"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function AsteroidVisual() {
  return (
    <group position={[100, 40, -80]}>
      {/* Main asteroid body (irregular shape) */}
      <mesh rotation={[0.3, 0.7, 0.2]}>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshPhongMaterial
          color="#696969"
          transparent
          opacity={0.9}
          shininess={2}
        />
      </mesh>

      {/* Asteroid debris field */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          ]}
          rotation={[
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ]}
        >
          <octahedronGeometry args={[0.1 + Math.random() * 0.3, 0]} />
          <meshPhongMaterial
            color="#555555"
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

function StarfieldBackground() {
  const starCount = 1000
  const positions = useMemo(() => {
    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      // Generate random positions on a large sphere
      const radius = 1000
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    return positions
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFFFFF"
        size={2}
        sizeAttenuation={false}
        transparent
        opacity={0.8}
      />
    </points>
  )
}

/**
 * Mission Phase Visual Indicators
 */
interface PhaseIndicatorProps {
  phase: LaunchPhase
  missionTime: number
}

export function PhaseVisualIndicator({ phase, missionTime }: PhaseIndicatorProps) {
  const phaseConfig = useMemo(() => {
    switch (phase) {
      case LaunchPhase.PRELAUNCH:
        return { color: '#6B7280', label: 'Pre-Launch', icon: '🚀' }
      case LaunchPhase.LIFTOFF:
        return { color: '#EF4444', label: 'Liftoff', icon: '🔥' }
      case LaunchPhase.STAGE1_BURN:
        return { color: '#F59E0B', label: 'Stage 1 Burn', icon: '🚀' }
      case LaunchPhase.MAX_Q:
        return { color: '#8B5CF6', label: 'Max Q', icon: '💨' }
      case LaunchPhase.STAGE1_SEPARATION:
        return { color: '#10B981', label: 'Stage 1 Sep', icon: '🔄' }
      case LaunchPhase.STAGE2_IGNITION:
        return { color: '#F59E0B', label: 'Stage 2 Ignition', icon: '🔥' }
      case LaunchPhase.FAIRING_JETTISON:
        return { color: '#06B6D4', label: 'Fairing Jettison', icon: '📦' }
      case LaunchPhase.STAGE2_BURN:
        return { color: '#F59E0B', label: 'Stage 2 Burn', icon: '🚀' }
      case LaunchPhase.ORBITAL_INSERTION:
        return { color: '#3B82F6', label: 'Orbital Insertion', icon: '🌍' }
      case LaunchPhase.ORBIT_CIRCULARIZATION:
        return { color: '#8B5CF6', label: 'Orbit Circularization', icon: '🔄' }
      default:
        return { color: '#6B7280', label: 'Unknown', icon: '❓' }
    }
  }, [phase])

  return (
    <div className="flex items-center space-x-2 text-white">
      <div
        className="w-3 h-3 rounded-full animate-pulse"
        style={{ backgroundColor: phaseConfig.color }}
      />
      <span className="text-lg">{phaseConfig.icon}</span>
      <span className="font-bold">{phaseConfig.label}</span>
      <span className="text-sm opacity-75">
        T+{Math.floor(missionTime / 60)}:{(missionTime % 60).toFixed(0).padStart(2, '0')}
      </span>
    </div>
  )
}
