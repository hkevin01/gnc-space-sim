/**
 * ID: GNC-NBODY-001
 * Requirement: Simulate the gravitational influence of multiple celestial bodies
 *   (Sun, Earth, Moon, Mars) on a spacecraft trajectory using RK4 integration.
 * Purpose: Replace the two-body assumption for interplanetary missions where the
 *   Moon's perturbation shifts perigee by > 10 km per orbit and the Sun shifts
 *   TLI Δv by > 10 m/s in Artemis trajectories.
 * Rationale: N-body RK4 adds O(N²) force evaluations per step, but N ≤ 5 for
 *   inner-solar-system missions, giving only 9× the per-step cost of two-body.
 * Inputs:
 *   spacecraft – { position: Vec3 [m], velocity: Vec3 [m/s] }
 *   bodies     – CelestialBody[] each with mu [m³/s²] and position [m]
 *   dt         – time step [s], positive
 * Outputs: updated spacecraft { position, velocity }
 * Preconditions: No body position == spacecraft position (singularity guard)
 * Postconditions: Position and velocity are finite
 * Failure Modes: If a body position equals spacecraft position, divide-by-zero
 *   gives Inf; caller must ensure minimum separation > 1 km.
 * Constraints: Bodies are treated as point masses on fixed Keplerian orbits
 *   (positions not updated); for full ephemeris use JPL DE430 lookup.
 * Verification: nbody.spec.ts — Earth-Moon L4 stability, energy conservation
 * References: Battin §10.4; Montenbruck & Gill "Satellite Orbits" §3.
 */

export type Vec3 = [number, number, number]

/** A gravitating body: name for logging, mu [m³/s²], position [m] (ECI) */
export interface CelestialBody {
  name: string
  mu: number           // m³/s²
  position: Vec3       // m in ECI frame
  mass?: number        // kg (optional; only needed for full-ephemeris propagation)
}

/** Spacecraft state in ECI frame */
export interface SpacecraftState {
  position: Vec3   // m
  velocity: Vec3   // m/s
}

export interface PerturbationBreakdown {
  primaryName: string
  primaryAcceleration: Vec3
  perturbationAcceleration: Vec3
  totalAcceleration: Vec3
  primaryMagnitude: number
  perturbationMagnitude: number
  perturbationRatio: number
}

const MIN_DISTANCE_M = 1.0

/** Gravitational acceleration from a single body at position `pos` from distance `r3` */
function gravAccel(sc: Vec3, body: CelestialBody): Vec3 {
  const dx = body.position[0] - sc[0]
  const dy = body.position[1] - sc[1]
  const dz = body.position[2] - sc[2]
  const r2 = dx * dx + dy * dy + dz * dz
  if (r2 < MIN_DISTANCE_M * MIN_DISTANCE_M) {
    return [0, 0, 0]
  }
  const r  = Math.sqrt(r2)
  const f  = body.mu / (r2 * r)
  return [f * dx, f * dy, f * dz]
}

/** Total gravitational acceleration on spacecraft from all bodies */
export function nbodyAcceleration(sc: Vec3, bodies: CelestialBody[]): Vec3 {
  let ax = 0, ay = 0, az = 0
  for (const body of bodies) {
    const a = gravAccel(sc, body)
    ax += a[0]; ay += a[1]; az += a[2]
  }
  return [ax, ay, az]
}

