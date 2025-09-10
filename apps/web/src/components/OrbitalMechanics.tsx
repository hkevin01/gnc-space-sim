import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { useSafeTexture } from '../utils/textures'
import { getPlanetTexture } from '../utils/planetaryTextures'
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

// Scale factors for visualization (consistent with SolarSystem):
// 1 scene unit = 1 million km for distances. Radii converted from km → units with visibility multipliers.
export const SCALE_FACTORS = {
  DISTANCE: 1 / 1_000_000,      // 1 AU ≈ 149.6 units (matches classic SolarSystem view)
  TIME: 3600                    // 1 second = 1 hour for time acceleration
}

// Radius conversion and visibility multipliers
const KM_PER_SCENE_UNIT = 1_000_000 // 1e6 km per scene unit (same base as distances)
const RADIUS_SCENE_CONVERSION = 1 / KM_PER_SCENE_UNIT
const SIZE_MULT = {
  SUN: 12,
  INNER: 40, // Mercury, Venus, Earth, Mars
  MOON: 40,
  GAS: 60    // Jupiter, Saturn, Uranus, Neptune
} as const

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
  axialTiltDeg?: number // Axial tilt in degrees
  rotationDirection?: number // 1 for normal, -1 for retrograde
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
    type: 'star',
    axialTiltDeg: 7.25, // Sun's axial tilt
    rotationDirection: 1
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
    type: 'planet',
    axialTiltDeg: 23.44, // Earth's axial tilt (causes seasons)
    rotationDirection: 1
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
    type: 'moon',
    axialTiltDeg: 6.68, // Moon's axial tilt
    rotationDirection: 1
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
    type: 'planet',
    axialTiltDeg: 25.19, // Mars axial tilt (similar to Earth)
    rotationDirection: 1
  },
  {
    id: 'venus',
    name: 'Venus',
    radiusKm: 6052,
    massKg: 4.867e24,
    semiMajorAxisKm: 108208000, // 0.72 AU
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5, // Retrograde rotation (negative)
    eccentricity: 0.0067,
    inclinationDeg: 3.39,
    longitudeOfAscendingNodeDeg: 76.7,
    argumentOfPeriapsisDeg: 131.6,
    meanAnomalyDeg: 50.1,
    color: '#FFC649',
    texture: 'venus_surface.jpg',
    type: 'planet',
    axialTiltDeg: 177.36, // Venus is almost upside down
    rotationDirection: -1 // Retrograde rotation
  },
  {
    id: 'mercury',
    name: 'Mercury',
    radiusKm: 2440,
    massKg: 3.301e23,
    semiMajorAxisKm: 57909100, // 0.39 AU
    orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1407.6, // 58.65 Earth days
    eccentricity: 0.2056,
    inclinationDeg: 7.00,
    longitudeOfAscendingNodeDeg: 48.3,
    argumentOfPeriapsisDeg: 29.1,
    meanAnomalyDeg: 174.8,
    color: '#8C7853',
    texture: 'mercury.jpg',
    type: 'planet',
    axialTiltDeg: 0.034, // Mercury's tiny axial tilt
    rotationDirection: 1
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    radiusKm: 69911,
    massKg: 1.898e27,
    semiMajorAxisKm: 778299000, // 5.20 AU
    orbitalPeriodDays: 4332.59,
    rotationPeriodHours: 9.842, // Fastest planetary rotation
    eccentricity: 0.0489,
    inclinationDeg: 1.304,
    longitudeOfAscendingNodeDeg: 100.5,
    argumentOfPeriapsisDeg: 273.9,
    meanAnomalyDeg: 20.0,
    color: '#D8CA9D',
    texture: 'jupiter.jpg',
    type: 'planet',
    axialTiltDeg: 3.13, // Very small tilt
    rotationDirection: 1
  },
  {
    id: 'saturn',
    name: 'Saturn',
    radiusKm: 58232,
    massKg: 5.683e26,
    semiMajorAxisKm: 1432041000, // 9.57 AU
    orbitalPeriodDays: 10755.7,
    rotationPeriodHours: 10.656,
    eccentricity: 0.0565,
    inclinationDeg: 2.485,
    longitudeOfAscendingNodeDeg: 113.7,
    argumentOfPeriapsisDeg: 339.4,
    meanAnomalyDeg: 317.0,
    color: '#FAD5A5',
    texture: 'saturn.jpg',
    type: 'planet',
    axialTiltDeg: 26.73, // Saturn's tilt
    rotationDirection: 1
  },
  {
    id: 'uranus',
    name: 'Uranus',
    radiusKm: 25362,
    massKg: 8.681e25,
    semiMajorAxisKm: 2867043000, // 19.16 AU
    orbitalPeriodDays: 30688.5,
    rotationPeriodHours: -17.24, // Retrograde rotation
    eccentricity: 0.0457,
    inclinationDeg: 0.772,
    longitudeOfAscendingNodeDeg: 74.0,
    argumentOfPeriapsisDeg: 96.5,
    meanAnomalyDeg: 142.2,
    color: '#4FD0E7',
    texture: 'uranus.jpg',
    type: 'planet',
    axialTiltDeg: 97.77, // Uranus is tilted on its side!
    rotationDirection: -1 // Retrograde rotation
  },
  {
    id: 'neptune',
    name: 'Neptune',
    radiusKm: 24622,
    massKg: 1.024e26,
    semiMajorAxisKm: 4515000000, // 30.18 AU
    orbitalPeriodDays: 60182,
    rotationPeriodHours: 16.11,
    eccentricity: 0.0113,
    inclinationDeg: 1.767,
    longitudeOfAscendingNodeDeg: 131.8,
    argumentOfPeriapsisDeg: 276.3,
    meanAnomalyDeg: 256.2,
    color: '#4B70DD',
    texture: 'neptune.jpg',
    type: 'planet',
    axialTiltDeg: 28.32, // Neptune's axial tilt
    rotationDirection: 1
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
    const rotationDirection = body.rotationDirection || 1
    const rotationAngle = (timeInHours / Math.abs(body.rotationPeriodHours)) * 2 * Math.PI * rotationDirection
    return rotationAngle
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

    // Calculate positions for all planets
    CELESTIAL_BODIES.forEach(body => {
      if (body.type === 'star') return // Skip sun, already set

      if (body.id === 'moon') {
        // Moon orbits Earth
        const earthPos = positions.get('earth') || OrbitalPhysics.calculateOrbitalPosition(
          CELESTIAL_BODIES.find(b => b.id === 'earth')!,
          simulationTime
        )
        const moonPos = OrbitalPhysics.calculateOrbitalPosition(
          body,
          simulationTime,
          earthPos
        )
        positions.set('moon', moonPos)
      } else {
        // All other bodies orbit the Sun
        const bodyPos = OrbitalPhysics.calculateOrbitalPosition(
          body,
          simulationTime
        )
        positions.set(body.id, bodyPos)
      }
    })

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
  const { semiMajorAxisKm: aKm, eccentricity: e, inclinationDeg: iDeg, longitudeOfAscendingNodeDeg: omegaDeg, argumentOfPeriapsisDeg: wDeg } = body
  const points = useMemo(() => {
    const orbitPoints: THREE.Vector3[] = []
    const segments = 256

    const a = aKm * SCALE_FACTORS.DISTANCE // semi-major axis in scene units
    const b = a * Math.sqrt(1 - e * e)      // semi-minor axis

    const i = iDeg * Math.PI / 180
    const omega = omegaDeg * Math.PI / 180
    const w = wDeg * Math.PI / 180

    const cosI = Math.cos(i), sinI = Math.sin(i)
    const cosO = Math.cos(omega), sinO = Math.sin(omega)
    const cosW = Math.cos(w), sinW = Math.sin(w)

    for (let k = 0; k <= segments; k++) {
      const theta = (k / segments) * 2 * Math.PI
      // Parametric ellipse in orbital plane with periapsis alignment
      const xOrb = a * Math.cos(theta) - a * e // center offset to focus
      const yOrb = b * Math.sin(theta)

      // Rotate by argument of periapsis, then apply inclination and node
      const x1 = xOrb * cosW - yOrb * sinW
      const y1 = xOrb * sinW + yOrb * cosW

      const xEC = x1
      const yEC = y1 * cosI
      const zEC = y1 * sinI

      const x = xEC * cosO - yEC * sinO
      const y = xEC * sinO + yEC * cosO
      const z = zEC

      orbitPoints.push(new THREE.Vector3(x, z, y))
    }

    return orbitPoints
  }, [aKm, e, iDeg, omegaDeg, wDeg])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  return (
    <primitive object={new THREE.Line(geometry)}>
      <lineBasicMaterial
        color={body.color}
        transparent
        opacity={0.35}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
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

  // Load planet texture (fallbacks included)
  const planetTexture = useSafeTexture(
    useMemo(() => getPlanetTexture(body.name.toUpperCase()), [body.name])
  )

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(position)
      meshRef.current.rotation.y = rotation

      // Apply axial tilt for realistic planetary orientation
      const axialTiltRad = ((body.axialTiltDeg || 0) * Math.PI) / 180
      meshRef.current.rotation.z = axialTiltRad
    }
  })

  // Choose a size multiplier based on body type/id
  const sizeMult = body.type === 'star'
    ? SIZE_MULT.SUN
    : body.id === 'moon'
      ? SIZE_MULT.MOON
      : (body.id === 'mercury' || body.id === 'venus' || body.id === 'earth' || body.id === 'mars')
        ? SIZE_MULT.INNER
        : SIZE_MULT.GAS

  const scaledRadius = Math.max(body.radiusKm * RADIUS_SCENE_CONVERSION * sizeMult, body.type === 'star' ? 1 : 0.1)

  return (
    <group>
    <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[scaledRadius, 32, 16]} />
        <meshStandardMaterial
      map={planetTexture || undefined}
      color={planetTexture ? undefined : body.color}
          roughness={body.type === 'star' ? 0 : 0.6}
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

  const venusPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'venus')!,
    simulationTime
  )
  positions.set('venus', venusPos)

  const mercuryPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'mercury')!,
    simulationTime
  )
  positions.set('mercury', mercuryPos)

  const jupiterPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'jupiter')!,
    simulationTime
  )
  positions.set('jupiter', jupiterPos)

  const saturnPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'saturn')!,
    simulationTime
  )
  positions.set('saturn', saturnPos)

  const uranusPos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'uranus')!,
    simulationTime
  )
  positions.set('uranus', uranusPos)

  const neptunePos = OrbitalPhysics.calculateOrbitalPosition(
    CELESTIAL_BODIES.find(b => b.id === 'neptune')!,
    simulationTime
  )
  positions.set('neptune', neptunePos)

  return positions
}
