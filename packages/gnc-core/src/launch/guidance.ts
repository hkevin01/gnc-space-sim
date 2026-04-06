/**
 * ID: GNC-GUID-001
 * Requirement: Implement closed-loop pitch/yaw/throttle guidance for the SLS
 *   powered ascent from liftoff through MECO, including gravity-turn and a
 *   time-scheduled pitch programme.
 * Purpose: Provide the guidance law that steers the launch vehicle along the
 *   optimal ascent trajectory while managing structural loads (max-Q) and
 *   achieving the required orbital insertion conditions.
 * Rationale: A gravity-turn combined with an explicit time-based pitch
 *   schedule is standard practice for high-T/W vehicles (SLS T/W ≈ 1.35).
 *   Pure energy-optimal guidance (e.g. PEG) is added in the ICPS phase;
 *   during the first stage a scheduled open-loop pitch programme is more
 *   robust against sensor failures.
 * Inputs: LaunchState (velocity_magnitude [m/s], altitude [m],
 *   mission_time [s], heading [rad], flight_path_angle [rad])
 * Outputs: { pitch [rad], yaw [rad], throttle [0..1] }
 * Preconditions: LaunchState fields are finite real numbers; mission_time ≥ 0.
 * Postconditions: pitch ∈ [0, π/2]; yaw is finite; throttle ∈ [0, 1].
 * Assumptions: Launch site is Cape Canaveral (lat 28.608°); atmosphere model
 *   is exponential (scale height 8.4 km).
 * Failure Modes: NaN propagation from invalid state → invalid TVC commands →
 *   vehicle loss. All outputs clamped/validated before consumption by control layer.
 * Constraints: Guidance updates at simulation frame rate (≥ 1 Hz).
 * Verification: guidance.spec.ts TEST-GUID-001 to TEST-GUID-011.
 * References: Greensite, "Analysis and Design of Space Vehicle Flight Control
 *   Systems"; NASA SP-8110 "Guidance and Navigation for Entry Vehicles"
 *   (adapted for ascent); SLS Block 1 Mission Design Document.
 */
import {
  FAIRING_JETTISON_ALT,
  KARMAN_LINE,
  LAUNCH_LAT,
  MAX_Q_ALT,
  SCALE_HEIGHT,
  SEA_LEVEL_PRESSURE,
  STAGE1_BURN_TIME
} from '../math/physics'
import { State6, Vec3 } from '../orbits/twobody'

/**
 * Launch Mission Phases - Enhanced for SLS
 */
export enum LaunchPhase {
  PRELAUNCH = 'prelaunch',
  LIFTOFF = 'liftoff',
  BOOSTER_BURN = 'booster_burn',
  STAGE1_BURN = 'stage1_burn',
  MAX_Q = 'max_q',
  BOOSTER_SEPARATION = 'booster_separation',
  STAGE1_SEPARATION = 'stage1_separation',
  CORE_STAGE_BURN = 'core_stage_burn',
  LAS_JETTISON = 'las_jettison',
  CORE_STAGE_MECO = 'core_stage_meco',
  CORE_SEPARATION = 'core_separation',
  UPPER_STAGE_IGNITION = 'upper_stage_ignition',
  STAGE2_IGNITION = 'stage2_ignition',
  FAIRING_JETTISON = 'fairing_jettison',
  UPPER_STAGE_BURN = 'upper_stage_burn',
  STAGE2_BURN = 'stage2_burn',
  ORBITAL_INSERTION = 'orbital_insertion',
  ORBIT_CIRCULARIZATION = 'orbit_circularization',
  TLI_PREP = 'tli_prep',
  TLI_BURN = 'tli_burn'
}

/**
 * Launch Vehicle Configuration
 */
export interface LaunchVehicle {
  stage1: {
    mass_dry: number
    mass_propellant: number
    thrust: number
    isp: number
    burn_time: number
  }
  stage2: {
    mass_dry: number
    mass_propellant: number
    thrust: number
    isp: number
    burn_time: number
  }
  payload_mass: number
  fairing_mass: number
}

