/**
 * Enhanced Trajectory Planning Integration
 *
 * Integrates the breakthrough SSSP algorithm with the existing GNC simulation
 * system, providing real-time trajectory optimization capabilities.
 */

import type { LaunchPhase } from './launch/types'
import { Vector3, Vector3Math } from './math/vector3'
import { TrajectoryPlanningBenchmark } from './planning/benchmark'
import { EnhancedSSSpSolver } from './planning/enhanced-sssp'
import { EnhancedTrajectoryPlanner } from './planning/trajectory-planner'

export interface TrajectoryOptimizationConfig {
  /** Maximum planning time per frame (ms) */
  maxPlanningTime: number
  /** Replan frequency (Hz) */
  replanFrequency: number
  /** Graph density for state space discretization */
  graphDensity: 'sparse' | 'medium' | 'dense'
  /** Enable warm-starting for consecutive plans */
  warmStarting: boolean
  /** Performance monitoring enabled */
  monitoring: boolean
}

export interface SpacecraftTrajectoryState {
  position: Vector3
  velocity: Vector3
  mass: number
  phase: LaunchPhase
  targetOrbit?: {
    altitude: number
    inclination: number
    eccentricity: number
  }
  constraints: {
    maxAcceleration: number
    maxThrust: number
    fuelRemaining: number
  }
}

export interface TrajectoryOptimizationResult {
  trajectory: {
    position: Vector3
    velocity: Vector3
    acceleration: Vector3
    time: number
  }[]
  performance: {
    planningTimeMs: number
    nodesVisited: number
    speedupFactor: number
    fuelEfficiency: number
  }
  success: boolean
  replanReason?: 'disturbance' | 'target_change' | 'performance' | 'schedule'
}

/**
 * Enhanced trajectory optimization system that integrates the breakthrough
 * SSSP algorithm with spacecraft guidance and control.
 */
export class EnhancedTrajectoryOptimizer {
  private planner: EnhancedTrajectoryPlanner
  private solver: EnhancedSSSpSolver
  private benchmark: TrajectoryPlanningBenchmark
  private config: TrajectoryOptimizationConfig

  private currentState: SpacecraftTrajectoryState | null = null
  private lastPlanTime = 0
  private planningHistory: TrajectoryOptimizationResult[] = []

  constructor(config: Partial<TrajectoryOptimizationConfig> = {}) {
    this.config = {
      maxPlanningTime: 50, // 50ms max per frame for real-time performance
      replanFrequency: 5,  // 5Hz replanning for dynamic environments
      graphDensity: 'medium',
      warmStarting: true,
      monitoring: true,
      ...config
    }

    this.planner = new EnhancedTrajectoryPlanner()
    this.solver = new EnhancedSSSpSolver()
    this.benchmark = new TrajectoryPlanningBenchmark()
  }

  /**
   * Initialize the trajectory optimizer with spacecraft state
   */
  async initialize(initialState: SpacecraftTrajectoryState): Promise<void> {
    this.currentState = initialState

    // Build initial state space graph
    const graph = this.buildStateSpaceGraph(initialState)
    this.solver.setGraph(graph.nodes, graph.edges)

    if (this.config.monitoring) {
      console.log('Enhanced Trajectory Optimizer initialized:', {
        graphNodes: graph.nodes.length,
        graphEdges: graph.edges.length,
        config: this.config
      })
    }
  }

  /**
   * Update spacecraft state and potentially replan trajectory
   */
  async update(
    state: SpacecraftTrajectoryState,
    deltaTime: number
  ): Promise<TrajectoryOptimizationResult | null> {
    this.currentState = state
    const currentTime = performance.now()

    // Check if replanning is needed
    const shouldReplan = this.shouldReplan(currentTime, state)
    if (!shouldReplan) {
      return null
    }

    const planStartTime = performance.now()

    try {
      // Build current state space
      const graph = this.buildStateSpaceGraph(state)

      // Configure planning parameters
      const planningConfig = {
        source: 0, // Current state node
        maxTime: this.config.maxPlanningTime,
        warmStart: this.config.warmStarting && this.planningHistory.length > 0
      }

      // Execute enhanced SSSP planning
      const planResult = await this.planner.planTrajectory(
        state.position,
        this.getTargetPosition(state),
        {
          ...planningConfig,
          constraints: state.constraints
        }
      )

      const planEndTime = performance.now()

      // Build optimization result
      const result: TrajectoryOptimizationResult = {
        trajectory: this.convertToTrajectoryPoints(planResult.path, state),
        performance: {
          planningTimeMs: planEndTime - planStartTime,
          nodesVisited: planResult.stats.nodesVisited,
          speedupFactor: this.estimateSpeedupFactor(planResult.stats),
          fuelEfficiency: this.calculateFuelEfficiency(planResult.path, state)
        },
        success: planResult.success,
        replanReason: this.getReplanReason(state)
      }

      // Update planning history
      this.planningHistory.push(result)
      if (this.planningHistory.length > 100) {
        this.planningHistory.shift() // Keep last 100 results
      }

      this.lastPlanTime = currentTime

      if (this.config.monitoring) {
        console.log('Trajectory replanned:', {
          reason: result.replanReason,
          performance: result.performance,
          success: result.success
        })
      }

      return result

    } catch (error) {
      console.error('Trajectory planning failed:', error)
      return {
        trajectory: [],
        performance: { planningTimeMs: 0, nodesVisited: 0, speedupFactor: 1, fuelEfficiency: 0 },
        success: false
      }
    }
  }

