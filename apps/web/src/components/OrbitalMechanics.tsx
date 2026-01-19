import { useFrame, useLoader } from '@react-three/fiber'
import { useMemo, useRef, Suspense } from 'react'
import { Billboard, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three'

/**
 * Orbital Mechanics System - With Proper 3D Inclinations and Textures
 */

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

// Texture URLs from reliable CDN
const TEXTURE_URLS: Record<string, string> = {
  sun: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/sun.jpg',
  earth: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
  moon: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg',
  mars: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars_1k_color.jpg',
}

export interface CelestialBodyData {
  id: string
  name: string
  radiusKm: number
  semiMajorAxisKm: number
  orbitalPeriodDays: number
  eccentricity: number
  inclinationDeg: number
  longitudeOfAscendingNodeDeg: number
  argumentOfPeriapsisDeg: number
  meanAnomalyDeg: number
  color: string
  type: 'star' | 'planet' | 'moon'
  axialTiltDeg: number
  rotationPeriodHours: number
}

export const CELESTIAL_BODIES: CelestialBodyData[] = [
  {
    id: 'sun', name: 'Sun', radiusKm: 696340, semiMajorAxisKm: 0,
    orbitalPeriodDays: 0, eccentricity: 0, inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0, argumentOfPeriapsisDeg: 0, meanAnomalyDeg: 0,
    color: '#FFD700', type: 'star', axialTiltDeg: 7.25, rotationPeriodHours: 609
  },
  {
    id: 'mercury', name: 'Mercury', radiusKm: 2439.7, semiMajorAxisKm: 57909050,
    orbitalPeriodDays: 87.969, eccentricity: 0.2056, inclinationDeg: 28.0,  // Exaggerated 4x from 7.00
    longitudeOfAscendingNodeDeg: 48.3, argumentOfPeriapsisDeg: 29.1, meanAnomalyDeg: 174.8,
    color: '#8C7853', type: 'planet', axialTiltDeg: 0.034, rotationPeriodHours: 1407.6
  },
  {
    id: 'venus', name: 'Venus', radiusKm: 6051.8, semiMajorAxisKm: 108209475,
    orbitalPeriodDays: 224.701, eccentricity: 0.0067, inclinationDeg: 13.56,  // Exaggerated 4x from 3.39
    longitudeOfAscendingNodeDeg: 76.7, argumentOfPeriapsisDeg: 54.9, meanAnomalyDeg: 50.4,
    color: '#FFC649', type: 'planet', axialTiltDeg: 177.36, rotationPeriodHours: 5832.5
  },
  {
    id: 'earth', name: 'Earth', radiusKm: 6371, semiMajorAxisKm: 149597870.7,
    orbitalPeriodDays: 365.256, eccentricity: 0.0167, inclinationDeg: 0.0,  // Reference plane
    longitudeOfAscendingNodeDeg: 174.9, argumentOfPeriapsisDeg: 114.2, meanAnomalyDeg: 357.5,
    color: '#4A90E2', type: 'planet', axialTiltDeg: 23.44, rotationPeriodHours: 23.934
  },
  {
    id: 'moon', name: 'Moon', radiusKm: 1737.4, semiMajorAxisKm: 384400,
    orbitalPeriodDays: 27.322, eccentricity: 0.0549, inclinationDeg: 20.6,  // Exaggerated 4x from 5.145
    longitudeOfAscendingNodeDeg: 125.1, argumentOfPeriapsisDeg: 318.2, meanAnomalyDeg: 135.3,
    color: '#C0C0C0', type: 'moon', axialTiltDeg: 6.68, rotationPeriodHours: 655.7
  },
  {
    id: 'mars', name: 'Mars', radiusKm: 3389.5, semiMajorAxisKm: 227939200,
    orbitalPeriodDays: 686.98, eccentricity: 0.0934, inclinationDeg: 7.4,  // Exaggerated 4x from 1.85
    longitudeOfAscendingNodeDeg: 49.6, argumentOfPeriapsisDeg: 286.5, meanAnomalyDeg: 19.4,
    color: '#CD5C5C', type: 'planet', axialTiltDeg: 25.19, rotationPeriodHours: 24.623
  },
  {
    id: 'jupiter', name: 'Jupiter', radiusKm: 69911, semiMajorAxisKm: 778299000,
    orbitalPeriodDays: 4332.59, eccentricity: 0.0489, inclinationDeg: 5.2,  // Exaggerated 4x from 1.304
    longitudeOfAscendingNodeDeg: 100.5, argumentOfPeriapsisDeg: 273.9, meanAnomalyDeg: 20.0,
    color: '#D8CA9D', type: 'planet', axialTiltDeg: 3.13, rotationPeriodHours: 9.842
  },
  {
    id: 'saturn', name: 'Saturn', radiusKm: 58232, semiMajorAxisKm: 1432041000,
    orbitalPeriodDays: 10755.7, eccentricity: 0.0565, inclinationDeg: 9.94,  // Exaggerated 4x from 2.485
    longitudeOfAscendingNodeDeg: 113.7, argumentOfPeriapsisDeg: 339.4, meanAnomalyDeg: 317.0,
    color: '#FAD5A5', type: 'planet', axialTiltDeg: 26.73, rotationPeriodHours: 10.656
  },
  {
    id: 'uranus', name: 'Uranus', radiusKm: 25362, semiMajorAxisKm: 2867043000,
    orbitalPeriodDays: 30688.5, eccentricity: 0.0457, inclinationDeg: 3.1,  // Exaggerated 4x from 0.772
    longitudeOfAscendingNodeDeg: 74.0, argumentOfPeriapsisDeg: 96.5, meanAnomalyDeg: 142.2,
    color: '#4FD0E7', type: 'planet', axialTiltDeg: 97.77, rotationPeriodHours: 17.24
  },
  {
    id: 'neptune', name: 'Neptune', radiusKm: 24622, semiMajorAxisKm: 4515000000,
    orbitalPeriodDays: 60182, eccentricity: 0.0113, inclinationDeg: 7.07,  // Exaggerated 4x from 1.767
    longitudeOfAscendingNodeDeg: 131.8, argumentOfPeriapsisDeg: 276.3, meanAnomalyDeg: 256.2,
    color: '#4B70DD', type: 'planet', axialTiltDeg: 28.32, rotationPeriodHours: 16.11
  }
]

function calculateOrbitalPosition(
  body: CelestialBodyData,
  timeSeconds: number,
  parentPosition = new THREE.Vector3(0, 0, 0)
): THREE.Vector3 {
  if (body.type === 'star') return parentPosition.clone()

  const timeInDays = timeSeconds / CONSTANTS.SECONDS_PER_DAY
  const orbitalProgress = (timeInDays / body.orbitalPeriodDays) % 1
  const meanAnomaly = ((body.meanAnomalyDeg / 360) + orbitalProgress) * 2 * Math.PI

  let E = meanAnomaly
  for (let iter = 0; iter < 10; iter++) {
    E = meanAnomaly + body.eccentricity * Math.sin(E)
  }

  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + body.eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - body.eccentricity) * Math.cos(E / 2)
  )

  const a = body.semiMajorAxisKm * DISTANCE_SCALE
  const r = a * (1 - body.eccentricity * Math.cos(E))

  // Orbital elements in radians
  const inc = body.inclinationDeg * Math.PI / 180
  const omega = body.longitudeOfAscendingNodeDeg * Math.PI / 180
  const w = body.argumentOfPeriapsisDeg * Math.PI / 180

  // Position in orbital plane
  const xOrb = r * Math.cos(trueAnomaly + w)
  const yOrb = r * Math.sin(trueAnomaly + w)

  // Transform to 3D ecliptic coordinates with PROPER inclination
  const cosInc = Math.cos(inc)
  const sinInc = Math.sin(inc)
  const cosOmega = Math.cos(omega)
  const sinOmega = Math.sin(omega)

  // Apply orbital transformations - this gives proper 3D positions
  const x = xOrb * cosOmega - yOrb * cosInc * sinOmega
  const y = xOrb * sinOmega + yOrb * cosInc * cosOmega
  const z = yOrb * sinInc  // This is the key - z depends on inclination

  return new THREE.Vector3(x, z, y).add(parentPosition)
}

