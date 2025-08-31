import * as THREE from 'three'

// J2000 epoch (January 1, 2000, 12:00 TT)
const J2000_EPOCH = new Date('2000-01-01T12:00:00Z').getTime()

// Current date for astronomical calculations (August 31, 2025)
const CURRENT_DATE = new Date('2025-08-31T00:00:00Z')

// Astronomical constants
const AU_TO_KM = 149597870.7 // 1 AU in kilometers
const EARTH_RADIUS_KM = 6371 // Earth radius in km
const SCALE_FACTOR = 0.000001 // Scale factor for visualization (1 unit = 1000 km)

// Planetary orbital data (J2000 epoch, real astronomical values)
export const PLANET_ORBITAL_DATA = {
  mercury: {
    semiMajorAxis: 0.387098, // AU
    eccentricity: 0.205630,
    inclination: 7.005, // degrees
    longitudeOfAscendingNode: 48.331, // degrees
    argumentOfPeriapsis: 29.124, // degrees
    meanAnomalyAtEpoch: 174.796, // degrees
    orbitalPeriod: 87.969, // days
    radius: 2439.7, // km
    rotationPeriod: 58.646, // days
    axialTilt: 0.034, // degrees
  },
  venus: {
    semiMajorAxis: 0.723332,
    eccentricity: 0.006772,
    inclination: 3.394,
    longitudeOfAscendingNode: 76.680,
    argumentOfPeriapsis: 54.884,
    meanAnomalyAtEpoch: 50.115,
    orbitalPeriod: 224.701,
    radius: 6051.8,
    rotationPeriod: -243.025, // retrograde
    axialTilt: 177.4,
  },
  earth: {
    semiMajorAxis: 1.000000,
    eccentricity: 0.016708,
    inclination: 0.000,
    longitudeOfAscendingNode: -11.260,
    argumentOfPeriapsis: 114.207,
    meanAnomalyAtEpoch: 358.617,
    orbitalPeriod: 365.256,
    radius: 6371.0,
    rotationPeriod: 0.997,
    axialTilt: 23.439,
  },
  mars: {
    semiMajorAxis: 1.523679,
    eccentricity: 0.0935,
    inclination: 1.850,
    longitudeOfAscendingNode: 49.558,
    argumentOfPeriapsis: 286.502,
    meanAnomalyAtEpoch: 19.373,
    orbitalPeriod: 686.980,
    radius: 3389.5,
    rotationPeriod: 1.026,
    axialTilt: 25.19,
  },
  jupiter: {
    semiMajorAxis: 5.2026,
    eccentricity: 0.0489,
    inclination: 1.304,
    longitudeOfAscendingNode: 100.464,
    argumentOfPeriapsis: 273.867,
    meanAnomalyAtEpoch: 20.020,
    orbitalPeriod: 4332.59,
    radius: 69911,
    rotationPeriod: 0.414,
    axialTilt: 3.13,
  },
  saturn: {
    semiMajorAxis: 9.539,
    eccentricity: 0.0557,
    inclination: 2.485,
    longitudeOfAscendingNode: 113.665,
    argumentOfPeriapsis: 339.392,
    meanAnomalyAtEpoch: 317.020,
    orbitalPeriod: 10759.22,
    radius: 58232,
    rotationPeriod: 0.426,
    axialTilt: 26.73,
  },
  uranus: {
    semiMajorAxis: 19.191,
    eccentricity: 0.0472,
    inclination: 0.770,
    longitudeOfAscendingNode: 74.006,
    argumentOfPeriapsis: 96.998,
    meanAnomalyAtEpoch: 142.238,
    orbitalPeriod: 30688.5,
    radius: 25362,
    rotationPeriod: -0.718, // retrograde
    axialTilt: 97.77,
  },
  neptune: {
    semiMajorAxis: 30.061,
    eccentricity: 0.0086,
    inclination: 1.769,
    longitudeOfAscendingNode: 131.784,
    argumentOfPeriapsis: 273.187,
    meanAnomalyAtEpoch: 260.248,
    orbitalPeriod: 60182,
    radius: 24622,
    rotationPeriod: 0.671,
    axialTilt: 28.32,
  },
}

