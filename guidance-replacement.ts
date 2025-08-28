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
      pitch = Math.PI / 2 * (1 - progress * 0.7)
    } else {
      const target_pitch = Math.atan2(this.target_orbit_altitude - altitude, velocity * 60)
      pitch = Math.max(target_pitch, 0.1)
    }

    const yaw = this.computeLaunchAzimuth(this.target_inclination)

    let throttle = 1.0
    if (altitude > MAX_Q_ALT && altitude < KARMAN_LINE) {
      throttle = 0.65
    }

    return { pitch, yaw, throttle }
  }

  protected computeLaunchAzimuth(target_inclination: number): number {
    const cos_inclination = Math.cos(target_inclination)
    const cos_latitude = Math.cos(LAUNCH_LAT)

    if (Math.abs(cos_inclination) > Math.abs(cos_latitude)) {
      return Math.asin(cos_inclination / cos_latitude)
    } else {
      return 0
    }
  }
}

/**
 * Enhanced SLS-Specific Guidance Algorithm
 */
export class SLSGuidance extends GravityTurnGuidance {
  private pitchProgram: Array<{ time: number; pitch: number }>
  private throttleProgram: Array<{ time: number; throttle: number }>

  constructor(
    target_altitude: number,
    inclination: number,
    pitchProgram?: Array<{ time: number; pitch: number }>,
    throttleProgram?: Array<{ time: number; throttle: number }>
  ) {
    super(target_altitude, inclination)

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

    this.throttleProgram = throttleProgram || [
      { time: 0, throttle: 1.0 },
      { time: 40, throttle: 0.67 },
      { time: 70, throttle: 1.0 },
      { time: 126, throttle: 1.0 },
      { time: 400, throttle: 0.67 },
      { time: 480, throttle: 0.0 }
    ]
  }

  computeGuidance(state: LaunchState): { pitch: number, yaw: number, throttle: number } {
    const missionTime = state.mission_time
    const pitch = this.interpolatePitchProgram(missionTime) * Math.PI / 180
    const yaw = this.computeLaunchAzimuth(this.target_inclination)
    const throttle = this.interpolateThrottleProgram(missionTime)
    return { pitch, yaw, throttle }
  }

  private interpolatePitchProgram(time: number): number {
    if (time <= this.pitchProgram[0].time) {
      return this.pitchProgram[0].pitch
    }

    for (let i = 0; i < this.pitchProgram.length - 1; i++) {
      const t0 = this.pitchProgram[i].time
      const t1 = this.pitchProgram[i + 1].time

      if (time >= t0 && time <= t1) {
        const alpha = (time - t0) / (t1 - t0)
        return this.pitchProgram[i].pitch + alpha * (this.pitchProgram[i + 1].pitch - this.pitchProgram[i].pitch)
      }
    }

    return this.pitchProgram[this.pitchProgram.length - 1].pitch
  }

  private interpolateThrottleProgram(time: number): number {
    if (time <= this.throttleProgram[0].time) {
      return this.throttleProgram[0].throttle
    }

    for (let i = 0; i < this.throttleProgram.length - 1; i++) {
      const t0 = this.throttleProgram[i].time
      const t1 = this.throttleProgram[i + 1].time

      if (time >= t0 && time <= t1) {
        const alpha = (time - t0) / (t1 - t0)
        return this.throttleProgram[i].throttle + alpha * (this.throttleProgram[i + 1].throttle - this.throttleProgram[i].throttle)
      }
    }

    return this.throttleProgram[this.throttleProgram.length - 1].throttle
  }
}

export function computeAtmosphere(altitude: number) {
  const pressure = SEA_LEVEL_PRESSURE * Math.exp(-altitude / SCALE_HEIGHT)
  const temperature = 288.15 - 0.0065 * Math.min(altitude, 11000)
  const density = pressure / (287 * temperature)
  return { pressure, density, temperature }
}

export function computeDrag(
  velocity: Vec3,
  atmosphere: { density: number },
  drag_coefficient: number = 0.3,
  reference_area: number = 10
): Vec3 {
  const v_mag = Math.hypot(velocity[0], velocity[1], velocity[2])
  if (v_mag === 0) return [0, 0, 0]

  const drag_magnitude = 0.5 * atmosphere.density * v_mag * v_mag * drag_coefficient * reference_area
  const unit_velocity: Vec3 = [velocity[0] / v_mag, velocity[1] / v_mag, velocity[2] / v_mag]
  return [-drag_magnitude * unit_velocity[0], -drag_magnitude * unit_velocity[1], -drag_magnitude * unit_velocity[2]]
}

export function determineLaunchPhase(
  mission_time: number,
  altitude: number,
  velocity_magnitude: number
): LaunchPhase {
  if (mission_time < 0.1) return LaunchPhase.PRELAUNCH
  if (mission_time < 5) return LaunchPhase.LIFTOFF

  if (mission_time < STAGE1_BURN_TIME) {
    if (altitude > MAX_Q_ALT && altitude < MAX_Q_ALT + 5000) {
      return LaunchPhase.MAX_Q
    }
    return LaunchPhase.STAGE1_BURN
  }
  if (mission_time < STAGE1_BURN_TIME + 10) return LaunchPhase.STAGE1_SEPARATION
  if (mission_time < STAGE1_BURN_TIME + 15) return LaunchPhase.STAGE2_IGNITION
  if (altitude < FAIRING_JETTISON_ALT) return LaunchPhase.STAGE2_BURN

  if (altitude < FAIRING_JETTISON_ALT + 10000) return LaunchPhase.FAIRING_JETTISON

  if (velocity_magnitude < 7800) {
    return LaunchPhase.STAGE2_BURN
  }

  return LaunchPhase.ORBITAL_INSERTION
}
