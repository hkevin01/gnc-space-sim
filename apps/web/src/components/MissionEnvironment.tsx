import { LaunchPhase } from '@gnc/core'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { assetUrl, useSafeTexture } from '../utils/textures'
import { MISSION_SCENARIOS } from './MissionTypes'
// import { OrbitalSystem } from './OrbitalMechanics'
import { SpacecraftType } from './SpacecraftModels'
import { useTerrain } from './TerrainControls'

/**
 * Enhanced Mission Environment Visualizer
 *
 * Renders appropriate celestial bodies and environments based on mission phase
 * with advanced lighting, orbital mechanics, and UI components
 */

interface MissionEnvironmentProps {
  phase: LaunchPhase
  missionTime: number
  altitude: number
}

export function MissionEnvironment({ phase, missionTime, altitude }: MissionEnvironmentProps) {
  const group = useRef<THREE.Group>(null)
  const [timeMultiplier, setTimeMultiplier] = useState(1)
  const [targetBody, setTargetBody] = useState<string>('earth')
  const [simulationTime, setSimulationTime] = useState(0)
  const [currentMission, setCurrentMission] = useState('earthOrbit')

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

  // Mission data for UI components
  const missionData = useMemo(() => ({
    phase: phase.toString(),
    altitude,
    velocity: Math.sqrt(398600.4418 / (6371 + altitude / 1000)) * 1000, // Orbital velocity approximation
    missionTime,
    fuel: Math.max(0, 100 - (missionTime / 600) * 100), // Simple fuel consumption model
    targetBody
  }), [phase, altitude, missionTime, targetBody])

  // Determine spacecraft type based on mission
  const spacecraftType = useMemo(() => {
    const mission = MISSION_SCENARIOS[currentMission]
    const spacecraftName = mission?.spacecraft || 'falcon9'

    // Map spacecraft names to enum values
    switch (spacecraftName) {
      case 'falcon9': return SpacecraftType.FALCON9
      case 'dragon': return SpacecraftType.DRAGON
      case 'sls': return SpacecraftType.SLS
      case 'orion': return SpacecraftType.ORION
      case 'starship': return SpacecraftType.STARSHIP
      case 'probe': return SpacecraftType.INTERPLANETARY_PROBE
      default: return SpacecraftType.FALCON9
    }
  }, [currentMission])

  // For now, just return null to make the component compile
  // This component was incomplete and conflicting with LaunchDemo usage
  return null
}

