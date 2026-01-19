import { useFrame } from '@react-three/fiber'
import {
  generateAsteroidBelt
} from '../utils/astronomicalData'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useSafeTexture, assetUrl } from '../utils/textures'
import { getPlanetTexture } from '../utils/planetaryTextures'
import { StarField } from './StarField'
import { useNasaPositions } from '../hooks/useNasaPositions'
import { Html, Environment } from '@react-three/drei'
import { PlanetPosition } from '../services/planetaryPositionService'

/**
 * ACCURATE SOLAR SYSTEM IMPLEMENTATION
 * ====================================
 *
 * Distance Scale: 1 scene unit = 1 million km (UPDATED FOR BETTER VISIBILITY)
 * - Mercury: 57.91 scene units (57.91 million km)
 * - Venus: 108.21 scene units (108.21 million km)
 * - Earth: 149.60 scene units (149.60 million km = 1 AU)
 * - Mars: 227.92 scene units (227.92 million km)
 * - Jupiter: 778.57 scene units (778.57 million km)
 * - Saturn: 1433.53 scene units (1433.53 million km)
 * - Uranus: 2872.46 scene units (2872.46 million km)
 * - Neptune: 4495.06 scene units (4495.06 million km)
 *
 * Size Scale: radius / 10 for visibility while maintaining proportions (INCREASED FROM /200)
 * - Inner planets scaled by 0.5x for better visibility
 * - Gas giants scaled by 0.1x to prevent dominance
 * - Uses accurate NASA planetary radii from physics.info/astronomical/
 * - All orbital mechanics and rotational data are NASA-accurate
 * - Moon orbits Earth at accurate distance (0.3844 scene units = 384,400 km)
 *
 * Data Sources: NASA JPL Horizons API + physics.info astronomical data
 */

// Simplified solar system data structure with realistic orbital mechanics
interface PlanetData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  texture?: any
  radius: number
  sceneRadius: number
  orbitRadius?: number
  color: string
  rotationSpeed: number
  orbitSpeed?: number
  hasRings?: boolean
  parentOrbitRadius?: number // For moons
  // New realistic orbital properties
  siderealPeriodDays: number // Actual orbital period in Earth days
  rotationPeriodHours: number // Actual rotation period in hours
  orbitalInclination: number // Inclination to ecliptic in degrees
  rotationDirection: number // 1 for normal, -1 for retrograde
  axialTilt: number // Axial tilt in degrees
  eccentricity: number // Orbital eccentricity (0 = perfect circle, approaching 1 = very elliptical)
  initialMeanAnomaly?: number // Starting position in orbit (0 to 2π)
}

// Solar system data with accurate NASA measurements and proper scaling
// Base scale: 1 scene unit = 1 million km for distances
const DISTANCE_SCALE = 1; // 1 scene unit = 1 million km
// Convert radii (km) into scene units using the same base as distances (km → scene units)
const KM_PER_SCENE_UNIT = 1_000_000 * DISTANCE_SCALE; // 1e6 km per unit
const RADIUS_SCENE_CONVERSION = 1 / KM_PER_SCENE_UNIT; // multiply by this to go from km → scene units
// Visibility multipliers keep bodies visible without breaking distances; tuned to avoid overlap with orbits
const SIZE_MULT = {
  SUN: 80,
  INNER: 25, // Mercury, Venus, Earth, Mars
  MOON: 25,
  GAS: 35 // Jupiter, Saturn, Uranus, Neptune
} as const