// Moon orbital data
export const MOON_ORBITAL_DATA = {
  semiMajorAxis: 384400, // km
  eccentricity: 0.0549,
  inclination: 5.145, // degrees
  longitudeOfAscendingNode: 125.08,
  argumentOfPeriapsis: 318.15,
  meanAnomalyAtEpoch: 135.27,
  orbitalPeriod: 27.3217, // days
  radius: 1737.4, // km
  rotationPeriod: 27.3217, // tidally locked
}

/**
 * Get current astronomical time in Julian centuries since J2000
 */
export function getCurrentAstronomicalTime(): number {
  const now = CURRENT_DATE.getTime()
  const diffMs = now - J2000_EPOCH
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays / 36525 // Julian centuries
}

/**
 * Convert degrees to radians
 */
function degToRad(degrees: number): number {
  return degrees * Math.PI / 180
}

/**
 * Convert radians to degrees
 */
function radToDeg(radians: number): number {
  return radians * 180 / Math.PI
}

/**
 * Solve Kepler's equation using Newton-Raphson method
 * M = E - e * sin(E)
 */
function solveKeplersEquation(M: number, e: number, tolerance = 1e-8): number {
  let E = M // Initial guess
  let delta = 1

  while (Math.abs(delta) > tolerance) {
    delta = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E))
    E += delta
  }

  return E
}

/**
 * Calculate planet position using Keplerian orbital elements
 */
export function calculatePlanetPosition(planetName: string, time?: number): THREE.Vector3 {
  const planet = PLANET_ORBITAL_DATA[planetName as keyof typeof PLANET_ORBITAL_DATA]
  if (!planet) {
    console.warn(`Planet ${planetName} not found in orbital data`)
    return new THREE.Vector3(0, 0, 0)
  }

  const T = time ?? getCurrentAstronomicalTime()

  // Mean anomaly at current time
  const n = 2 * Math.PI / planet.orbitalPeriod // mean motion in degrees/day
  const M = degToRad(planet.meanAnomalyAtEpoch + n * (T * 36525)) // convert to radians

  // Solve Kepler's equation for eccentric anomaly
  const E = solveKeplersEquation(M, planet.eccentricity)

  // True anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + planet.eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - planet.eccentricity) * Math.cos(E / 2)
  )

  // Distance from focus
  const r = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(E))

  // Position in orbital plane
  const x_orb = r * Math.cos(nu)
  const y_orb = r * Math.sin(nu)

  // Convert to 3D coordinates with inclination
  const i = degToRad(planet.inclination)
  const omega = degToRad(planet.longitudeOfAscendingNode)
  const w = degToRad(planet.argumentOfPeriapsis)

  const cosOmega = Math.cos(omega)
  const sinOmega = Math.sin(omega)
  const cosI = Math.cos(i)
  const sinI = Math.sin(i)
  const cosW = Math.cos(w)
  const sinW = Math.sin(w)

  // Rotation matrix for orbital elements
  const x = (cosOmega * cosW - sinOmega * sinW * cosI) * x_orb +
            (-cosOmega * sinW - sinOmega * cosW * cosI) * y_orb
  const y = (sinOmega * cosW + cosOmega * sinW * cosI) * x_orb +
            (-sinOmega * sinW + cosOmega * cosW * cosI) * y_orb
  const z = (sinW * sinI) * x_orb + (cosW * sinI) * y_orb

  // Convert to kilometers and scale for visualization
  return new THREE.Vector3(
    x * AU_TO_KM * SCALE_FACTOR,
    y * AU_TO_KM * SCALE_FACTOR,
    z * AU_TO_KM * SCALE_FACTOR
  )
}

/**
 * Calculate planet rotation angle for current time
 */