function EarthVisual() {
  const ref = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

  const dayMap = useSafeTexture({
    url: [
      assetUrl('assets/earth/earth_day.jpg'),
      assetUrl('textures/earth/earth_day.jpg'),
      assetUrl('textures/earth/earth_day_4k.jpg')
    ],
    anisotropy: 8,
    fallbackPattern: {
      type: 'earth',
      size: 1024,
      squares: 64
    }
  })
  const normalMap = useSafeTexture({
    url: [
      assetUrl('assets/earth/earth_normal.jpg'),
      assetUrl('textures/earth/earth_normal.jpg')
    ],
  anisotropy: 8,
  isColor: false
  })
  const specMap = useSafeTexture({
    url: [
  assetUrl('assets/earth/earth_spec.png'),
  assetUrl('assets/earth/earth_spec.jpg'),
  assetUrl('textures/earth/earth_spec.png'),
  assetUrl('textures/earth/earth_spec.jpg')
    ],
  anisotropy: 8,
  isColor: false
  })

  const earthMaterial = useMemo(() => {
    if (dayMap) {
      const mat = new THREE.MeshStandardMaterial({
        roughness: 1.0,
        metalness: 0.0
      })
      mat.map = dayMap
      if (normalMap) mat.normalMap = normalMap
      if (specMap) mat.metalnessMap = specMap
      return mat
    }
    // Fallback procedural look
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.1, 0.3, 0.8),
      roughness: 0.9,
      metalness: 0.05,
      emissive: new THREE.Color(0.02, 0.05, 0.1),
      emissiveIntensity: 0.1
    })
  }, [dayMap, normalMap, specMap])

  // Animate rotation for realism
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.001
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0015
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += 0.0005
  })

  return (
    <group>
  {/* Main Earth body with texture or fallback */}
      <mesh ref={ref} rotation={[0, Math.PI, 0]} material={earthMaterial}>
        <sphereGeometry args={[6.371, 128, 64]} />
      </mesh>

      {/* Atmosphere */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[6.471, 64, 32]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.15}
          roughness={1}
          thickness={0.8}
          transmission={0.1}
          color={'#87CEEB'}
          emissive={new THREE.Color('#4682B4')}
          emissiveIntensity={0.02}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Procedural cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[6.39, 128, 64]} />
        <meshPhongMaterial
          color="white"
          transparent
          opacity={0.3}
          depthWrite={false}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function SunVisual() {
  const ref = useRef<THREE.Mesh>(null)
  const sunMap = useSafeTexture({
    url: [
      assetUrl('assets/sun/sun_color.jpg'),
      assetUrl('textures/sun/sun_color.jpg')
    ],
    anisotropy: 4,
    fallbackPattern: { type: 'stripes', colors: ['#ffcc66', '#ff9933', '#ff6600'], size: 512, squares: 24 }
  })

  // Animate sun rotation and pulsing
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.002
      // Subtle size pulsing to simulate solar activity
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02
      ref.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[-150, 50, -200]}>
      {/* Emissive sun with texture fallback */}
      <mesh ref={ref}>
        <sphereGeometry args={[8, 64, 32]} />
        {sunMap ? (
          <meshBasicMaterial map={sunMap} />
        ) : (
          <meshBasicMaterial color="#ffaa33" />
        )}
      </mesh>

      {/* Corona effect */}
      <mesh scale={1.2}>
        <sphereGeometry args={[8, 32, 16]} />
        <meshStandardMaterial
          transparent
          opacity={0.1}
          color="#FFE55C"
          emissive={new THREE.Color("#FFE55C")}
          emissiveIntensity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Enhanced lighting */}
      <pointLight
        color="#FFE55C"
        intensity={2.0}
        distance={1000}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Ambient contribution from sun */}
      <pointLight
        color="#FFF4E6"
        intensity={0.5}
        distance={800}
        decay={1.5}
      />
    </group>
  )
}

function MoonVisual() {
  const ref = useRef<THREE.Mesh>(null)
  const { settings } = useTerrain()
  const moonColor = useSafeTexture({
    url: [
      assetUrl('assets/moon/moon_color.jpg'),
      assetUrl('textures/moon/moon_color.jpg')
    ],
    anisotropy: 8,
    fallbackPattern: { type: 'checker', colors: ['#bdbdbd', '#9e9e9e', '#8c8c8c'], size: 1024, squares: 32 }
  })
  const moonDisplacement = useSafeTexture({
    url: [
      assetUrl('assets/moon/moon_displacement.png'), // preferred 16-bit PNG
      assetUrl('assets/moon/moon_displacement.jpg') // fallback preview
    ],
    anisotropy: 1,
    isColor: false
  })

  // Animate moon rotation (tidally locked, so very slow)
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0005 // Very slow rotation
    }
  })

  return (
    <group position={[60, 10, 30]}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.737, 128, 64]} />
        {moonColor ? (
          <meshStandardMaterial
            map={moonColor}
            roughness={1}
            metalness={0.05}
            displacementMap={settings.enableDisplacement ? moonDisplacement ?? undefined : undefined}
            displacementScale={settings.enableDisplacement ? settings.moonDisplacementScale : 0}
          />
        ) : (
          <meshStandardMaterial
            color="#C0C0C0"
            roughness={1}
            metalness={0.05}
            emissive={new THREE.Color('#1a1a1a')}
            emissiveIntensity={0.02}
          />
        )}
      </mesh>
    </group>
  )
}

