import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Orbital Mechanics System
 *
 * Implements realistic orbital physics and celestial body positioning
 * based on the Solar System project's advanced calculations
 */

// Physical constants (real values)
export const CONSTANTS = {
  AU_KM: 149597870.7,           // Astronomical Unit in kilometers
  EARTH_RADIUS_KM: 6371,        // Earth radius in kilometers
  MOON_DISTANCE_KM: 384400,     // Moon distance in kilometers
  MARS_DISTANCE_AU: 1.52,       // Mars average distance in AU
  G: 6.67430e-11,              // Gravitational constant
  EARTH_MASS: 5.972e24,         // Earth mass in kg
  SUN_MASS: 1.989e30,           // Sun mass in kg
  SECONDS_PER_DAY: 86400        // Seconds in a day
}

// Scale factors for visualization
export const SCALE_FACTORS = {
  DISTANCE: 1 / 10000,          // Scale down distances for visual clarity
  RADIUS: 1 / 1000,             // Scale down radii
  TIME: 3600                    // 1 second = 1 hour for time acceleration
}

/**
 * Celestial Body Data with real orbital parameters
 */
export interface CelestialBodyData {
  id: string
  name: string
  radiusKm: number
  massKg: number
  semiMajorAxisKm: number
  orbitalPeriodDays: number
  rotationPeriodHours: number
  eccentricity: number
  inclinationDeg: number
  longitudeOfAscendingNodeDeg: number
  argumentOfPeriapsisDeg: number
  meanAnomalyDeg: number
  color: string
  texture?: string
  type: 'star' | 'planet' | 'moon' | 'asteroid'
}

export const CELESTIAL_BODIES: CelestialBodyData[] = [
  {
    id: 'sun',
    name: 'Sun',
    radiusKm: 696340,
    massKg: 1.989e30,
    semiMajorAxisKm: 0,
    orbitalPeriodDays: 0,
    rotationPeriodHours: 609.12, // ~25.4 days
    eccentricity: 0,
    inclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    color: '#FFD700',
    texture: 'sun.jpg',
    type: 'star'
  },
  {
    id: 'earth',
    name: 'Earth',
    radiusKm: 6371,
    massKg: 5.972e24,
    semiMajorAxisKm: 149597870.7, // 1 AU
    orbitalPeriodDays: 365.256,
    rotationPeriodHours: 23.934, // Sidereal day
    eccentricity: 0.0167,
    inclinationDeg: 0, // Reference plane
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 114.2,
    meanAnomalyDeg: 357.5,
    color: '#6B93D6',
    texture: 'earth_atmos_2048.jpg',
    type: 'planet'
  },
  {
    id: 'moon',
    name: 'Moon',
    radiusKm: 1737,
    massKg: 7.342e22,
    semiMajorAxisKm: 384400,
    orbitalPeriodDays: 27.322,
    rotationPeriodHours: 655.7, // Tidally locked
    eccentricity: 0.0549,
    inclinationDeg: 5.145,
    longitudeOfAscendingNodeDeg: 125.1,
    argumentOfPeriapsisDeg: 318.2,
    meanAnomalyDeg: 135.3,
    color: '#C0C0C0',
    texture: 'moon_1024.jpg',
    type: 'moon'
  },
  {
    id: 'mars',
    name: 'Mars',
    radiusKm: 3390,
    massKg: 6.39e23,
    semiMajorAxisKm: 227939200, // 1.52 AU
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.623,
    eccentricity: 0.0934,
    inclinationDeg: 1.85,
    longitudeOfAscendingNodeDeg: 49.6,
    argumentOfPeriapsisDeg: 286.5,
    meanAnomalyDeg: 19.4,
    color: '#CD5C5C',
    texture: 'mars_1k_color.jpg',
    type: 'planet'
  }
]

/**
 * Orbital Physics Calculator
 */
export class OrbitalPhysics {
  static calculateOrbitalPosition(
    body: CelestialBodyData,
    timeElapsed: number,
    parentPosition = new THREE.Vector3(0, 0, 0)
  ): THREE.Vector3 {
    if (body.type === 'star') {
      return parentPosition.clone()
    }

    // Convert time to orbital periods
    const timeInDays = timeElapsed * SCALE_FACTORS.TIME / CONSTANTS.SECONDS_PER_DAY
    const orbitalProgress = (timeInDays / body.orbitalPeriodDays) % 1

    // Mean anomaly at current time
    const meanAnomaly = (body.meanAnomalyDeg + orbitalProgress * 360) * Math.PI / 180

    // Solve Kepler's equation for eccentric anomaly (simplified)
    let eccentricAnomaly = meanAnomaly
    for (let i = 0; i < 5; i++) {
      eccentricAnomaly = meanAnomaly + body.eccentricity * Math.sin(eccentricAnomaly)
    }

    // True anomaly
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + body.eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - body.eccentricity) * Math.cos(eccentricAnomaly / 2)
    )

    // Distance from focus
    const distance = body.semiMajorAxisKm * (1 - body.eccentricity * Math.cos(eccentricAnomaly))

    // Position in orbital plane
    const x = distance * Math.cos(trueAnomaly + body.argumentOfPeriapsisDeg * Math.PI / 180)
    const y = distance * Math.sin(trueAnomaly + body.argumentOfPeriapsisDeg * Math.PI / 180)

    // Apply inclination and node rotation
    const cosInc = Math.cos(body.inclinationDeg * Math.PI / 180)
    const sinInc = Math.sin(body.inclinationDeg * Math.PI / 180)
    const cosNode = Math.cos(body.longitudeOfAscendingNodeDeg * Math.PI / 180)
    const sinNode = Math.sin(body.longitudeOfAscendingNodeDeg * Math.PI / 180)

    const position = new THREE.Vector3(
      (cosNode * x - sinNode * y * cosInc) * SCALE_FACTORS.DISTANCE,
      (sinNode * x + cosNode * y * cosInc) * SCALE_FACTORS.DISTANCE,
      y * sinInc * SCALE_FACTORS.DISTANCE
    )

    return position.add(parentPosition)
  }

  static calculateRotation(body: CelestialBodyData, timeElapsed: number): number {
    const timeInHours = timeElapsed * SCALE_FACTORS.TIME / 3600
    return (timeInHours / body.rotationPeriodHours) * 2 * Math.PI
  }

  static calculateOrbitalVelocity(body: CelestialBodyData, parentMass: number): number {
    // Vis-viva equation: v = sqrt(GM * (2/r - 1/a))
    const GM = CONSTANTS.G * parentMass
    const r = body.semiMajorAxisKm * 1000 // Convert to meters
    const a = body.semiMajorAxisKm * 1000

    return Math.sqrt(GM * (2 / r - 1 / a)) / 1000 // Convert back to km/s
  }
}