  /**
   * Run comprehensive benchmarks to validate algorithm performance
   */
  async runBenchmarks(): Promise<any> {
    if (this.config.monitoring) {
      console.log('Running trajectory planning benchmarks...')
    }

    const benchmarkResults = await this.benchmark.runComprehensiveBenchmark()

    if (this.config.monitoring) {
      console.log('Benchmark results:', benchmarkResults)
    }

    return benchmarkResults
  }

  /**
   * Get current optimization statistics
   */
  getStatistics() {
    if (this.planningHistory.length === 0) {
      return null
    }

    const recentResults = this.planningHistory.slice(-10) // Last 10 plans
    const avgPlanningTime = recentResults.reduce((sum, r) => sum + r.performance.planningTimeMs, 0) / recentResults.length
    const avgSpeedup = recentResults.reduce((sum, r) => sum + r.performance.speedupFactor, 0) / recentResults.length
    const successRate = recentResults.filter(r => r.success).length / recentResults.length

    return {
      totalPlans: this.planningHistory.length,
      averagePlanningTime: avgPlanningTime,
      averageSpeedupFactor: avgSpeedup,
      successRate: successRate,
      replanReasons: this.getReplanReasonCounts()
    }
  }

  private shouldReplan(currentTime: number, state: SpacecraftTrajectoryState): boolean {
    // Time-based replanning
    const timeSinceLastPlan = currentTime - this.lastPlanTime
    if (timeSinceLastPlan > (1000 / this.config.replanFrequency)) {
      return true
    }

    // State-based replanning triggers
    if (this.currentState) {
      const positionDelta = Vector3Math.distance(state.position, this.currentState.position)
      const velocityDelta = Vector3Math.distance(state.velocity, this.currentState.velocity)

      // Replan if significant state change
      if (positionDelta > 1000 || velocityDelta > 100) { // 1km position or 100m/s velocity change
        return true
      }
    }

    return false
  }