function MarsVisual() {
  const ref = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const { settings } = useTerrain()
  const marsColor = useSafeTexture({
    url: [
      assetUrl('assets/mars/mars_color.jpg'),
      assetUrl('textures/mars/mars_color.jpg')
    ],
    anisotropy: 8,
    fallbackPattern: { type: 'checker', colors: ['#cd5c5c', '#8b3a3a'], size: 512, squares: 12 }
  })
  const marsNormal = useSafeTexture({
    url: [
      assetUrl('assets/mars/mars_normal.jpg'),
      assetUrl('textures/mars/mars_normal.jpg')
    ],
    anisotropy: 8,
    isColor: false
  })
  const marsDisplacement = useSafeTexture({
    url: [
      assetUrl('assets/mars/mars_displacement.png'), // preferred 16-bit PNG
      assetUrl('assets/mars/mars_displacement.jpg')  // fallback preview
    ],
    anisotropy: 1,
    isColor: false
  })

  // Animate Mars rotation
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0008 // Mars rotation period is ~24.6 hours
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0003 // Thin atmosphere movement
    }
  })

  return (
    <group position={[200, -30, 150]}>
      {/* Mars surface with texture fallback */}
      <mesh ref={ref}>
        <sphereGeometry args={[3.39, 128, 64]} />
        {marsColor ? (
          <meshStandardMaterial
            map={marsColor}
            normalMap={marsNormal ?? undefined}
            displacementMap={settings.enableDisplacement ? marsDisplacement ?? undefined : undefined}
            displacementScale={settings.enableDisplacement ? settings.marsDisplacementScale : 0}
            roughness={1}
            metalness={0.0}
          />
        ) : (
          <meshStandardMaterial color="#CD5C5C" roughness={1} metalness={0.02} />
        )}
      </mesh>

      {/* Thin atmosphere */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[3.42, 32, 16]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.05}
          roughness={1}
          thickness={0.2}
          color={'#CD853F'}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

function AsteroidVisual() {
  const asteroidRefs = useRef<THREE.Mesh[]>([])

  // Create varied asteroid data
  const asteroids = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 40 + 100,
        (Math.random() - 0.5) * 20 + 40,
        (Math.random() - 0.5) * 30 - 80
      ] as [number, number, number],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
      size: 0.2 + Math.random() * 0.8,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      type: Math.random() > 0.7 ? 'metallic' : Math.random() > 0.4 ? 'rocky' : 'carbonaceous'
    }))
  }, [])

  // Animate asteroid rotation
  useFrame(() => {
    asteroidRefs.current.forEach((asteroid, i) => {
      if (asteroid && asteroids[i]) {
        asteroid.rotation.x += asteroids[i].rotationSpeed * 0.5
        asteroid.rotation.y += asteroids[i].rotationSpeed
        asteroid.rotation.z += asteroids[i].rotationSpeed * 0.3
      }
    })
  })

  const getAsteroidMaterial = (type: string) => {
    switch (type) {
      case 'metallic':
        return {
          color: "#8C7853",
          roughness: 0.3,
          metalness: 0.8,
          emissive: new THREE.Color("#2a2a2a"),
          emissiveIntensity: 0.05
        }
      case 'rocky':
        return {
          color: "#A0522D",
          roughness: 1,
          metalness: 0.1,
          emissive: new THREE.Color("#1a1a1a"),
          emissiveIntensity: 0.02
        }
      default: // carbonaceous
        return {
          color: "#2F2F2F",
          roughness: 1,
          metalness: 0,
          emissive: new THREE.Color("#0a0a0a"),
          emissiveIntensity: 0.01
        }
    }
  }

  return (
    <group>
      {asteroids.map((asteroid, i) => (
        <mesh
          key={asteroid.id}
          ref={(el) => {
            if (el) asteroidRefs.current[i] = el
          }}
          position={asteroid.position}
          rotation={asteroid.rotation}
          scale={asteroid.size}
        >
          <dodecahedronGeometry args={[1, Math.floor(Math.random() * 2)]} />
          <meshStandardMaterial {...getAsteroidMaterial(asteroid.type)} />
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
