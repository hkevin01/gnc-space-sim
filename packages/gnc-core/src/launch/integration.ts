/**
 * Launch Vehicle Integration and Staging for SLS
 *
 * Handles mass flow, thrust calculations, and staging events
 * for multi-stage vehicles with parallel boosters (SRBs).
 *
 * Key features:
 * - Parallel booster support (SRB + Core Stage)
 * - Mass tracking with jettison events
 * - Thrust aggregation across active stages
 * - Staging condition monitoring
 */

import { interpolateThrust, ThrustProfile } from '../engines/thrust_curves';

export interface StageConfig {
  name: string;
  dryMass: number; // kg
  propMass: number; // kg
  thrust: number; // N (vacuum)
  thrustSL: number; // N (sea level)
  isp: number; // s (vacuum)
  ispSL: number; // s (sea level)
  thrustProfile?: ThrustProfile;
  parallel?: boolean; // true for SRBs
  gimbalRange?: number; // degrees
}

export interface StagingEvent {
  name: string;
  condition: 'time' | 'burnout' | 'altitude' | 'velocity';
  value: number;
  jettison?: {
    stageName: string;
    mass: number; // kg
  };
  ignition?: {
    stageName: string;
  };
}

export interface VehicleState {
  time: number; // seconds from liftoff
  altitude: number; // m
  velocity: number; // m/s
  mass: number; // kg current total mass
  thrust: number; // N current total thrust
  stages: StageState[];
  activeStages: string[];
}

export interface StageState {
  name: string;
  active: boolean;
  burnTime: number; // seconds this stage has been burning
  propRemaining: number; // kg propellant remaining
  thrust: number; // N current thrust output
}

/**
 * Multi-Stage Vehicle Integration System
 *
 * Manages staging, mass flow, and thrust calculation for complex vehicles
 */
export class VehicleIntegrator {
  private stages: Map<string, StageConfig>
  private stagingEvents: StagingEvent[]
  private currentState: VehicleState
  private payloadMass: number // kg

  constructor(
    stages: StageConfig[],
    stagingEvents: StagingEvent[],
    payloadMass: number
  ) {
    this.stages = new Map()
    stages.forEach(stage => this.stages.set(stage.name, stage))

    this.stagingEvents = stagingEvents.sort((a, b) => {
      // Sort by time/value for event processing
      if (a.condition === 'time' && b.condition === 'time') {
        return a.value - b.value
      }
      return 0
    })

    this.payloadMass = payloadMass
    this.currentState = this.initializeState()
  }

  /**
   * Initialize vehicle state at liftoff
   */
  private initializeState(): VehicleState {
    const stageStates: StageState[] = []
    let totalMass = this.payloadMass
    const activeStages: string[] = []

    for (const [name, config] of this.stages) {
      const stageState: StageState = {
        name,
        active: true, // All stages start active (SRBs + Core)
        burnTime: 0,
        propRemaining: config.propMass,
        thrust: 0
      }

      stageStates.push(stageState)
      totalMass += config.dryMass + config.propMass
      activeStages.push(name)
    }

    return {
      time: 0,
      altitude: 0,
      velocity: 0,
      mass: totalMass,
      thrust: 0,
      stages: stageStates,
      activeStages
    }
  }

  /**
   * Update vehicle state for given mission time
   */
  update(time: number, altitude: number, velocity: number): VehicleState {
    const deltaTime = time - this.currentState.time

    // Update stage burn times and propellant consumption
    this.updateStages(deltaTime, altitude)

    // Check for staging events
    this.processEvents(time, altitude, velocity)

    // Calculate current total mass and thrust
    this.calculateMassAndThrust()

    this.currentState.time = time
    this.currentState.altitude = altitude
    this.currentState.velocity = velocity

    return { ...this.currentState }
  }

  /**
   * Update individual stage states
   */
  private updateStages(deltaTime: number, altitude: number): void {
    for (const stageState of this.currentState.stages) {
      if (!stageState.active) continue

      const config = this.stages.get(stageState.name)!

      // Update burn time
      stageState.burnTime += deltaTime

      // Calculate current thrust (altitude-dependent)
      const currentThrust = this.getStageThrust(config, stageState.burnTime, altitude)
      stageState.thrust = currentThrust

      // Calculate mass flow and update propellant
      if (currentThrust > 0) {
        const isp = altitude < 1000 ? config.ispSL : config.isp
        const massFlow = currentThrust / (isp * 9.80665) // kg/s
        stageState.propRemaining = Math.max(0, stageState.propRemaining - massFlow * deltaTime)

        // Check for burnout
        if (stageState.propRemaining <= 0) {
          stageState.active = false
          stageState.thrust = 0
        }
      }
    }
  }

