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

/**
 * Enhanced guidance system with breakthrough SSSP trajectory optimization
 * 
 * Integrates the enhanced single-source shortest path algorithm for
 * real-time trajectory planning and replanning during launch operations.
 */
export class EnhancedGuidanceSystem {
  private trajectoryPlanner: any = null // EnhancedTrajectoryPlanner
  private currentPlan: any = null // TrajectoryPlan
  private lastPlanTime: number = 0
  private replanThreshold: number = 5.0 // seconds between replanning
  
  constructor(
    private gravityTurnGuidance: GravityTurnGuidance,
    private planningEnabled: boolean = false
  ) {
    if (this.planningEnabled) {
      this.initializeTrajectoryPlanner()
    }
  }

  /**
   * Initialize enhanced trajectory planner
   */
  private async initializeTrajectoryPlanner(): Promise<void> {
    try {
      // Dynamic import to handle optional WASM dependency
      const { EnhancedTrajectoryPlanner, DEFAULT_LAUNCH_PLANNING_CONFIG } = 
        await import('../planning/trajectory-planner')
      
      this.trajectoryPlanner = new EnhancedTrajectoryPlanner(DEFAULT_LAUNCH_PLANNING_CONFIG)
      await this.trajectoryPlanner.initialize()
      
      console.log('Enhanced trajectory planner initialized successfully')
    } catch (error) {
      console.warn('Failed to initialize trajectory planner, falling back to gravity turn:', error)
      this.planningEnabled = false
    }
  }

  /**
   * Compute enhanced guidance commands with trajectory optimization
   */
  computeEnhancedGuidance(
    state: LaunchState,
    targetState?: SpacecraftState,
    disturbance?: Vec3
  ): { pitch: number, yaw: number, throttle: number, planningActive: boolean } {
    
    // Always compute gravity turn guidance as baseline
    const gravityTurnCommands = this.gravityTurnGuidance.computeGuidance(state)
    
    if (!this.planningEnabled || !this.trajectoryPlanner) {
      return { ...gravityTurnCommands, planningActive: false }
    }

    // Check if replanning is needed
    const currentTime = state.mission_time
    const shouldReplan = this.shouldReplan(currentTime, disturbance)

    if (shouldReplan && targetState) {
      this.replanTrajectory(state, targetState, disturbance)
    }

    // Use trajectory plan if available and valid
    if (this.currentPlan && this.isPlanValid(state)) {
      const trajectoryCommands = this.extractGuidanceFromPlan(state)
      return { ...trajectoryCommands, planningActive: true }
    }

    // Fall back to gravity turn guidance
    return { ...gravityTurnCommands, planningActive: false }
  }

  /**
   * Check if trajectory replanning is needed
   */
  private shouldReplan(currentTime: number, disturbance?: Vec3): boolean {
    // Time-based replanning
    if (currentTime - this.lastPlanTime > this.replanThreshold) {
      return true
    }

    // Disturbance-based replanning
    if (disturbance) {
      const disturbanceMagnitude = Math.sqrt(
        disturbance[0]**2 + disturbance[1]**2 + disturbance[2]**2
      )
      return disturbanceMagnitude > 10.0 // m/s threshold
    }

    return false
  }

  /**
   * Replan trajectory using enhanced SSSP algorithm
   */
  private async replanTrajectory(
    currentState: LaunchState,
    targetState: SpacecraftState,
    disturbance?: Vec3
  ): Promise<void> {
    try {
      const spacecraftState: SpacecraftState = {
        position: currentState.r,
        velocity: currentState.v,
        time: currentState.mission_time,
        fuelMass: currentState.mass,
        phase: currentState.phase
      }

      if (disturbance && this.currentPlan) {
        // Replan with disturbance
        this.currentPlan = await this.trajectoryPlanner.replanTrajectory(
          spacecraftState,
          this.currentPlan,
          disturbance
        )
      } else {
        // Plan new trajectory
        this.currentPlan = await this.trajectoryPlanner.planTrajectory(
          spacecraftState,
          targetState
        )
      }

      this.lastPlanTime = currentState.mission_time

      console.log(
        `Trajectory replanned: ${this.currentPlan.states.length} states, ` +
        `${this.currentPlan.totalCost.toFixed(2)} total cost, ` +
        `${this.currentPlan.planningTime.toFixed(2)}ms planning time`
      )

    } catch (error) {
      console.error('Trajectory replanning failed:', error)
      this.currentPlan = null
    }
  }