const SOLAR_SYSTEM_DATA: Record<string, PlanetData> = {
  SUN: {
    texture: getPlanetTexture('SUN'),
    radius: 695700, // km - NASA accurate
    sceneRadius: 695700 * RADIUS_SCENE_CONVERSION * SIZE_MULT.SUN, // ~8.35 units; << Mercury orbit (57.9)
    color: '#FFD700',
    rotationSpeed: 0.01,
    orbitSpeed: 0,
    siderealPeriodDays: 0, // Sun doesn't orbit
    rotationPeriodHours: 25.38 * 24, // Sun's rotation period ~25.38 Earth days at equator
    orbitalInclination: 0,
    rotationDirection: 1,
    axialTilt: 7.25, // Sun's axial tilt
    eccentricity: 0
  },
  MERCURY: {
    texture: getPlanetTexture('MERCURY'),
    radius: 2439.7, // km - NASA accurate
    sceneRadius: 2439.7 * RADIUS_SCENE_CONVERSION * SIZE_MULT.INNER,
    orbitRadius: 57.91 / DISTANCE_SCALE, // 57.91 million km / scale = 57.91 scene units
    color: '#8C7853',
    rotationSpeed: 0.004,
    orbitSpeed: 0.088,
    siderealPeriodDays: 87.969, // Mercury orbital period - NASA accurate
    rotationPeriodHours: 1407.6, // Mercury rotation period in hours - NASA accurate
    orbitalInclination: 7.00, // Inclination to ecliptic - NASA accurate
    rotationDirection: 1, // Normal rotation
    axialTilt: 0.034, // Mercury's axial tilt - NASA accurate
    eccentricity: 0.2056, // Mercury orbital eccentricity - NASA accurate
    initialMeanAnomaly: 0.2 // Start Mercury at 0.2 radians position
  },
  VENUS: {
    texture: getPlanetTexture('VENUS'),
    radius: 6051.8, // km - NASA accurate
    sceneRadius: 6051.8 * RADIUS_SCENE_CONVERSION * SIZE_MULT.INNER,
    orbitRadius: 108.21 / DISTANCE_SCALE, // 108.21 million km / scale = 108.21 scene units
    color: '#FFC649',
    rotationSpeed: -0.0018,
    orbitSpeed: 0.062,
    siderealPeriodDays: 224.701, // Venus orbital period - NASA accurate
    rotationPeriodHours: -5832.5, // Venus rotation period (negative = retrograde) - NASA accurate
    orbitalInclination: 3.39, // Inclination to ecliptic - NASA accurate
    rotationDirection: -1, // Retrograde rotation (Venus rotates backwards!)
    axialTilt: 177.36, // Venus is almost upside down - NASA accurate
    eccentricity: 0.0067, // Very low eccentricity - NASA accurate
    initialMeanAnomaly: 1.2 // Start Venus at 1.2 radians position
  },
  EARTH: {
    texture: getPlanetTexture('EARTH'),
    radius: 6371.0, // km - NASA accurate mean radius
    sceneRadius: 6371.0 * RADIUS_SCENE_CONVERSION * SIZE_MULT.INNER, // ~0.255 units; Moon orbit 0.3844 units stays clear
    orbitRadius: 149.60 / DISTANCE_SCALE, // 149.60 million km (1 AU) / scale = 149.6 scene units
    color: '#6B93D6',
    rotationSpeed: 0.01,
    orbitSpeed: 0.027,
    siderealPeriodDays: 365.256, // Earth orbital period - NASA accurate
    rotationPeriodHours: 23.9345, // Earth rotation period - NASA accurate
    orbitalInclination: 0.0, // Earth's orbit defines the ecliptic plane
    rotationDirection: 1, // Normal rotation
    axialTilt: 23.44, // Earth's axial tilt (causes seasons) - NASA accurate
    eccentricity: 0.0167, // Earth's orbital eccentricity - NASA accurate
    initialMeanAnomaly: 0.0 // Start Earth at reference position (0 radians)
  },
  MARS: {
    texture: getPlanetTexture('MARS'),
    radius: 3389.5, // km - NASA accurate mean radius
    sceneRadius: 3389.5 * RADIUS_SCENE_CONVERSION * SIZE_MULT.INNER,
    orbitRadius: 227.92 / DISTANCE_SCALE, // 227.92 million km / scale = 227.92 scene units
    color: '#CD5C5C',
    rotationSpeed: 0.0097,
    orbitSpeed: 0.024,
    siderealPeriodDays: 686.980, // Mars orbital period - NASA accurate
    rotationPeriodHours: 24.6229, // Mars rotation period - NASA accurate
    orbitalInclination: 1.850, // Inclination to ecliptic - NASA accurate
    rotationDirection: 1, // Normal rotation
    axialTilt: 25.19, // Mars axial tilt - NASA accurate
    eccentricity: 0.0935, // Mars orbital eccentricity - NASA accurate
    initialMeanAnomaly: 2.8 // Start Mars at 2.8 radians position
  },
  JUPITER: {
    texture: getPlanetTexture('JUPITER'),
    radius: 69911, // km - NASA accurate mean radius
    sceneRadius: 69911 * RADIUS_SCENE_CONVERSION * SIZE_MULT.GAS,
    orbitRadius: 778.57 / DISTANCE_SCALE, // 778.57 million km / scale = 778.57 scene units
    color: '#D8CA9D',
    rotationSpeed: 0.024,
    orbitSpeed: 0.013,
    siderealPeriodDays: 4332.589, // Jupiter orbital period - NASA accurate
    rotationPeriodHours: 9.9250, // Jupiter rotation period - NASA accurate (fastest rotation!)
    orbitalInclination: 1.304, // Inclination to ecliptic - NASA accurate
    rotationDirection: 1, // Normal rotation
    axialTilt: 3.13, // Jupiter's axial tilt - NASA accurate
    eccentricity: 0.0489, // Jupiter's orbital eccentricity - NASA accurate
    initialMeanAnomaly: 4.1 // Start Jupiter at 4.1 radians position
  },
  SATURN: {
    texture: getPlanetTexture('SATURN'),
    radius: 58232, // km - NASA accurate mean radius
    sceneRadius: 58232 * RADIUS_SCENE_CONVERSION * SIZE_MULT.GAS,
    orbitRadius: 1433.53 / DISTANCE_SCALE, // 1433.53 million km / scale = 1433.53 scene units
    color: '#FAD5A5',
    rotationSpeed: 0.022,
    orbitSpeed: 0.009,
    hasRings: true,
    siderealPeriodDays: 10759.22, // Saturn orbital period - NASA accurate
    rotationPeriodHours: 10.656, // Saturn rotation period - NASA accurate
    orbitalInclination: 2.485, // Inclination to ecliptic - NASA accurate
    rotationDirection: 1, // Normal rotation
    axialTilt: 26.73, // Saturn's axial tilt - NASA accurate
    eccentricity: 0.0565, // Saturn's orbital eccentricity - NASA accurate
    initialMeanAnomaly: 5.7 // Start Saturn at 5.7 radians position
  },
  URANUS: {
    texture: getPlanetTexture('URANUS'),
    radius: 25362, // km - NASA accurate mean radius
    sceneRadius: 25362 * RADIUS_SCENE_CONVERSION * SIZE_MULT.GAS,
    orbitRadius: 2872.46 / DISTANCE_SCALE, // 2872.46 million km / scale = 2872.46 scene units
    color: '#4FD0E3',
    rotationSpeed: -0.014,
    orbitSpeed: 0.0068,
    siderealPeriodDays: 30685.4, // Uranus orbital period - NASA accurate
    rotationPeriodHours: -17.24, // Uranus rotation period (negative = retrograde) - NASA accurate
    orbitalInclination: 0.772, // Inclination to ecliptic - NASA accurate
    rotationDirection: -1, // Retrograde rotation
    axialTilt: 97.77, // Uranus is tilted on its side! - NASA accurate
    eccentricity: 0.0457, // Uranus orbital eccentricity - NASA accurate
    initialMeanAnomaly: 1.5 // Start Uranus at 1.5 radians position
  },
  NEPTUNE: {
    texture: getPlanetTexture('NEPTUNE'),
    radius: 24622, // km - NASA accurate mean radius
    sceneRadius: 24622 * RADIUS_SCENE_CONVERSION * SIZE_MULT.GAS,
    orbitRadius: 4495.06 / DISTANCE_SCALE, // 4495.06 million km / scale = 4495.06 scene units
    color: '#4B70DD',
    rotationSpeed: 0.016,
    orbitSpeed: 0.0054,
    siderealPeriodDays: 60189, // Neptune orbital period - NASA accurate
    rotationPeriodHours: 16.11, // Neptune rotation period - NASA accurate
    orbitalInclination: 1.769, // Inclination to ecliptic - NASA accurate
    rotationDirection: 1, // Normal rotation
    axialTilt: 28.32, // Neptune's axial tilt - NASA accurate
    eccentricity: 0.0113, // Neptune orbital eccentricity - NASA accurate
    initialMeanAnomaly: 3.9 // Start Neptune at 3.9 radians position
  },
  MOON: {
    texture: getPlanetTexture('MOON'),
    radius: 1737.4, // km - NASA accurate mean radius
    sceneRadius: 1737.4 * RADIUS_SCENE_CONVERSION * SIZE_MULT.MOON,
    // 384,400 km = 0.3844 million km → 0.3844 scene units at DISTANCE_SCALE=1
    orbitRadius: (384400 / 1_000_000) / DISTANCE_SCALE,
    parentOrbitRadius: 149.60 / DISTANCE_SCALE, // Earth's orbit
    color: '#C0C0C0',
    rotationSpeed: 0.0005,
    orbitSpeed: 0.365,
    siderealPeriodDays: 27.3217, // Moon orbital period - NASA accurate
    rotationPeriodHours: 27.3217 * 24, // Moon is tidally locked - NASA accurate
    orbitalInclination: 5.145, // Moon's inclination to Earth's orbit - NASA accurate
    rotationDirection: 1, // Normal rotation
    axialTilt: 6.68, // Moon's axial tilt
    eccentricity: 0.0549 // Moon's orbital eccentricity - NASA accurate
  }
}

