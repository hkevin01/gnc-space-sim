import { LaunchPhase } from '@gnc/core'
import { Stars, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
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
      {/* Enhanced ambient lighting for better material visibility */}
      <ambientLight intensity={0.15} color="#4682B4" />

      {/* Directional light simulating distant starlight */}
      <directionalLight
        position={[100, 100, 50]}
        intensity={0.3}
        color="#E6E6FA"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

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

      {/* Enhanced starfield background with better density and effects */}
      <Stars
        radius={1000}
        depth={50}
        count={6000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.3}
      />
    </group>
  )
}

function EarthVisual() {
  // Enhanced texture loading with multiple maps for realistic PBR rendering
  const textures = useTexture({
    map: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    normalMap: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    specularMap: 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
    emissiveMap: 'https://threejs.org/examples/textures/planets/earth_lights_2048.png'
  }) as unknown as {
    map: THREE.Texture;
    normalMap: THREE.Texture;
    specularMap: THREE.Texture;
    emissiveMap: THREE.Texture;
  }

  const clouds = useTexture('https://threejs.org/examples/textures/planets/earth_clouds_1024.png') as THREE.Texture
  const ref = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

  // Animate rotation for realism
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.001 // Earth rotation
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0015 // Clouds rotate slightly faster
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0005 // Atmosphere subtle rotation
    }
  })

  return (
    <group>
      {/* Main Earth body with enhanced PBR materials */}
      <mesh ref={ref} rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[6.371, 128, 64]} />
        <meshStandardMaterial
          map={textures.map}
          normalMap={textures.normalMap}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          roughnessMap={textures.specularMap}
          roughness={0.9}
          metalness={0.05}
          emissiveMap={textures.emissiveMap}
          emissive={new THREE.Color('#0b1a2a')}
          emissiveIntensity={0.4}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Enhanced atmosphere with better blending */}
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

      {/* Dynamic cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[6.39, 128, 64]} />
        <meshPhongMaterial
          map={clouds}
          transparent
          opacity={0.4}
          depthWrite={false}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function SunVisual() {
  const sunTexture = useTexture('https://threejs.org/examples/textures/planets/sun.jpg') as THREE.Texture
  const ref = useRef<THREE.Mesh>(null)

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
      {/* Enhanced sun with realistic material */}
      <mesh ref={ref}>
        <sphereGeometry args={[8, 64, 32]} />
        <meshStandardMaterial
          map={sunTexture}
          color="#FFD700"
          emissive={new THREE.Color("#FFA500")}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
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
  const texture = useTexture('https://threejs.org/examples/textures/planets/moon_1024.jpg') as THREE.Texture
  const ref = useRef<THREE.Mesh>(null)

  // Animate moon rotation (tidally locked, so very slow)
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0005 // Very slow rotation
    }
  })

  return (
    <group position={[60, 10, 30]}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.737, 64, 32]} />
        <meshStandardMaterial
          map={texture}
          roughness={1}
          metalness={0.05}
          color="#C0C0C0"
          emissive={new THREE.Color("#1a1a1a")}
          emissiveIntensity={0.02}
        />
      </mesh>
    </group>
  )
}

function MarsVisual() {
  const texture = useTexture('https://threejs.org/examples/textures/planets/mars_1k_color.jpg') as THREE.Texture
  const ref = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

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
      {/* Mars surface */}
      <mesh ref={ref}>
        <sphereGeometry args={[3.39, 64, 32]} />
        <meshStandardMaterial
          map={texture}
          roughness={1}
          metalness={0.02}
          color="#CD5C5C"
          emissive={new THREE.Color("#4a1a1a")}
          emissiveIntensity={0.01}
        />
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
