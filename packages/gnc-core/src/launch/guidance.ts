import { MU_EARTH } from '../math/constants'
import {
    EARTH_RADIUS,
    FAIRING_JETTISON_ALT,
    KARMAN_LINE,
    LAUNCH_LAT,
    MAX_Q_ALT,
    SCALE_HEIGHT,
    SEA_LEVEL_PRESSURE,
    STAGE1_BURN_TIME,
    STAGE1_SEPARATION_ALT,
    STAGE2_BURN_TIME
} from '../math/physics'
import { State6, Vec3 } from '../orbits/twobody'

/**
 * Launch Mission Phases
 */
export enum LaunchPhase {
  PRELAUNCH = 'prelaunch',
  LIFTOFF = 'liftoff',
  STAGE1_BURN = 'stage1_burn',
  MAX_Q = 'max_q',
  STAGE1_SEPARATION = 'stage1_separation',
  STAGE2_IGNITION = 'stage2_ignition',
  FAIRING_JETTISON = 'fairing_jettison',
  STAGE2_BURN = 'stage2_burn',
  ORBITAL_INSERTION = 'orbital_insertion',
  ORBIT_CIRCULARIZATION = 'orbit_circularization'
}

/**
 * Launch Vehicle Configuration
 */
export interface LaunchVehicle {
  stage1: {
    mass_dry: number      // kg
    mass_propellant: number // kg
    thrust: number        // N
    isp: number          // s
    burn_time: number    // s
  }
  stage2: {
    mass_dry: number      // kg
    mass_propellant: number // kg
    thrust: number        // N
    isp: number          // s
    burn_time: number    // s
  }
  payload_mass: number    // kg
  fairing_mass: number   // kg
}

/**
 * Launch State including vehicle and atmospheric conditions
 */
export interface LaunchState extends State6 {
  phase: LaunchPhase
  mission_time: number      // s since liftoff
  altitude: number          // m above sea level
  velocity_magnitude: number // m/s
  flight_path_angle: number // rad
  heading: number           // rad (0 = East, π/2 = North)
  mass: number             // kg current vehicle mass
  thrust: Vec3             // N thrust vector
  drag: Vec3               // N drag force
  atmosphere: {
    pressure: number       // Pa
    density: number        // kg/m³
    temperature: number    // K
  }
  guidance: {
    pitch_program: number  // rad commanded pitch
    yaw_program: number    // rad commanded yaw
    throttle: number       // 0-1 throttle setting
  }
}

/**
 * Gravity Turn Launch Guidance Algorithm
 *
 * Classical gravity turn profile for efficient atmospheric ascent:
 * 1. Vertical launch to clear atmosphere
 * 2. Gradual pitch-over following gravity vector
 * 3. Constant pitch rate to parking orbit insertion
 */
export class GravityTurnGuidance {
  private target_orbit_altitude: number
  private target_inclination: number
  private pitch_start_velocity: number = 100 // m/s
  private pitch_end_velocity: number = 2000 // m/s

  constructor(target_altitude: number, inclination: number) {
    this.target_orbit_altitude = target_altitude
    this.target_inclination = inclination
  }

  /**
   * Compute guidance commands for current state
   */
  computeGuidance(state: LaunchState): { pitch: number, yaw: number, throttle: number } {
    const velocity = state.velocity_magnitude
    const altitude = state.altitude

    // Pitch Program: Gravity Turn Profile
    let pitch: number
    if (velocity < this.pitch_start_velocity) {
      // Vertical flight during initial ascent
      pitch = Math.PI / 2 // 90 degrees
    } else if (velocity < this.pitch_end_velocity) {
      // Gradual pitch-over following gravity turn
      const progress = (velocity - this.pitch_start_velocity) /
                      (this.pitch_end_velocity - this.pitch_start_velocity)
      pitch = Math.PI / 2 * (1 - progress * 0.7) // Pitch from 90° to ~27°
    } else {
      // Shallow ascent for orbital insertion
      const target_pitch = Math.atan2(
        this.target_orbit_altitude - altitude,
        velocity * 60 // Look ahead 60 seconds
      )
      pitch = Math.max(target_pitch, 0.1) // Minimum 5.7° pitch
    }

    // Yaw Program: Launch Azimuth for Target Inclination
    const yaw = this.computeLaunchAzimuth(this.target_inclination)

    // Throttle Program: Manage Dynamic Pressure and Acceleration
    let throttle = 1.0
    if (altitude > MAX_Q_ALT && altitude < KARMAN_LINE) {
      // Reduce throttle during max-Q phase
      throttle = 0.65
    }

    return { pitch, yaw, throttle }
  }