interface PlanetProps {
  name: keyof typeof SOLAR_SYSTEM_DATA
  showOrbit?: boolean
  missionTime?: number
  offset?: [number, number, number]
}

export function Planet({ name, showOrbit = false, missionTime = 0, offset = [0, 0, 0] }: PlanetProps) {
  const data = SOLAR_SYSTEM_DATA[name]

  // Use memoized texture loading for better performance and fallback colors
  const planetTexture = useSafeTexture(useMemo(() => getPlanetTexture(name), [name])) || null

  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Calculate realistic orbital position based on mission time and astronomical data
  const getOrbitalPosition = (): [number, number, number] => {
    if (name === 'SUN') return [0, 0, 0]

    // Convert mission time to days (assuming missionTime is in some unit we can scale)
    const timeInDays = missionTime * 0.01 // Scale factor for visualization

    if (name === 'MOON' && data.parentOrbitRadius !== undefined) {
      // Moon orbits Earth - use realistic orbital mechanics
      const earthData = SOLAR_SYSTEM_DATA.EARTH

      // Calculate Earth's position first
      const earthMeanAnomaly = (2 * Math.PI * timeInDays) / earthData.siderealPeriodDays
      const earthTrueAnomaly = earthMeanAnomaly + earthData.eccentricity * Math.sin(earthMeanAnomaly)
      const earthRadius = (earthData.orbitRadius || 0) * (1 - earthData.eccentricity * earthData.eccentricity) / (1 + earthData.eccentricity * Math.cos(earthTrueAnomaly))

      const earthX = Math.cos(earthTrueAnomaly) * earthRadius
      const earthZ = Math.sin(earthTrueAnomaly) * earthRadius

      // Calculate Moon's position relative to Earth
      const moonMeanAnomaly = (2 * Math.PI * timeInDays) / data.siderealPeriodDays
      const moonTrueAnomaly = moonMeanAnomaly + data.eccentricity * Math.sin(moonMeanAnomaly)
      const moonRadius = (data.orbitRadius || 0) * (1 - data.eccentricity * data.eccentricity) / (1 + data.eccentricity * Math.cos(moonTrueAnomaly))

      // Apply orbital inclination for Moon
      const inclinationRad = (data.orbitalInclination * Math.PI) / 180
      const moonX = earthX + Math.cos(moonTrueAnomaly) * moonRadius * Math.cos(inclinationRad)
      const moonY = Math.sin(moonTrueAnomaly) * moonRadius * Math.sin(inclinationRad)
      const moonZ = earthZ + Math.sin(moonTrueAnomaly) * moonRadius * Math.cos(inclinationRad)

      return [moonX, moonY, moonZ]
    }

    // Other planets orbit the Sun with realistic mechanics
    if (data.orbitRadius && data.siderealPeriodDays) {
      // Calculate mean anomaly (position in orbit) with initial offset
      const meanAnomaly = (2 * Math.PI * timeInDays) / data.siderealPeriodDays + (data.initialMeanAnomaly || 0)

      // Calculate true anomaly (accounting for elliptical orbit)
      const eccentricAnomaly = meanAnomaly + data.eccentricity * Math.sin(meanAnomaly)
      const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + data.eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - data.eccentricity) * Math.cos(eccentricAnomaly / 2)
      )

      // Calculate orbital radius (varies with eccentricity)
      const orbitRadius = data.orbitRadius * (1 - data.eccentricity * data.eccentricity) / (1 + data.eccentricity * Math.cos(trueAnomaly))

      // Apply orbital inclination
      const inclinationRad = (data.orbitalInclination * Math.PI) / 180

      const x = Math.cos(trueAnomaly) * orbitRadius * Math.cos(inclinationRad)
      const y = Math.sin(trueAnomaly) * orbitRadius * Math.sin(inclinationRad)
      const z = Math.sin(trueAnomaly) * orbitRadius * Math.cos(inclinationRad)

      return [x, y, z]
    }

    return [0, 0, 0]
  }

  // Calculate realistic rotation based on actual planetary rotation periods
  const getRealisticRotation = (): number => {
    if (name === 'SUN') return 0

    const timeInHours = missionTime * 0.01 * 24 // Convert to hours for rotation
    const rotationsCompleted = timeInHours / data.rotationPeriodHours
    const rotationAngle = (rotationsCompleted * 2 * Math.PI) * data.rotationDirection

    return rotationAngle
  }

  useFrame(() => {
    if (meshRef.current) {
      // Use realistic rotation based on actual planetary rotation periods and directions
      meshRef.current.rotation.y = getRealisticRotation()

      // Apply axial tilt for more realistic appearance
      const tiltRad = (data.axialTilt * Math.PI) / 180
      meshRef.current.rotation.z = tiltRad
    }
    if (groupRef.current) {
      const [x, y, z] = getOrbitalPosition()
      groupRef.current.position.set(x - offset[0], y - offset[1], z - offset[2])
    }
  })

  return (
    <>
      {/* Orbital path */}
      {showOrbit && name !== 'SUN' && name !== 'MOON' && data.orbitRadius && (
        <mesh position={[-offset[0], -offset[1], -offset[2]]}>
          <ringGeometry args={[data.orbitRadius - 0.02, data.orbitRadius + 0.02, 128]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}

      <group ref={groupRef}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[data.sceneRadius, 32, 32]} />
          <meshStandardMaterial
            map={planetTexture}
            color={planetTexture ? undefined : data.color}
            roughness={name === 'SUN' ? 0 : 0.6}
            metalness={0.1}
            emissive={name === 'SUN' ? data.color : '#000000'}
            emissiveIntensity={name === 'SUN' ? 0.3 : 0}
          />
        </mesh>

        {/* Saturn's rings */}
        {name === 'SATURN' && data.hasRings && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[data.sceneRadius * 1.2, data.sceneRadius * 2.2, 64]} />
            <meshStandardMaterial
              color="#C4A875"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </>
  )
}

