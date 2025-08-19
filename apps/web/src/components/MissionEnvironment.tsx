import { LaunchPhase } from '@gnc/core'
import { Stars, useTexture } from '@react-three/drei'
import { useMemo, useRef } from 'react'
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
  const group = useRef<THREE.Group>(null)

  // Calculate which celestial bodies to show based on mission phase and parameters
  const environment = useMemo(() => {
    const showEarth = altitude < 10_000_000
    const showMoon = altitude > 1_000_000
    const showSun = altitude > 500_000
    const showMars = phase === LaunchPhase.ORBITAL_INSERTION ||
                     phase === LaunchPhase.ORBIT_CIRCULARIZATION ||
                     missionTime > 300
    const showAsteroid = missionTime > 200 && altitude > 2_000_000

    return { showEarth, showMoon, showSun, showMars, showAsteroid }
  }, [phase, missionTime, altitude])

  return (
    <group ref={group}>
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
      <Stars radius={1000} depth={50} count={4000} factor={4} saturation={0} fade speed={0.6} />
    </group>
  )
}

function EarthVisual() {
  // Use stable textures from threejs.org examples
  const textures = useTexture({
    map: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    emissiveMap: 'https://threejs.org/examples/textures/planets/earth_lights_2048.png'
  }) as unknown as { map: THREE.Texture; emissiveMap: THREE.Texture }
  const clouds = useTexture('https://threejs.org/examples/textures/planets/earth_clouds_1024.png') as THREE.Texture
  const ref = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  return (
    <group>
      <mesh ref={ref} rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[6.371, 128, 64]} />
        <meshStandardMaterial
          map={textures.map}
          emissiveMap={textures.emissiveMap}
          emissive={new THREE.Color('#0b1a2a')}
          emissiveIntensity={0.25}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Atmosphere */}
      <mesh>
        <sphereGeometry args={[6.471, 64, 32]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.12}
          roughness={1}
          thickness={0.5}
          color={'#87CEEB'}
        />
      </mesh>
      {/* Clouds */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[6.39, 128, 64]} />
        <meshPhongMaterial map={clouds} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

function SunVisual() {
  return (
    <group position={[-150, 50, -200]}>
      <mesh>
        <sphereGeometry args={[8, 64, 32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFA500" emissiveIntensity={1.2} />
      </mesh>
      <pointLight color="#FFE55C" intensity={1.2} distance={800} decay={2} />
    </group>
  )
}

function MoonVisual() {
  const texture = useTexture('https://threejs.org/examples/textures/planets/moon_1024.jpg') as THREE.Texture
  return (
    <group position={[60, 10, 30]}>
      <mesh>
        <sphereGeometry args={[1.737, 64, 32]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}

function MarsVisual() {
  const texture = useTexture('https://threejs.org/examples/textures/planets/mars_1k_color.jpg') as THREE.Texture
  return (
    <group position={[200, -30, 150]}>
      <mesh>
        <sphereGeometry args={[3.39, 64, 32]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}

function AsteroidVisual() {
  return (
    <group position={[100, 40, -80]}>
      <mesh rotation={[0.3, 0.7, 0.2]}>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#696969" roughness={1} metalness={0} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10]}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
        >
          <octahedronGeometry args={[0.1 + Math.random() * 0.3, 0]} />
          <meshStandardMaterial color="#555555" roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
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
      <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: phaseConfig.color }} />
      <span className="text-lg">{phaseConfig.icon}</span>
      <span className="font-bold">{phaseConfig.label}</span>
      <span className="text-sm opacity-75">
        T+{Math.floor(missionTime / 60)}:{(missionTime % 60).toFixed(0).padStart(2, '0')}
      </span>
    </div>
  )
}