function OrbitPath({ body }: { body: CelestialBodyData }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = []
    const segments = 128

    const a = body.semiMajorAxisKm * DISTANCE_SCALE
    const b = a * Math.sqrt(1 - body.eccentricity * body.eccentricity)

    // Orbital elements in radians
    const inc = body.inclinationDeg * Math.PI / 180
    const omega = body.longitudeOfAscendingNodeDeg * Math.PI / 180
    const w = body.argumentOfPeriapsisDeg * Math.PI / 180

    const cosInc = Math.cos(inc)
    const sinInc = Math.sin(inc)
    const cosOmega = Math.cos(omega)
    const sinOmega = Math.sin(omega)
    const cosW = Math.cos(w)
    const sinW = Math.sin(w)

    for (let k = 0; k <= segments; k++) {
      const theta = (k / segments) * 2 * Math.PI

      // Ellipse in orbital plane (centered at focus)
      const xOrb = a * Math.cos(theta) - a * body.eccentricity
      const yOrb = b * Math.sin(theta)

      // Rotate by argument of periapsis
      const x1 = xOrb * cosW - yOrb * sinW
      const y1 = xOrb * sinW + yOrb * cosW

      // Apply inclination and longitude of ascending node
      const x = x1 * cosOmega - y1 * cosInc * sinOmega
      const y = x1 * sinOmega + y1 * cosInc * cosOmega
      const z = y1 * sinInc  // Proper 3D - orbit tilts out of plane

      pts.push([x, z, y])
    }

    return pts
  }, [body])

  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={0.5}
      transparent
      opacity={0.3}
      depthWrite={false}
    />
  )
}