interface SolarSystemProps {
  showOrbits?: boolean
  missionTime?: number
  centerOn?: 'SUN' | 'EARTH' | 'MOON'
}

function getBodyPosition(name: keyof typeof SOLAR_SYSTEM_DATA, missionTime: number): [number, number, number] {
  if (name === 'SUN') return [0, 0, 0]

  const data = SOLAR_SYSTEM_DATA[name]
  const timeInDays = missionTime * 0.01 // Scale factor for visualization

  if (name === 'EARTH') {
    // Calculate Earth's realistic orbital position
    const meanAnomaly = (2 * Math.PI * timeInDays) / data.siderealPeriodDays
    const trueAnomaly = meanAnomaly + data.eccentricity * Math.sin(meanAnomaly)
    const orbitRadius = (data.orbitRadius || 0) * (1 - data.eccentricity * data.eccentricity) / (1 + data.eccentricity * Math.cos(trueAnomaly))

    return [Math.cos(trueAnomaly) * orbitRadius, 0, Math.sin(trueAnomaly) * orbitRadius]
  }

  if (name === 'MOON') {
    // Moon orbits Earth with realistic mechanics
    const earthData = SOLAR_SYSTEM_DATA.EARTH
    const moonData = SOLAR_SYSTEM_DATA.MOON

    // Calculate Earth's position first
    const earthMeanAnomaly = (2 * Math.PI * timeInDays) / earthData.siderealPeriodDays
    const earthTrueAnomaly = earthMeanAnomaly + earthData.eccentricity * Math.sin(earthMeanAnomaly)
    const earthRadius = (earthData.orbitRadius || 0) * (1 - earthData.eccentricity * earthData.eccentricity) / (1 + earthData.eccentricity * Math.cos(earthTrueAnomaly))

    const earthX = Math.cos(earthTrueAnomaly) * earthRadius
    const earthZ = Math.sin(earthTrueAnomaly) * earthRadius

    // Calculate Moon's position relative to Earth
    const moonMeanAnomaly = (2 * Math.PI * timeInDays) / moonData.siderealPeriodDays
    const moonTrueAnomaly = moonMeanAnomaly + moonData.eccentricity * Math.sin(moonMeanAnomaly)
    const moonRadius = (moonData.orbitRadius || 0) * (1 - moonData.eccentricity * moonData.eccentricity) / (1 + moonData.eccentricity * Math.cos(moonTrueAnomaly))

    const moonX = earthX + Math.cos(moonTrueAnomaly) * moonRadius
    const moonZ = earthZ + Math.sin(moonTrueAnomaly) * moonRadius

    return [moonX, 0, moonZ]
  }

  // Other planets use realistic orbital mechanics
  const meanAnomaly = (2 * Math.PI * timeInDays) / data.siderealPeriodDays
  const trueAnomaly = meanAnomaly + data.eccentricity * Math.sin(meanAnomaly)
  const orbitRadius = (data.orbitRadius || 0) * (1 - data.eccentricity * data.eccentricity) / (1 + data.eccentricity * Math.cos(trueAnomaly))

  // Apply orbital inclination
  const inclinationRad = (data.orbitalInclination * Math.PI) / 180
  const x = Math.cos(trueAnomaly) * orbitRadius * Math.cos(inclinationRad)
  const y = Math.sin(trueAnomaly) * orbitRadius * Math.sin(inclinationRad)
  const z = Math.sin(trueAnomaly) * orbitRadius * Math.cos(inclinationRad)

  return [x, y, z]
}