  private buildStateSpaceGraph(state: SpacecraftTrajectoryState) {
    // State space discretization based on current mission phase
    const nodeCount = this.getNodeCount()
    const nodes: Array<{ id: number; state: Vector3; cost: number }> = []
    const edges: Array<{ from: number; to: number; weight: number }> = []

    // Current state as source node
    nodes.push({ id: 0, state: state.position, cost: 0 })

    // Generate reachable states based on dynamics
    for (let i = 1; i < nodeCount; i++) {
      const reachableState = this.generateReachableState(state, i)
      nodes.push({ id: i, state: reachableState.position, cost: reachableState.cost })
    }

    // Build edges representing possible maneuvers
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (this.isManeuverFeasible(nodes[i], nodes[j], state)) {
          const weight = this.calculateManeuverCost(nodes[i], nodes[j], state)
          edges.push({ from: i, to: j, weight })

          // Add reverse edge if bidirectional maneuver possible
          if (this.isBidirectionalManeuver(nodes[i], nodes[j])) {
            edges.push({ from: j, to: i, weight: weight * 1.1 })
          }
        }
      }
    }

    return { nodes, edges }
  }

  private getNodeCount(): number {
    switch (this.config.graphDensity) {
      case 'sparse': return 100
      case 'medium': return 500
      case 'dense': return 1000
      default: return 500
    }
  }

  private generateReachableState(state: SpacecraftTrajectoryState, index: number) {
    // Simplified reachable state generation
    const deltaV = 500 * Math.random() // Random delta-V up to 500 m/s
    const direction = Vector3Math.normalize({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1
    })

    const deltaVVector = Vector3Math.scale(direction, deltaV)
    const newVelocity = Vector3Math.add(state.velocity, deltaVVector)

    // Propagate forward in time (simplified)
    const timeStep = 60 // 1 minute propagation
    const newPosition = Vector3Math.add(
      state.position,
      Vector3Math.scale(newVelocity, timeStep)
    )

    return {
      position: newPosition,
      cost: this.calculateStateCost(newPosition, newVelocity, state)
    }
  }

  private calculateStateCost(position: Vector3, velocity: Vector3, state: SpacecraftTrajectoryState): number {
    // Multi-objective cost: fuel, time, risk
    const distanceToTarget = Vector3Math.distance(position, this.getTargetPosition(state))
    const velocityMagnitude = Vector3Math.magnitude(velocity)

    return distanceToTarget * 0.001 + velocityMagnitude * 0.01 + Math.random() * 10
  }

  private isManeuverFeasible(
    from: { state: Vector3; cost: number },
    to: { state: Vector3; cost: number },
    state: SpacecraftTrajectoryState
  ): boolean {
    const distance = Vector3Math.distance(from.state, to.state)
    const maxManeuverDistance = state.constraints.maxThrust * 3600 // 1 hour burn

    return distance < maxManeuverDistance && Math.random() > 0.3 // Sparse connectivity
  }

  private calculateManeuverCost(
    from: { state: Vector3; cost: number },
    to: { state: Vector3; cost: number },
    state: SpacecraftTrajectoryState
  ): number {
    const distance = Vector3Math.distance(from.state, to.state)
    const fuelCost = distance / (state.constraints.maxThrust * 100) // Simplified ISP
    const timeCost = distance / Vector3Math.magnitude(state.velocity)

    return fuelCost + timeCost * 0.1
  }

  private isBidirectionalManeuver(
    from: { state: Vector3; cost: number },
    to: { state: Vector3; cost: number }
  ): boolean {
    // Most orbital maneuvers are not easily reversible
    return Math.random() > 0.7
  }

  private getTargetPosition(state: SpacecraftTrajectoryState): Vector3 {
    if (state.targetOrbit) {
      // Calculate target orbital position
      const earthRadius = 6371000 // meters
      const targetRadius = earthRadius + state.targetOrbit.altitude

      return {
        x: targetRadius * Math.cos(state.targetOrbit.inclination),
        y: targetRadius * Math.sin(state.targetOrbit.inclination),
        z: 0
      }
    }

    // Default target (LEO)
    return { x: 7000000, y: 0, z: 0 }
  }

  private convertToTrajectoryPoints(
    path: number[],
    state: SpacecraftTrajectoryState
  ): TrajectoryOptimizationResult['trajectory'] {
    // Convert path node indices to actual trajectory points
    return path.map((nodeId, index) => ({
      position: this.getNodePosition(nodeId, state),
      velocity: this.getNodeVelocity(nodeId, state),
      acceleration: this.getNodeAcceleration(nodeId, state),
      time: index * 60 // 1 minute per node
    }))
  }

  private getNodePosition(nodeId: number, state: SpacecraftTrajectoryState): Vector3 {
    // Simplified: interpolate between current and target
    const t = nodeId / 100
    const target = this.getTargetPosition(state)

    return {
      x: state.position.x + (target.x - state.position.x) * t,
      y: state.position.y + (target.y - state.position.y) * t,
      z: state.position.z + (target.z - state.position.z) * t
    }
  }

  private getNodeVelocity(nodeId: number, state: SpacecraftTrajectoryState): Vector3 {
    // Simplified velocity profile
    return Vector3Math.scale(state.velocity, 1 + nodeId * 0.01)
  }

  private getNodeAcceleration(nodeId: number, state: SpacecraftTrajectoryState): Vector3 {
    // Simplified acceleration profile
    return {
      x: state.constraints.maxAcceleration * (nodeId % 2 === 0 ? 1 : -1),
      y: 0,
      z: 0
    }
  }

  private estimateSpeedupFactor(stats: { nodesVisited: number; edgesRelaxed: number }): number {
    // Estimate speedup based on graph exploration efficiency
    const efficiency = 1 / (1 + stats.nodesVisited / 1000 + stats.edgesRelaxed / 5000)
    return 1 + efficiency * 3 // 1x to 4x speedup range
  }

  private calculateFuelEfficiency(path: number[], state: SpacecraftTrajectoryState): number {
    // Simplified fuel efficiency calculation
    const pathLength = path.length
    const optimalLength = Vector3Math.distance(state.position, this.getTargetPosition(state)) / 1000

    return Math.max(0, 1 - (pathLength - optimalLength) / optimalLength)
  }

  private getReplanReason(state: SpacecraftTrajectoryState): TrajectoryOptimizationResult['replanReason'] {
    // Determine why replanning was triggered
    if (state.constraints.fuelRemaining < 0.2) return 'performance'
    if (state.phase !== this.currentState?.phase) return 'target_change'
    return 'schedule'
  }

  private getReplanReasonCounts() {
    const counts = { disturbance: 0, target_change: 0, performance: 0, schedule: 0 }

    for (const result of this.planningHistory) {
      if (result.replanReason) {
        counts[result.replanReason]++
      }
    }

    return counts
  }
}

/**
 * Factory function to create enhanced trajectory optimizer with sensible defaults
 */
export function createEnhancedTrajectoryOptimizer(
  config?: Partial<TrajectoryOptimizationConfig>
): EnhancedTrajectoryOptimizer {
  return new EnhancedTrajectoryOptimizer(config)
}

/**
 * Utility function to validate trajectory optimization results
 */
export function validateTrajectoryResult(
  result: TrajectoryOptimizationResult,
  state: SpacecraftTrajectoryState
): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (!result.success) {
    issues.push('Planning failed')
  }

  if (result.trajectory.length === 0) {
    issues.push('Empty trajectory')
  }

  if (result.performance.planningTimeMs > 100) {
    issues.push('Planning time exceeded real-time constraints')
  }

  if (result.performance.fuelEfficiency < 0.5) {
    issues.push('Poor fuel efficiency')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}