  /**
   * Check if current trajectory plan is still valid
   */
  private isPlanValid(state: LaunchState): boolean {
    if (!this.currentPlan) return false

    // Check if we're still within the planned timeline
    const planStart = this.currentPlan.states[0]?.time || 0
    const planEnd = this.currentPlan.states[this.currentPlan.states.length - 1]?.time || 0

    return state.mission_time >= planStart && state.mission_time <= planEnd
  }

  /**
   * Extract guidance commands from trajectory plan
   */
  private extractGuidanceFromPlan(state: LaunchState): { pitch: number, yaw: number, throttle: number } {
    if (!this.currentPlan || this.currentPlan.states.length === 0) {
      return this.gravityTurnGuidance.computeGuidance(state)
    }

    // Find nearest state in plan
    const nearestState = this.findNearestPlannedState(state.mission_time)
    if (!nearestState) {
      return this.gravityTurnGuidance.computeGuidance(state)
    }

    // Compute guidance to follow planned trajectory
    const targetVelocity = nearestState.velocity
    const currentVelocity = state.v

    // Compute required acceleration
    const deltaV = [
      targetVelocity[0] - currentVelocity[0],
      targetVelocity[1] - currentVelocity[1],
      targetVelocity[2] - currentVelocity[2]
    ]

    // Convert to spherical coordinates for pitch/yaw
    const deltaVMag = Math.sqrt(deltaV[0]**2 + deltaV[1]**2 + deltaV[2]**2)
    const pitch = Math.asin(deltaV[2] / deltaVMag)
    const yaw = Math.atan2(deltaV[1], deltaV[0])

    // Throttle based on required acceleration magnitude
    const throttle = Math.min(1.0, deltaVMag / 100.0) // Simplified throttle control

    return { pitch, yaw, throttle }
  }

  /**
   * Find nearest state in trajectory plan
   */
  private findNearestPlannedState(missionTime: number): SpacecraftState | null {
    if (!this.currentPlan || this.currentPlan.states.length === 0) {
      return null
    }

    // Binary search for nearest time
    let left = 0
    let right = this.currentPlan.states.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const midTime = this.currentPlan.states[mid].time

      if (midTime === missionTime) {
        return this.currentPlan.states[mid]
      } else if (midTime < missionTime) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    // Return nearest state
    const nearestIndex = Math.min(left, this.currentPlan.states.length - 1)
    return this.currentPlan.states[nearestIndex]
  }

  /**
   * Get trajectory planning performance metrics
   */
  getPerformanceMetrics(): {
    planningEnabled: boolean
    currentPlanValid: boolean
    lastPlanningTime?: number
    planStates?: number
    totalCost?: number
  } {
    return {
      planningEnabled: this.planningEnabled,
      currentPlanValid: this.currentPlan !== null,
      lastPlanningTime: this.currentPlan?.planningTime,
      planStates: this.currentPlan?.states.length,
      totalCost: this.currentPlan?.totalCost
    }
  }

  /**
   * Run performance benchmark against classical algorithms
   */
  async benchmarkPerformance(iterations: number = 50): Promise<any> {
    if (!this.trajectoryPlanner) {
      throw new Error('Trajectory planner not available for benchmarking')
    }

    return await this.trajectoryPlanner.benchmarkPerformance(iterations)
  }
}