  /**
   * Launch Azimuth Calculation
   *
   * β = arcsin(cos(i) / cos(φ))
   * where:
   * β = launch azimuth
   * i = target inclination
   * φ = launch site latitude
   */
  private computeLaunchAzimuth(target_inclination: number): number {
    const cos_inclination = Math.cos(target_inclination)
    const cos_latitude = Math.cos(LAUNCH_LAT)

    if (Math.abs(cos_inclination) > Math.abs(cos_latitude)) {
      // Direct launch possible
      return Math.asin(cos_inclination / cos_latitude)
    } else {
      // Dogleg maneuver required - simplified eastward launch
      return 0 // Due east
    }
  }
}

/**
 * Atmospheric Model - Exponential Atmosphere
 *
 * ρ(h) = ρ₀ × e^(-h/H)
 * where:
 * ρ₀ = sea level density
 * H = scale height
 * h = altitude
 */
export function computeAtmosphere(altitude: number) {
  const pressure = SEA_LEVEL_PRESSURE * Math.exp(-altitude / SCALE_HEIGHT)
  const temperature = 288.15 - 0.0065 * Math.min(altitude, 11000) // Troposphere model
  const density = pressure / (287 * temperature) // Ideal gas law

  return { pressure, density, temperature }
}

/**
 * Aerodynamic Drag Calculation
 *
 * F_drag = ½ × ρ × v² × C_d × A
 * where:
 * ρ = atmospheric density
 * v = velocity magnitude
 * C_d = drag coefficient
 * A = reference area
 */
export function computeDrag(
  velocity: Vec3,
  atmosphere: { density: number },
  drag_coefficient: number = 0.3,
  reference_area: number = 10 // m²
): Vec3 {
  const v_mag = Math.hypot(velocity[0], velocity[1], velocity[2])
  if (v_mag === 0) return [0, 0, 0]

  const drag_magnitude = 0.5 * atmosphere.density * v_mag * v_mag *
                        drag_coefficient * reference_area

  // Drag opposes velocity direction
  return [
    -drag_magnitude * velocity[0] / v_mag,
    -drag_magnitude * velocity[1] / v_mag,
    -drag_magnitude * velocity[2] / v_mag
  ]
}

/**
 * Rocket Equation for Mass Flow
 *
 * dm/dt = F / (I_sp × g₀)
 * where:
 * F = thrust
 * I_sp = specific impulse
 * g₀ = standard gravity
 */
export function computeMassFlow(thrust: number, isp: number): number {
  const g0 = 9.80665 // m/s²
  return thrust / (isp * g0)
}

/**
 * Launch Trajectory Integration
 *
 * Integrates 6-DOF equations of motion including:
 * - Gravitational acceleration
 * - Thrust acceleration
 * - Atmospheric drag
 * - Earth rotation effects
 * - Vehicle mass changes
 */
export function integrateLaunchTrajectory(
  state: LaunchState,
  vehicle: LaunchVehicle,
  guidance: GravityTurnGuidance,
  dt: number
): LaunchState {
  // Current vehicle configuration based on phase
  const current_stage = getCurrentStageConfig(state, vehicle)

  // Atmospheric conditions
  const atmosphere = computeAtmosphere(state.altitude)

  // Guidance commands
  const commands = guidance.computeGuidance(state)

  // Thrust vector in body frame, transformed to inertial frame
  const thrust_magnitude = current_stage.thrust * commands.throttle
  const thrust: Vec3 = [
    thrust_magnitude * Math.cos(commands.pitch) * Math.cos(commands.yaw),
    thrust_magnitude * Math.cos(commands.pitch) * Math.sin(commands.yaw),
    thrust_magnitude * Math.sin(commands.pitch)
  ]

  // Drag force
  const drag = computeDrag(state.v, atmosphere)

  // Gravitational acceleration
  const r_mag = Math.hypot(state.r[0], state.r[1], state.r[2])
  const g_accel = -MU_EARTH / (r_mag * r_mag * r_mag)
  const gravity: Vec3 = [
    g_accel * state.r[0],
    g_accel * state.r[1],
    g_accel * state.r[2]
  ]

  // Total acceleration
  const mass = state.mass
  const acceleration: Vec3 = [
    (thrust[0] + drag[0]) / mass + gravity[0],
    (thrust[1] + drag[1]) / mass + gravity[1],
    (thrust[2] + drag[2]) / mass + gravity[2]
  ]

  // Integrate state (simple Euler for now)
  const new_r: Vec3 = [
    state.r[0] + state.v[0] * dt,
    state.r[1] + state.v[1] * dt,
    state.r[2] + state.v[2] * dt
  ]

  const new_v: Vec3 = [
    state.v[0] + acceleration[0] * dt,
    state.v[1] + acceleration[1] * dt,
    state.v[2] + acceleration[2] * dt
  ]

  // Update mass (propellant consumption)
  const mass_flow = thrust_magnitude > 0 ?
    computeMassFlow(thrust_magnitude, current_stage.isp) : 0
  const new_mass = Math.max(mass - mass_flow * dt, current_stage.mass_dry)

  // Compute derived quantities
  const altitude = Math.hypot(new_r[0], new_r[1], new_r[2]) - EARTH_RADIUS
  const velocity_magnitude = Math.hypot(new_v[0], new_v[1], new_v[2])
  const flight_path_angle = Math.asin(
    (new_r[0] * new_v[0] + new_r[1] * new_v[1] + new_r[2] * new_v[2]) /
    (Math.hypot(new_r[0], new_r[1], new_r[2]) * velocity_magnitude)
  )

  // Update mission phase
  const new_phase = updateLaunchPhase(state, altitude, state.mission_time + dt)

  return {
    r: new_r,
    v: new_v,
    phase: new_phase,
    mission_time: state.mission_time + dt,
    altitude,
    velocity_magnitude,
    flight_path_angle,
    heading: commands.yaw,
    mass: new_mass,
    thrust,
    drag,
    atmosphere,
    guidance: {
      pitch_program: commands.pitch,
      yaw_program: commands.yaw,
      throttle: commands.throttle
    }
  }
}