export function getPlanetRotation(planetName: string, time?: number): number {
  const planet = PLANET_ORBITAL_DATA[planetName as keyof typeof PLANET_ORBITAL_DATA]
  if (!planet) return 0

  const T = time ?? getCurrentAstronomicalTime()
  const daysSinceEpoch = T * 36525

  // Rotation angle in radians
  const rotationRate = 2 * Math.PI / Math.abs(planet.rotationPeriod)
  const rotation = rotationRate * daysSinceEpoch

  // Handle retrograde rotation (negative period)
  return planet.rotationPeriod < 0 ? -rotation : rotation
}

/**
 * Scale position for visualization (adjust distances for better viewing)
 */
export function scalePositionForVisualization(position: THREE.Vector3): THREE.Vector3 {
  // Apply additional scaling to make the solar system more visually appealing
  const VISUAL_SCALE = 0.1
  return position.clone().multiplyScalar(VISUAL_SCALE)
}

// Asteroid belt data
export const ASTEROID_BELT_DATA = {
  innerRadius: 2.2, // AU (between Mars and Jupiter)
  outerRadius: 3.3, // AU
  thickness: 0.5, // AU (vertical thickness)
  asteroidCount: 1000, // Number of asteroids to render
  minSize: 0.001, // Minimum asteroid size (relative)
  maxSize: 0.01, // Maximum asteroid size (relative)
  baseRotationPeriod: 4.6, // Base rotation period in years
  eccentricityRange: [0.0, 0.3], // Orbital eccentricity range
  inclinationRange: [-10, 10], // Orbital inclination range in degrees
}

/**
 * Generate asteroid belt positions
 */
export function generateAsteroidBelt(): Array<{
  position: THREE.Vector3
  size: number
  rotationSpeed: number
}> {
  const asteroids = []
  const { asteroidCount, innerRadius, outerRadius, thickness, minSize, maxSize, eccentricityRange, inclinationRange } = ASTEROID_BELT_DATA

  for (let i = 0; i < asteroidCount; i++) {
    // Random orbital distance between inner and outer radius
    const semiMajorAxis = innerRadius + Math.random() * (outerRadius - innerRadius)

    // Random eccentricity within range
    const eccentricity = eccentricityRange[0] + Math.random() * (eccentricityRange[1] - eccentricityRange[0])

    // Random inclination within range
    const inclination = degToRad(inclinationRange[0] + Math.random() * (inclinationRange[1] - inclinationRange[0]))

    // Random true anomaly (position along orbit)
    const trueAnomaly = Math.random() * 2 * Math.PI

    // Random argument of periapsis
    const argumentOfPeriapsis = Math.random() * 2 * Math.PI

    // Calculate position in orbital plane
    const r = semiMajorAxis * (1 - eccentricity * Math.cos(trueAnomaly))
    const x_orb = r * Math.cos(trueAnomaly)
    const y_orb = r * Math.sin(trueAnomaly)

    // Apply inclination
    const cosI = Math.cos(inclination)
    const sinI = Math.sin(inclination)
    const cosW = Math.cos(argumentOfPeriapsis)
    const sinW = Math.sin(argumentOfPeriapsis)

    const x = x_orb * cosW - y_orb * sinW * cosI
    const y = x_orb * sinW + y_orb * cosW * cosI
    const z = y_orb * sinI

    // Add some vertical variation
    const verticalOffset = (Math.random() - 0.5) * thickness

    // Random asteroid size
    const size = minSize + Math.random() * (maxSize - minSize)

    // Calculate rotation speed (Kepler's third law approximation)
    const rotationSpeed = Math.sqrt(1 / Math.pow(semiMajorAxis, 3)) * 0.1

    asteroids.push({
      position: new THREE.Vector3(
        x * AU_TO_KM * SCALE_FACTOR,
        (y + verticalOffset) * AU_TO_KM * SCALE_FACTOR,
        z * AU_TO_KM * SCALE_FACTOR
      ),
      size,
      rotationSpeed
    })
  }

  return asteroids
}