/**
 * Orbital Visualization Component
 */
interface OrbitalSystemProps {
  simulationTime: number
  showOrbits?: boolean
  showLabels?: boolean
}

export function OrbitalSystem({
  simulationTime,
  showOrbits = true,
  showLabels = false
}: OrbitalSystemProps) {
  const systemRef = useRef<THREE.Group>(null)

  // Calculate positions for all bodies
  const bodyPositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>()

    // Sun at origin
    positions.set('sun', new THREE.Vector3(0, 0, 0))

    // Earth around Sun
    const earthPos = OrbitalPhysics.calculateOrbitalPosition(
      CELESTIAL_BODIES.find(b => b.id === 'earth')!,
      simulationTime
    )
    positions.set('earth', earthPos)

    // Moon around Earth
    const moonPos = OrbitalPhysics.calculateOrbitalPosition(
      CELESTIAL_BODIES.find(b => b.id === 'moon')!,
      simulationTime,
      earthPos
    )
    positions.set('moon', moonPos)

    // Mars around Sun
    const marsPos = OrbitalPhysics.calculateOrbitalPosition(
      CELESTIAL_BODIES.find(b => b.id === 'mars')!,
      simulationTime
    )
    positions.set('mars', marsPos)

    return positions
  }, [simulationTime])

  return (
    <group ref={systemRef}>
      {/* Orbital paths */}
      {showOrbits && (
        <group>
          {CELESTIAL_BODIES.filter(body => body.type !== 'star').map(body => (
            <OrbitPath key={body.id} body={body} />
          ))}
        </group>
      )}

      {/* Celestial bodies */}
      {CELESTIAL_BODIES.map(body => {
        const position = bodyPositions.get(body.id) || new THREE.Vector3()
        const rotation = OrbitalPhysics.calculateRotation(body, simulationTime)

        return (
          <CelestialBodyMesh
            key={body.id}
            body={body}
            position={position}
            rotation={rotation}
            showLabel={showLabels}
          />
        )
      })}
    </group>
  )
}

/**
 * Orbit Path Visualization
 */
function OrbitPath({ body }: { body: CelestialBodyData }) {
  const points = useMemo(() => {
    const orbitPoints: THREE.Vector3[] = []
    const segments = 128

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI
      const distance = body.semiMajorAxisKm * SCALE_FACTORS.DISTANCE

      // Simple circular orbit for visualization
      const x = distance * Math.cos(angle)
      const z = distance * Math.sin(angle)

      orbitPoints.push(new THREE.Vector3(x, 0, z))
    }

    return orbitPoints
  }, [body])

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points)
    return geom
  }, [points])

  return (
    <primitive object={new THREE.Line(geometry)}>
      <lineBasicMaterial
        color={body.color}
        transparent
        opacity={0.3}
      />
    </primitive>
  )
}

/**
 * Individual Celestial Body Mesh
 */
interface CelestialBodyMeshProps {
  body: CelestialBodyData
  position: THREE.Vector3
  rotation: number
  showLabel: boolean
}

function CelestialBodyMesh({
  body,
  position,
  rotation,
  showLabel
}: CelestialBodyMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y = rotation
    }
  })

  const scaledRadius = body.radiusKm * SCALE_FACTORS.RADIUS

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[scaledRadius, 32, 16]} />
        <meshStandardMaterial
          color={body.color}
          roughness={body.type === 'star' ? 0 : 0.9}
          metalness={body.type === 'star' ? 0 : 0.1}
          emissive={body.type === 'star' ? body.color : '#000000'}
          emissiveIntensity={body.type === 'star' ? 0.5 : 0}
        />
      </mesh>

      {showLabel && (
        <Billboard position={position}>
          <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {body.name}
          </div>
        </Billboard>
      )}
    </group>
  )
}

/**
 * Billboard component for labels (placeholder - would need HTML integration)
 */
function Billboard({
  position: _position,
  children: _children
}: {
  position: THREE.Vector3
  children: React.ReactNode
}) {
  // This would be implemented with Html from @react-three/drei
  // For now, return null as placeholder
  // Use variables to satisfy ESLint unused warnings
  void _position; void _children;
  return null
}

/**
 * Utility function to get current celestial body positions
 */
export function getCelestialBodyPositions(simulationTime: number) {
  const positions = new Map<string, THREE.Vector3>()

  positions.set('sun', new THREE.Vector3(0, 0, 0))

  const earthPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'earth')!,
    simulationTime
  )
  positions.set('earth', earthPos)

  const moonPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'moon')!,
    simulationTime,
    earthPos
  )
  positions.set('moon', moonPos)

  const marsPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'mars')!,
    simulationTime
  )
  positions.set('mars', marsPos)

  return positions
}
