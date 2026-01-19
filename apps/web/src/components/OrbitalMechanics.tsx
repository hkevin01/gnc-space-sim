import { useFrame, useLoader } from '@react-three/fiber'
import { useMemo, useRef, Suspense, useState, useEffect } from 'react'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three/src/loaders/TextureLoader.js'

export const CONSTANTS = {
  AU_KM: 149597870.7,
  SECONDS_PER_DAY: 86400
}

const DISTANCE_SCALE = 1 / 1_000_000
const RADIUS_SCALE = 1 / 1_000_000

const SIZE_MULT = {
  SUN: 50,
  INNER: 80,
  MOON: 80,
  GAS: 30
} as const

// Texture URLs - using LOCAL 2K assets from public folder (Solar System Scope)
const TEXTURE_URLS: Record<string, string> = {
  sun: '/assets/sun/sun_2k.jpg',
  earth: '/assets/earth/earth_2k.jpg',
  moon: '/assets/moon/moon_2k.jpg',
  mars: '/assets/mars/mars_color.jpg',
}

export interface CelestialBodyData {
  id: string
  name: string
  radiusKm: number
  semiMajorAxisKm: number
  orbitalPeriodDays: number
  eccentricity: number
  inclinationDeg: number
  color: string
  type: 'star' | 'planet' | 'moon'
}

export const CELESTIAL_BODIES: CelestialBodyData[] = [
  {
    id: 'sun', name: 'Sun', radiusKm: 696340, semiMajorAxisKm: 0,
    orbitalPeriodDays: 0, eccentricity: 0, inclinationDeg: 0,
    color: '#FFD700', type: 'star'
  },
  {
    id: 'mercury', name: 'Mercury', radiusKm: 2439.7, semiMajorAxisKm: 57909050,
    orbitalPeriodDays: 87.969, eccentricity: 0.2056, inclinationDeg: 7.0,
    color: '#8C7853', type: 'planet'
  },
  {
    id: 'venus', name: 'Venus', radiusKm: 6051.8, semiMajorAxisKm: 108209475,
    orbitalPeriodDays: 224.701, eccentricity: 0.0067, inclinationDeg: 3.39,
    color: '#FFC649', type: 'planet'
  },
  {
    id: 'earth', name: 'Earth', radiusKm: 6371, semiMajorAxisKm: 149597870.7,
    orbitalPeriodDays: 365.256, eccentricity: 0.0167, inclinationDeg: 0.0,
    color: '#4A90E2', type: 'planet'
  },
  {
    id: 'moon', name: 'Moon', radiusKm: 1737.4, semiMajorAxisKm: 384400,
    orbitalPeriodDays: 27.322, eccentricity: 0.0549, inclinationDeg: 5.145,
    color: '#C0C0C0', type: 'moon'
  },
  {
    id: 'mars', name: 'Mars', radiusKm: 3389.5, semiMajorAxisKm: 227939200,
    orbitalPeriodDays: 686.98, eccentricity: 0.0934, inclinationDeg: 1.85,
    color: '#CD5C5C', type: 'planet'
  },
  {
    id: 'jupiter', name: 'Jupiter', radiusKm: 69911, semiMajorAxisKm: 778299000,
    orbitalPeriodDays: 4332.59, eccentricity: 0.0489, inclinationDeg: 1.304,
    color: '#D8CA9D', type: 'planet'
  },
  {
    id: 'saturn', name: 'Saturn', radiusKm: 58232, semiMajorAxisKm: 1432041000,
    orbitalPeriodDays: 10755.7, eccentricity: 0.0565, inclinationDeg: 2.485,
    color: '#FAD5A5', type: 'planet'
  },
  {
    id: 'uranus', name: 'Uranus', radiusKm: 25362, semiMajorAxisKm: 2867043000,
    orbitalPeriodDays: 30688.5, eccentricity: 0.0457, inclinationDeg: 0.772,
    color: '#4FD0E7', type: 'planet'
  },
  {
    id: 'neptune', name: 'Neptune', radiusKm: 24622, semiMajorAxisKm: 4515000000,
    orbitalPeriodDays: 60182, eccentricity: 0.0113, inclinationDeg: 1.767,
    color: '#4B70DD', type: 'planet'
  }
]

function calculatePlanetPosition(body: CelestialBodyData, timeSeconds: number): THREE.Vector3 {
  if (body.type === 'star') return new THREE.Vector3(0, 0, 0)

  const timeInDays = timeSeconds / CONSTANTS.SECONDS_PER_DAY
  const orbitalProgress = (timeInDays / body.orbitalPeriodDays) % 1
  const angle = orbitalProgress * 2 * Math.PI

  const a = body.semiMajorAxisKm * DISTANCE_SCALE
  const r = a * (1 - body.eccentricity * body.eccentricity) / (1 + body.eccentricity * Math.cos(angle))

  const inc = body.inclinationDeg * Math.PI / 180

  const x = r * Math.cos(angle)
  const z = r * Math.sin(angle) * Math.cos(inc)
  const y = r * Math.sin(angle) * Math.sin(inc)

  return new THREE.Vector3(x, y, z)
}

