import {
    KARMAN_LINE,
    LAUNCH_LAT,
    MAX_Q_ALT
} from '../math/physics'
import { State6, Vec3 } from '../orbits/twobody'

/**
 * Launch Mission Phases - Enhanced for SLS
 */
export enum LaunchPhase {
  PRELAUNCH = 'prelaunch',
  LIFTOFF = 'liftoff',
  BOOSTER_BURN = 'booster_burn', // SRB + Core Stage
  MAX_Q = 'max_q',
  BOOSTER_SEPARATION = 'booster_separation', // SRB separation
  CORE_STAGE_BURN = 'core_stage_burn',
  LAS_JETTISON = 'las_jettison', // Launch Abort System jettison
  CORE_STAGE_MECO = 'core_stage_meco',
  CORE_SEPARATION = 'core_separation',
  UPPER_STAGE_IGNITION = 'upper_stage_ignition',
  FAIRING_JETTISON = 'fairing_jettison',
  UPPER_STAGE_BURN = 'upper_stage_burn',
  ORBITAL_INSERTION = 'orbital_insertion',
  ORBIT_CIRCULARIZATION = 'orbit_circularization',
  TLI_PREP = 'tli_prep', // Trans-Lunar Injection preparation
  TLI_BURN = 'tli_burn' // Trans-Lunar Injection
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
  protected target_orbit_altitude: number
  protected target_inclination: number
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
  protected computeLaunchAzimuth(target_inclination: number): number {
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

export default GravityTurnGuidance