/** Single RK4 step for spacecraft under N-body gravity */
export function nbodyRK4Step(
  sc: SpacecraftState,
  bodies: CelestialBody[],
  dt: number,
): SpacecraftState {
  type State = { p: Vec3; v: Vec3 }

  const derive = (s: State): { dp: Vec3; dv: Vec3 } => {
    const dv = nbodyAcceleration(s.p, bodies)
    return { dp: s.v, dv }
  }

  const addS = (s: State, dp: Vec3, dv: Vec3, h: number): State => ({
    p: [s.p[0] + h * dp[0], s.p[1] + h * dp[1], s.p[2] + h * dp[2]],
    v: [s.v[0] + h * dv[0], s.v[1] + h * dv[1], s.v[2] + h * dv[2]],
  })

  const s0: State = { p: sc.position, v: sc.velocity }
  const d1 = derive(s0)
  const d2 = derive(addS(s0, d1.dp, d1.dv, 0.5 * dt))
  const d3 = derive(addS(s0, d2.dp, d2.dv, 0.5 * dt))
  const d4 = derive(addS(s0, d3.dp, d3.dv, dt))

  const f = dt / 6
  return {
    position: [
      s0.p[0] + f * (d1.dp[0] + 2 * d2.dp[0] + 2 * d3.dp[0] + d4.dp[0]),
      s0.p[1] + f * (d1.dp[1] + 2 * d2.dp[1] + 2 * d3.dp[1] + d4.dp[1]),
      s0.p[2] + f * (d1.dp[2] + 2 * d2.dp[2] + 2 * d3.dp[2] + d4.dp[2]),
    ],
    velocity: [
      s0.v[0] + f * (d1.dv[0] + 2 * d2.dv[0] + 2 * d3.dv[0] + d4.dv[0]),
      s0.v[1] + f * (d1.dv[1] + 2 * d2.dv[1] + 2 * d3.dv[1] + d4.dv[1]),
      s0.v[2] + f * (d1.dv[2] + 2 * d2.dv[2] + 2 * d3.dv[2] + d4.dv[2]),
    ],
  }
}

/**
 * Propagate spacecraft under N-body gravity for `steps` steps of size `dt`.
 * Bodies are FIXED at their initial positions (static field approximation).
 * For time-varying ephemeris, update body positions externally between calls.
 */
export function nbodyPropagate(
  sc: SpacecraftState,
  bodies: CelestialBody[],
  dt: number,
  steps: number,
): SpacecraftState {
  let s = sc
  for (let i = 0; i < steps; i++) s = nbodyRK4Step(s, bodies, dt)
  return s
}

/**
 * Decompose acceleration into a named primary body contribution and all
 * remaining perturbation terms.
 */
export function perturbationBreakdown(
  sc: Vec3,
  bodies: CelestialBody[],
  primaryName = 'Earth',
): PerturbationBreakdown {
  const primary = bodies.find((b) => b.name === primaryName)
  if (!primary) {
    throw new Error(`Primary body '${primaryName}' not found`)
  }

  const aPrimary = gravAccel(sc, primary)
  const aTotal = nbodyAcceleration(sc, bodies)
  const aPert: Vec3 = [
    aTotal[0] - aPrimary[0],
    aTotal[1] - aPrimary[1],
    aTotal[2] - aPrimary[2],
  ]

  const primaryMagnitude = Math.hypot(aPrimary[0], aPrimary[1], aPrimary[2])
  const perturbationMagnitude = Math.hypot(aPert[0], aPert[1], aPert[2])
  const perturbationRatio = perturbationMagnitude / Math.max(primaryMagnitude, 1e-12)

  return {
    primaryName,
    primaryAcceleration: aPrimary,
    perturbationAcceleration: aPert,
    totalAcceleration: aTotal,
    primaryMagnitude,
    perturbationMagnitude,
    perturbationRatio,
  }
}

/**
 * Built-in body configs at representative ECI positions for the Artemis II epoch.
 * For production use, replace positions with JPL DE440 ephemeris data.
 */
export const BODIES_EARTH_MOON_SUN: CelestialBody[] = [
  { name: 'Earth', mu: 3.986004418e14, position: [0, 0, 0] },
  { name: 'Moon',  mu: 4.9048695e12,  position: [384400e3, 0, 0] },   // simplified
  { name: 'Sun',   mu: 1.32712440018e20, position: [-1.496e11, 0, 0] }, // simplified
]