  /**
   * Get current thrust for a stage
   */
  private getStageThrust(config: StageConfig, burnTime: number, altitude: number): number {
    // Use thrust profile if available
    if (config.thrustProfile) {
      return interpolateThrust(burnTime, config.thrustProfile)
    }

    // Use constant thrust based on altitude
    const baseThrust = altitude < 1000 ? config.thrustSL : config.thrust

    // Simple thrust curve: full thrust until burnout
    const totalBurnTime = config.propMass / this.calculateMassFlow(config.thrust, config.isp)

    if (burnTime < totalBurnTime) {
      return baseThrust
    }

    return 0
  }

  /**
   * Calculate mass flow rate
   */
  private calculateMassFlow(thrust: number, isp: number): number {
    return thrust / (isp * 9.80665)
  }

  /**
   * Process staging events
   */
  private processEvents(time: number, altitude: number, velocity: number): void {
    for (const event of this.stagingEvents) {
      if (this.isEventTriggered(event, time, altitude, velocity)) {
        this.executeEvent(event)
      }
    }
  }

  /**
   * Check if staging event is triggered
   */
  private isEventTriggered(
    event: StagingEvent,
    time: number,
    altitude: number,
    velocity: number
  ): boolean {
    switch (event.condition) {
      case 'time':
        return time >= event.value
      case 'altitude':
        return altitude >= event.value
      case 'velocity':
        return velocity >= event.value
      case 'burnout': {
        // Check if specified stage has burned out
        const stage = this.currentState.stages.find(s => s.name === event.name)
        return stage ? stage.propRemaining <= 0 : false
      }
      default:
        return false
    }
  }

  /**
   * Execute staging event
   */
  private executeEvent(event: StagingEvent): void {
    // Handle stage jettison
    if (event.jettison) {
      const stageIndex = this.currentState.stages.findIndex(
        s => s.name === event.jettison!.stageName
      )

      if (stageIndex >= 0) {
        this.currentState.stages[stageIndex].active = false
        this.currentState.activeStages = this.currentState.activeStages.filter(
          name => name !== event.jettison!.stageName
        )

        // Remove jettisoned mass
        this.currentState.mass -= event.jettison.mass
      }
    }

    // Handle stage ignition
    if (event.ignition) {
      const stageIndex = this.currentState.stages.findIndex(
        s => s.name === event.ignition!.stageName
      )

      if (stageIndex >= 0) {
        this.currentState.stages[stageIndex].active = true
        this.currentState.stages[stageIndex].burnTime = 0

        if (!this.currentState.activeStages.includes(event.ignition.stageName)) {
          this.currentState.activeStages.push(event.ignition.stageName)
        }
      }
    }
  }

  /**
   * Calculate total vehicle mass and thrust
   */
  private calculateMassAndThrust(): void {
    let totalMass = this.payloadMass
    let totalThrust = 0

    for (const stageState of this.currentState.stages) {
      if (stageState.active) {
        const config = this.stages.get(stageState.name)!

        // Add stage dry mass and remaining propellant
        totalMass += config.dryMass + stageState.propRemaining

        // Add thrust (multiply by 2 for parallel boosters like SRBs)
        const multiplier = config.parallel ? 2 : 1
        totalThrust += stageState.thrust * multiplier
      }
    }

    this.currentState.mass = totalMass
    this.currentState.thrust = totalThrust
  }

  /**
   * Get current vehicle state
   */
  getState(): VehicleState {
    return { ...this.currentState }
  }

  /**
   * Get active stages
   */
  getActiveStages(): string[] {
    return [...this.currentState.activeStages]
  }

  /**
   * Check if stage is active
   */
  isStageActive(stageName: string): boolean {
    return this.currentState.activeStages.includes(stageName)
  }

  /**
   * Get stage propellant remaining percentage
   */
  getStagePropellantRemaining(stageName: string): number {
    const stageState = this.currentState.stages.find(s => s.name === stageName)
    const config = this.stages.get(stageName)

    if (!stageState || !config) return 0

    return (stageState.propRemaining / config.propMass) * 100
  }

  /**
   * Get total vehicle thrust-to-weight ratio
   */
  getThrustToWeight(): number {
    const weight = this.currentState.mass * 9.80665 // N
    return this.currentState.thrust / weight
  }
}

export default VehicleIntegrator;