/**
 * Determine current stage configuration based on mission phase and time
 */
function getCurrentStageConfig(state: LaunchState, vehicle: LaunchVehicle) {
  switch (state.phase) {
    case LaunchPhase.LIFTOFF:
    case LaunchPhase.STAGE1_BURN:
    case LaunchPhase.MAX_Q:
      return vehicle.stage1
    case LaunchPhase.STAGE2_IGNITION:
    case LaunchPhase.STAGE2_BURN:
    case LaunchPhase.ORBITAL_INSERTION:
      return vehicle.stage2
    default:
      return vehicle.stage1
  }
}

/**
 * Update mission phase based on current conditions
 */
function updateLaunchPhase(
  state: LaunchState,
  altitude: number,
  mission_time: number
): LaunchPhase {
  // Phase transitions based on time and altitude
  if (mission_time < 5) return LaunchPhase.LIFTOFF
  if (mission_time < STAGE1_BURN_TIME && altitude < STAGE1_SEPARATION_ALT) {
    if (altitude > MAX_Q_ALT && altitude < MAX_Q_ALT + 5000) {
      return LaunchPhase.MAX_Q
    }
    return LaunchPhase.STAGE1_BURN
  }
  if (mission_time < STAGE1_BURN_TIME + 10) return LaunchPhase.STAGE1_SEPARATION
  if (mission_time < STAGE1_BURN_TIME + 15) return LaunchPhase.STAGE2_IGNITION
  if (altitude < FAIRING_JETTISON_ALT) return LaunchPhase.STAGE2_BURN
  if (mission_time < STAGE1_BURN_TIME + STAGE2_BURN_TIME) {
    if (altitude > FAIRING_JETTISON_ALT && state.phase !== LaunchPhase.FAIRING_JETTISON) {
      return LaunchPhase.FAIRING_JETTISON
    }
    return LaunchPhase.STAGE2_BURN
  }
  if (altitude < 200000) return LaunchPhase.ORBITAL_INSERTION
  return LaunchPhase.ORBIT_CIRCULARIZATION
}

/**
 * Standard Launch Vehicle Configurations
 */
export const LAUNCH_VEHICLES = {
  FALCON_9: {
    stage1: {
      mass_dry: 25600,      // kg
      mass_propellant: 395700, // kg
      thrust: 7607000,      // N (sea level)
      isp: 282,             // s (sea level)
      burn_time: 162        // s
    },
    stage2: {
      mass_dry: 4000,       // kg
      mass_propellant: 92670, // kg
      thrust: 934000,       // N (vacuum)
      isp: 348,             // s (vacuum)
      burn_time: 397        // s
    },
    payload_mass: 22800,    // kg (LEO)
    fairing_mass: 1750      // kg
  },

  ATLAS_V: {
    stage1: {
      mass_dry: 21054,      // kg
      mass_propellant: 284450, // kg
      thrust: 3827000,      // N
      isp: 311,             // s
      burn_time: 253        // s
    },
    stage2: {
      mass_dry: 2086,       // kg
      mass_propellant: 20830, // kg
      thrust: 99200,        // N
      isp: 450,             // s
      burn_time: 842        // s
    },
    payload_mass: 18850,    // kg (LEO)
    fairing_mass: 1361      // kg
  }
} as const