export function SolarSystem({ showOrbits = false, missionTime = 0, centerOn = 'SUN' }: SolarSystemProps) {
  // Compute offset so that the selected body is at the origin
  const centerPos = centerOn === 'SUN' ? [0, 0, 0] as [number, number, number] : getBodyPosition(centerOn, missionTime)
  const offset: [number, number, number] = [centerPos[0], centerPos[1], centerPos[2]]
  return (
    <group>
      {/* Star field background */}
      <StarField count={5000} radius={8000} />

      {/* Light source from the Sun */}
      <pointLight
        position={[-offset[0], -offset[1], -offset[2]]}
        intensity={12}
        decay={2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={2000}
      />

      {/* Ambient light for overall visibility */}
      <ambientLight intensity={0.2} />

      {/* All solar system bodies */}
      <Planet name="SUN" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="MERCURY" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="VENUS" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="EARTH" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="MOON" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="MARS" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <AsteroidBelt showAsteroids={true} asteroidCount={300} />
      <Planet name="JUPITER" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="SATURN" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="URANUS" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
      <Planet name="NEPTUNE" showOrbit={showOrbits} missionTime={missionTime} offset={offset} />
    </group>
  )
}

// NASA Planet component that renders planets using real NASA positions
interface NasaPlanetProps {
  planetPosition: PlanetPosition;
  showOrbit?: boolean;
  offset: [number, number, number];
}

function NasaPlanet({ planetPosition, showOrbit = false, offset }: NasaPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { name, position, dataSource } = planetPosition;

  // Get planet data for rendering properties
  const planetData = SOLAR_SYSTEM_DATA[name as keyof typeof SOLAR_SYSTEM_DATA];

  // Memoize texture to prevent re-loading on every render
  const planetTexture = useSafeTexture(
    useMemo(() => getPlanetTexture(name), [name])
  );

  // Use frame for rotation animation (always call hook)
  useFrame((state, delta) => {
    if (meshRef.current && planetData) {
      // Realistic rotation based on planet's rotation period
      const rotationSpeed = (2 * Math.PI) / (planetData.rotationPeriodHours * 3600) * delta * 1000; // Scaled for visualization
      meshRef.current.rotation.y += rotationSpeed * planetData.rotationDirection;
    }
  });

  if (!planetData) {
    console.warn(`No planet data found for ${name}`);
    return null;
  }

  // Calculate position with offset
  const adjustedPosition: [number, number, number] = [
    position[0] - offset[0],
    position[1] - offset[1],
    position[2] - offset[2]
  ];

  return (
    <group position={adjustedPosition}>
      {/* Planet mesh */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[planetData.sceneRadius, 32, 32]} />
        <meshStandardMaterial
          map={planetTexture}
          color={planetTexture ? undefined : planetData.color}
          roughness={name === 'SUN' ? 0 : 0.8}
          metalness={0.1}
          emissive={name === 'SUN' ? planetData.color : '#000000'}
          emissiveIntensity={name === 'SUN' ? 0.3 : 0}
        />
      </mesh>

      {/* Data source indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <Html position={[0, planetData.sceneRadius + 2, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '2px 4px',
            borderRadius: '2px',
            fontSize: '10px',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}>
            {name}<br />
            {dataSource === 'nasa' ? '🛰️' : '🧮'}
          </div>
        </Html>
      )}

      {/* Orbit visualization - Enhanced orbital ring around the Sun */}
      {showOrbit && planetData.orbitRadius && name !== 'SUN' && name !== 'MOON' && (
        <group position={[-offset[0], -offset[1], -offset[2]]}>
          {/* Main orbital line */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planetData.orbitRadius - 0.2, planetData.orbitRadius + 0.2, 128]} />
            <meshBasicMaterial
              color="#ffffff"
              opacity={0.8}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Secondary thinner line for better visibility */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planetData.orbitRadius - 0.05, planetData.orbitRadius + 0.05, 64]} />
            <meshBasicMaterial
              color="#ffffff"
              opacity={1.0}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Special handling for Saturn's rings */}
      {planetData.hasRings && (
        <group>
          {/* Main ring system */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planetData.sceneRadius * 1.5, planetData.sceneRadius * 2.5, 64]} />
            <meshBasicMaterial color="#C4A875" opacity={0.8} transparent side={THREE.DoubleSide} />
          </mesh>

          {/* Inner ring detail */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planetData.sceneRadius * 1.2, planetData.sceneRadius * 1.4, 32]} />
            <meshBasicMaterial color="#F4E99B" opacity={0.9} transparent side={THREE.DoubleSide} />
          </mesh>

          {/* Outer ring detail */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planetData.sceneRadius * 2.6, planetData.sceneRadius * 3.0, 32]} />
            <meshBasicMaterial color="#DEB887" opacity={0.7} transparent side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// NASA-enhanced Solar System component with real-time planetary positions
export function NasaSolarSystem({ showOrbits = false, centerOn = 'SUN', useNasaData = true }: SolarSystemProps & { useNasaData?: boolean }) {
  // Get NASA planetary positions
  const { positions, loading, error, dataSource } = useNasaPositions({
    config: {
      useNasaData,
      fallbackToCalculated: true,
      // Match the scene scale where 1 unit = 1e6 km → 1 AU ≈ 149.6 units
      scaleFactorAU: 149.6,
    },
    autoRefresh: true,
    refreshInterval: 60 * 60 * 1000, // Refresh every hour
  });

  // Status logging
  console.log(`🌍 NASA Solar System - Data Source: ${dataSource}, Loading: ${loading}, Error: ${error}`);

  // Compute offset for camera centering
  const centerPos = useMemo(() => {
    if (centerOn === 'SUN') return [0, 0, 0] as [number, number, number];

    const centerPlanet = positions.find(p => p.name === centerOn);
    return centerPlanet ? centerPlanet.position : [0, 0, 0] as [number, number, number];
  }, [centerOn, positions]);

  const offset: [number, number, number] = [centerPos[0], centerPos[1], centerPos[2]];

  return (
    <group>
      {/* Star field background - Enhanced for better visibility */}
      {/* Star field background with enhanced radius for larger solar system */}
      <StarField count={5000} radius={8000} />

      {/* Light source from the Sun */}
      <pointLight
        position={[-offset[0], -offset[1], -offset[2]]}
        intensity={2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={1000}
      />

      {/* Ambient light for overall visibility */}
      <ambientLight intensity={0.3} />

      {/* Data source indicator */}
      {!loading && (
        <Html position={[0, 50, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            Data: {dataSource === 'nasa' ? '🛰️ NASA JPL' : dataSource === 'calculated' ? '🧮 Calculated' : '🔄 Mixed'}
            {error && ' ⚠️ Error'}
          </div>
        </Html>
      )}

      {/* Loading indicator */}
      {loading && (
        <Html position={[0, 45, 0]}>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            🌍 Loading NASA data...
          </div>
        </Html>
      )}

      {/* Central Orbital Ring System - Always visible orbital paths around the Sun with accurate distances */}
      {showOrbits && (
        <group position={[-offset[0], -offset[1], -offset[2]]}>
          {/* Mercury Orbit - 57.91 million km = 57.91 scene units */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[57.91 - 0.2, 57.91 + 0.2, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.6} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Venus Orbit - 108.21 million km = 108.21 scene units */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[108.21 - 0.2, 108.21 + 0.2, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.6} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Earth Orbit - 149.60 million km = 149.6 scene units (1 AU) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[149.60 - 0.2, 149.60 + 0.2, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.7} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Mars Orbit - 227.92 million km = 227.92 scene units */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[227.92 - 0.2, 227.92 + 0.2, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.6} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Jupiter Orbit - 778.57 million km = 778.57 scene units */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[778.57 - 0.5, 778.57 + 0.5, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Saturn Orbit - 1433.53 million km = 1433.53 scene units */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1433.53 - 0.5, 1433.53 + 0.5, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Uranus Orbit - 2872.46 million km = 2872.46 scene units */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2872.46 - 1.0, 2872.46 + 1.0, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.45} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>

          {/* Neptune Orbit - 4495.06 million km = 4495.06 scene units */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4495.06 - 1.0, 4495.06 + 1.0, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.45} transparent side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          </mesh>
        </group>
      )}

      {/* Render planets using NASA positions or fallback */}
      {positions.map((planetPosition) => (
        <NasaPlanet
          key={planetPosition.name}
          planetPosition={planetPosition}
          showOrbit={showOrbits}
          offset={offset}
        />
      ))}

      {/* Asteroid belt */}
      <AsteroidBelt showAsteroids={true} asteroidCount={300} />
    </group>
  );
}

export function EnhancedEarthVisual() {
  const ref = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

  const dayMap = useSafeTexture({
    url: [
      assetUrl('assets/earth/earth_day.jpg'),
      assetUrl('textures/earth/earth_day.jpg'),
    ],
    anisotropy: 8,
    fallbackPattern: {
      type: 'earth',
      size: 1024,
      squares: 64
    }
  })

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.012
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.008
    }
  })

  return (
    <>
      {/* Main Earth */}
      <mesh ref={ref}>
        <sphereGeometry args={[SOLAR_SYSTEM_DATA.EARTH.sceneRadius, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          color={dayMap ? undefined : "#4A90E2"}
          roughness={0.6}
          metalness={0.1}
          emissive={dayMap ? undefined : "#1a3f6b"}
          emissiveIntensity={dayMap ? 0 : 0.1}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[SOLAR_SYSTEM_DATA.EARTH.sceneRadius * 1.01, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          alphaMap={dayMap}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[SOLAR_SYSTEM_DATA.EARTH.sceneRadius * 1.05, 16, 16]} />
        <meshBasicMaterial
          color="#6B93D6"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  )
}

export function EnhancedMarsVisual() {
  const ref = useRef<THREE.Mesh>(null)

  const marsColor = useSafeTexture({
    url: [
      assetUrl('assets/mars/mars_color.jpg'),
      assetUrl('textures/mars/mars_color.jpg')
    ],
    anisotropy: 8,
    fallbackPattern: { type: 'checker', colors: ['#cd5c5c', '#8b3a3a'], size: 512, squares: 12 }
  })

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0097
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[SOLAR_SYSTEM_DATA.MARS.sceneRadius, 32, 32]} />
      {marsColor ? (
        <meshStandardMaterial map={marsColor} />
      ) : (
        <meshStandardMaterial color={SOLAR_SYSTEM_DATA.MARS.color} />
      )}
    </mesh>
  )
}

export { SOLAR_SYSTEM_DATA }

interface AsteroidBeltProps {
  showAsteroids?: boolean
  asteroidCount?: number
  sizeScale?: number // visual scale multiplier for asteroid sizes
}

export function AsteroidBelt({ showAsteroids = true, asteroidCount = 500, sizeScale = 10 }: AsteroidBeltProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Generate asteroid positions once
  const asteroids = useMemo(() => {
    if (!showAsteroids) return []
    return generateAsteroidBelt().slice(0, asteroidCount)
  }, [showAsteroids, asteroidCount])

  // Rotate the entire belt slowly
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0001 // Very slow rotation
    }
  })

  if (!showAsteroids || asteroids.length === 0) return null

  return (
    <group ref={groupRef}>
      {asteroids.map((asteroid, index) => (
        <Asteroid
          key={index}
          position={asteroid.position}
          size={asteroid.size * sizeScale}
          rotationSpeed={asteroid.rotationSpeed}
        />
      ))}
    </group>
  )
}

interface AsteroidProps {
  position: THREE.Vector3
  size: number
  rotationSpeed: number
}

function Asteroid({ position, size, rotationSpeed }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Rotate individual asteroids
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed * 0.1
      meshRef.current.rotation.y += rotationSpeed * 0.05
      meshRef.current.rotation.z += rotationSpeed * 0.08
    }
  })

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <sphereGeometry args={[size, 8, 6]} />
      <meshStandardMaterial
        color={new THREE.Color().setHSL(0.08, 0.3, Math.random() * 0.3 + 0.4)}
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  )
}