// Individual texture components for each planet with textures
function SunMesh({ position, scaledRadius }: { position: THREE.Vector3; scaledRadius: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useLoader(TextureLoader, '/assets/sun/sun_2k.jpg')

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[scaledRadius, 64, 64]} />
      <meshStandardMaterial map={texture} emissive="#FFD700" emissiveIntensity={0.8} />
    </mesh>
  )
}

function EarthMesh({ position, scaledRadius }: { position: THREE.Vector3; scaledRadius: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useLoader(TextureLoader, '/assets/earth/earth_2k.jpg')

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y += 0.002
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[scaledRadius, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

function MoonMesh({ position, scaledRadius }: { position: THREE.Vector3; scaledRadius: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useLoader(TextureLoader, '/assets/moon/moon_2k.jpg')

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[scaledRadius, 32, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

function MarsMesh({ position, scaledRadius }: { position: THREE.Vector3; scaledRadius: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useLoader(TextureLoader, '/assets/mars/mars_color.jpg')

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y += 0.002
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[scaledRadius, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

function TexturedPlanet({ body, position, scaledRadius }: {
  body: CelestialBodyData
  position: THREE.Vector3
  scaledRadius: number
}) {
  // Use specific textured components for planets with textures
  if (body.id === 'sun') {
    return <SunMesh position={position} scaledRadius={scaledRadius} />
  }
  if (body.id === 'earth') {
    return <EarthMesh position={position} scaledRadius={scaledRadius} />
  }
  if (body.id === 'moon') {
    return <MoonMesh position={position} scaledRadius={scaledRadius} />
  }
  if (body.id === 'mars') {
    return <MarsMesh position={position} scaledRadius={scaledRadius} />
  }

  // Fallback for planets without textures
  return <ColoredPlanet body={body} position={position} scaledRadius={scaledRadius} />
}

function ColoredPlanet({ body, position, scaledRadius }: {
  body: CelestialBodyData
  position: THREE.Vector3
  scaledRadius: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y += 0.002
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[scaledRadius, 32, 32]} />
      <meshStandardMaterial
        color={body.color}
        emissive={body.type === 'star' ? body.color : '#000000'}
        emissiveIntensity={body.type === 'star' ? 0.8 : 0}
      />
    </mesh>
  )
}

function CelestialBodyMesh({
  body,
  position,
  showLabel
}: {
  body: CelestialBodyData
  position: THREE.Vector3
  showLabel: boolean
}) {
  const sizeMult = body.type === 'star' ? SIZE_MULT.SUN
    : body.type === 'moon' ? SIZE_MULT.MOON
      : ['mercury', 'venus', 'earth', 'mars'].includes(body.id) ? SIZE_MULT.INNER
        : SIZE_MULT.GAS

  const scaledRadius = Math.max(body.radiusKm * RADIUS_SCALE * sizeMult, body.type === 'star' ? 5 : 0.5)
  const hasTexture = body.id in TEXTURE_URLS

  return (
    <group>
      {hasTexture ? (
        <Suspense fallback={<ColoredPlanet body={body} position={position} scaledRadius={scaledRadius} />}>
          <TexturedPlanet body={body} position={position} scaledRadius={scaledRadius} />
        </Suspense>
      ) : (
        <ColoredPlanet body={body} position={position} scaledRadius={scaledRadius} />
      )}

      {showLabel && (
        <Billboard position={[position.x, position.y + scaledRadius * 2.5, position.z]}>
          <Text
            fontSize={Math.max(scaledRadius * 0.8, 2)}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.1}
            outlineColor="black"
          >
            {body.name}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

interface OrbitalSystemProps {
  simulationTime: number
  showOrbits?: boolean
  showLabels?: boolean
}

export function OrbitalSystem({
  simulationTime,
  showOrbits = false,
  showLabels = true
}: OrbitalSystemProps) {
  const bodyPositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>()

    // Sun at center
    positions.set('sun', new THREE.Vector3(0, 0, 0))

    // Calculate Earth position first (needed for Moon)
    const earth = CELESTIAL_BODIES.find(b => b.id === 'earth')!
    const earthPos = calculatePlanetPosition(earth, simulationTime)
    positions.set('earth', earthPos)

    // Calculate Moon position RELATIVE to Earth
    const moon = CELESTIAL_BODIES.find(b => b.id === 'moon')!
    const moonLocalPos = calculatePlanetPosition(moon, simulationTime * 30) // Speed up moon orbit
    const moonWorldPos = earthPos.clone().add(moonLocalPos)
    positions.set('moon', moonWorldPos)

    // Calculate other planets
    CELESTIAL_BODIES.forEach(body => {
      if (body.type === 'star' || body.id === 'earth' || body.id === 'moon') return
      positions.set(body.id, calculatePlanetPosition(body, simulationTime))
    })

    return positions
  }, [simulationTime])

  return (
    <group>
      {CELESTIAL_BODIES.map(body => (
        <CelestialBodyMesh
          key={body.id}
          body={body}
          position={bodyPositions.get(body.id) || new THREE.Vector3()}
          showLabel={showLabels}
        />
      ))}
    </group>
  )
}