// Textured planet component
function TexturedPlanet({ body, position, scaledRadius }: {
  body: CelestialBodyData
  position: THREE.Vector3
  scaledRadius: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureUrl = TEXTURE_URLS[body.id]

  // Load texture if available
  const texture = textureUrl ? useLoader(TextureLoader, textureUrl) : null

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y += 0.001 * (body.rotationPeriodHours > 0 ? 24 / body.rotationPeriodHours : 1)
    }
  })

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[scaledRadius, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        color={texture ? undefined : body.color}
        roughness={body.type === 'star' ? 0.1 : 0.7}
        metalness={0.1}
        emissive={body.type === 'star' ? body.color : '#000000'}
        emissiveIntensity={body.type === 'star' ? 1.0 : 0}
      />
    </mesh>
  )
}

// Simple colored planet (fallback)
function ColoredPlanet({ body, position, scaledRadius }: {
  body: CelestialBodyData
  position: THREE.Vector3
  scaledRadius: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[scaledRadius, 32, 32]} />
      <meshStandardMaterial
        color={body.color}
        roughness={body.type === 'star' ? 0.1 : 0.7}
        metalness={0.1}
        emissive={body.type === 'star' ? body.color : '#000000'}
        emissiveIntensity={body.type === 'star' ? 1.0 : 0}
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
  showOrbits = true,
  showLabels = true
}: OrbitalSystemProps) {
  const bodyPositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>()
    positions.set('sun', new THREE.Vector3(0, 0, 0))

    // First pass: calculate Earth position (needed for Moon)
    const earth = CELESTIAL_BODIES.find(b => b.id === 'earth')!
    const earthPos = calculateOrbitalPosition(earth, simulationTime)
    positions.set('earth', earthPos)

    // Calculate all other positions
    CELESTIAL_BODIES.forEach(body => {
      if (body.type === 'star' || body.id === 'earth') return

      if (body.id === 'moon') {
        // Moon orbits Earth with faster time multiplier
        positions.set('moon', calculateOrbitalPosition(body, simulationTime * 50, earthPos))
      } else {
        positions.set(body.id, calculateOrbitalPosition(body, simulationTime))
      }
    })

    return positions
  }, [simulationTime])

  return (
    <group>
      {/* Orbital paths with proper 3D inclinations */}
      {showOrbits && CELESTIAL_BODIES.filter(b => b.type === 'planet').map(body => (
        <OrbitPath key={`orbit-${body.id}`} body={body} />
      ))}

      {/* Celestial bodies */}
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