/**
 * Launch State including vehicle and atmospheric conditions
 */
export interface LaunchState extends State6 {
  phase: LaunchPhase
  mission_time: number
  altitude: number
  velocity_magnitude: number
  flight_path_angle: number
  heading: number
  mass: number
  thrust: Vec3
  drag: Vec3
  atmosphere: {
    pressure: number
    density: number
    temperature: number
  }
  guidance: {
    pitch_program: number
    yaw_program: number
    throttle: number
  }
}

/**
 * Gravity Turn Launch Guidance Algorithm
 */
export class GravityTurnGuidance {
  protected target_orbit_altitude: number
  protected target_inclination: number
  private pitch_start_velocity: number = 100
  private pitch_end_velocity: number = 2000

  constructor(target_altitude: number, inclination: number) {
    this.target_orbit_altitude = target_altitude
    this.target_inclination = inclination
  }

  computeGuidance(state: LaunchState): { pitch: number, yaw: number, throttle: number } {
    const velocity = state.velocity_magnitude
    const altitude = state.altitude

    let pitch: number
    if (velocity < this.pitch_start_velocity) {
      pitch = Math.PI / 2
    } else if (velocity < this.pitch_end_velocity) {
      const progress = (velocity - this.pitch_start_velocity) / (this.pitch_end_velocity - this.pitch_start_velocity)
      pitch = Math.PI / 2 * (1 - progress * 0.7) // Pitch from 90° to ~27°
    } else {
      // Shallow ascent for orbital insertion
      const target_pitch = Math.atan2(
        this.target_orbit_altitude - altitude,
        velocity * 60 // Look ahead 60 seconds
      )
      // Clamp to gravity-turn end pitch (~27°) to avoid discontinuity at transition
      const gravity_turn_end_pitch = Math.PI / 2 * (1 - 0.7)
      pitch = Math.min(gravity_turn_end_pitch, Math.max(target_pitch, 0.1))
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
  protected computeLaunchAzimuth(target_inclination: number): number {
    const cos_inclination = Math.cos(target_inclination)
    const cos_latitude = Math.cos(LAUNCH_LAT)

    if (Math.abs(cos_inclination) <= Math.abs(cos_latitude)) {
      // Direct launch possible: |cos(i)| / |cos(lat)| <= 1, arcsin is valid
      return Math.asin(cos_inclination / cos_latitude)
    } else {
      // Dogleg maneuver required (inclination unreachable from this latitude)
      return 0 // Due east
    }
  }
}

/**
 * Enhanced SLS-Specific Guidance Algorithm
 *
 * Supports high thrust-to-weight ratio vehicles like SLS with:
 * 1. Initial pitch kick maneuver
 * 2. Programmable pitch schedule
 * 3. SRB + Core Stage configuration
 * 4. Multiple staging events
 */
export class SLSGuidance extends GravityTurnGuidance {
  private pitchKickDeg: number
  private pitchProgram: Array<{ time: number; pitch: number }>
  private throttleProgram: Array<{ time: number; throttle: number }>

  constructor(
    target_altitude: number,
    inclination: number,
    pitchKickDeg: number = 5,
    pitchProgram?: Array<{ time: number; pitch: number }>,
    throttleProgram?: Array<{ time: number; throttle: number }>
  ) {
    super(target_altitude, inclination)
    this.pitchKickDeg = pitchKickDeg

    // Default SLS pitch program (optimized for high T/W)
    this.pitchProgram = pitchProgram || [
      { time: 0, pitch: 90 },
      { time: 10, pitch: 85 },
      { time: 20, pitch: 80 },
      { time: 40, pitch: 70 },
      { time: 60, pitch: 55 },
      { time: 90, pitch: 40 },
      { time: 120, pitch: 25 },
      { time: 180, pitch: 15 },
      { time: 300, pitch: 5 },
      { time: 480, pitch: 0 }
    ]

    // Default SLS throttle program
    this.throttleProgram = throttleProgram || [
      { time: 0, throttle: 1.0 },
      { time: 40, throttle: 0.67 }, // Max-Q throttle down
      { time: 70, throttle: 1.0 },
      { time: 126, throttle: 1.0 }, // SRB burnout
      { time: 400, throttle: 0.67 }, // MECO prep
      { time: 480, throttle: 0.0 }
    ]
  }

  /**
   * Compute SLS-specific guidance commands
   */
  computeGuidance(state: LaunchState): { pitch: number, yaw: number, throttle: number } {
    const missionTime = state.mission_time

    // Interpolate pitch from program
    const pitch = this.interpolatePitchProgram(missionTime) * Math.PI / 180

    // Compute launch azimuth
    const yaw = this.computeLaunchAzimuth(this.target_inclination)

    // Interpolate throttle from program
    const throttle = this.interpolateThrottleProgram(missionTime)

    return { pitch, yaw, throttle }
  }

  /**
   * Interpolate pitch from time-based program
   */
  private interpolatePitchProgram(time: number): number {
    if (time <= this.pitchProgram[0].time) {
      return this.pitchProgram[0].pitch
    }

    for (let i = 0; i < this.pitchProgram.length - 1; i++) {
      const t0 = this.pitchProgram[i].time
      const t1 = this.pitchProgram[i + 1].time

      if (time >= t0 && time <= t1) {
        const alpha = (time - t0) / (t1 - t0)
        return this.pitchProgram[i].pitch + alpha *
               (this.pitchProgram[i + 1].pitch - this.pitchProgram[i].pitch)
      }
    }

    return this.pitchProgram[this.pitchProgram.length - 1].pitch
  }

  /**
   * Interpolate throttle from time-based program
   */
  private interpolateThrottleProgram(time: number): number {
    if (time <= this.throttleProgram[0].time) {
      return this.throttleProgram[0].throttle
    }

    for (let i = 0; i < this.throttleProgram.length - 1; i++) {
      const t0 = this.throttleProgram[i].time
      const t1 = this.throttleProgram[i + 1].time

      if (time >= t0 && time <= t1) {
        const alpha = (time - t0) / (t1 - t0)
        return this.throttleProgram[i].throttle + alpha *
               (this.throttleProgram[i + 1].throttle - this.throttleProgram[i].throttle)
      }
    }

    return this.throttleProgram[this.throttleProgram.length - 1].throttle
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

  // Drag force opposes velocity
  const unit_velocity: Vec3 = [
    velocity[0] / v_mag,
    velocity[1] / v_mag,
    velocity[2] / v_mag
  ]

  return [
    -drag_magnitude * unit_velocity[0],
    -drag_magnitude * unit_velocity[1],
    -drag_magnitude * unit_velocity[2]
  ]
}

/**
 * Enhanced Mission Phase Determination
 */
export function determineLaunchPhase(
  mission_time: number,
  altitude: number,
  velocity_magnitude: number
): LaunchPhase {
  if (mission_time < 0.1) return LaunchPhase.PRELAUNCH
  if (mission_time < 5) return LaunchPhase.LIFTOFF

  // Stage burns
  if (mission_time < STAGE1_BURN_TIME) {
    if (altitude > MAX_Q_ALT && altitude < MAX_Q_ALT + 5000) {
      return LaunchPhase.MAX_Q
    }
    return LaunchPhase.STAGE1_BURN
  }
  if (mission_time < STAGE1_BURN_TIME + 10) return LaunchPhase.STAGE1_SEPARATION
  if (mission_time < STAGE1_BURN_TIME + 15) return LaunchPhase.STAGE2_IGNITION
  if (altitude < FAIRING_JETTISON_ALT) return LaunchPhase.STAGE2_BURN

  // Fairing jettison
  if (altitude < FAIRING_JETTISON_ALT + 10000) return LaunchPhase.FAIRING_JETTISON

  // Orbital insertion
  if (velocity_magnitude < 7800) {
    return LaunchPhase.STAGE2_BURN
  }

  return LaunchPhase.ORBITAL_INSERTION
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
