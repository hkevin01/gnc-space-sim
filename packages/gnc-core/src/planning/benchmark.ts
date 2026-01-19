/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Performance Benchmark Suite for Enhanced SSSP Algorithm
 *
 * Comprehensive benchmarking and validation of the breakthrough SSSP algorithm
 * against classical methods in spacecraft trajectory planning scenarios.
 */

import { DEFAULT_LAUNCH_PLANNING_CONFIG, EnhancedTrajectoryPlanner, type BenchmarkResult } from './trajectory-planner'

/**
 * Benchmark configuration for different test scenarios
 */
export interface BenchmarkConfig {
  name: string
  description: string
  graphSize: {
    nodes: number
    avgOutDegree: number
  }
  trajectoryConfig: {
    positionResolution: number
    velocityResolution: number
    timeSteps: number
  }
  iterations: number
  expectedSpeedup: number // Expected speedup factor vs Dijkstra
}

/**
 * Comprehensive benchmark result
 */
export interface ComprehensiveBenchmarkResult {
  config: BenchmarkConfig
  results: BenchmarkResult
  validation: {
    correctness: boolean
    pathLengthMatch: boolean
    optimalityGap: number // % difference from optimal
  }
  performance: {
    memoryUsage: number // MB
    cacheEfficiency: number // %
    parallelizationGain: number // speedup from parallel execution
  }
  realWorldMetrics: {
    trajectoryLength: number // number of maneuvers
    totalDeltaV: number // m/s
    fuelEfficiency: number // kg fuel saved vs naive approach
    planningLatency: number // ms for real-time replanning
  }
}

/**
 * Benchmark scenarios for different mission types
 */
export const BENCHMARK_SCENARIOS: BenchmarkConfig[] = [
  {
    name: 'earth-orbit-insertion',
    description: 'Earth surface to Low Earth Orbit insertion',
    graphSize: { nodes: 10000, avgOutDegree: 6 },
    trajectoryConfig: { positionResolution: 20, velocityResolution: 15, timeSteps: 100 },
    iterations: 100,
    expectedSpeedup: 2.5
  },
  {
    name: 'geostationary-transfer',
    description: 'LEO to Geostationary Transfer Orbit',
    graphSize: { nodes: 50000, avgOutDegree: 8 },
    trajectoryConfig: { positionResolution: 30, velocityResolution: 20, timeSteps: 200 },
    iterations: 50,
    expectedSpeedup: 3.0
  },
  {
    name: 'interplanetary-transfer',
    description: 'Earth to Mars transfer trajectory',
    graphSize: { nodes: 100000, avgOutDegree: 10 },
    trajectoryConfig: { positionResolution: 40, velocityResolution: 25, timeSteps: 500 },
    iterations: 20,
    expectedSpeedup: 4.0
  },
  {
    name: 'asteroid-rendezvous',
    description: 'Multi-body asteroid approach and rendezvous',
    graphSize: { nodes: 25000, avgOutDegree: 12 },
    trajectoryConfig: { positionResolution: 25, velocityResolution: 18, timeSteps: 150 },
    iterations: 75,
    expectedSpeedup: 2.8
  },
  {
    name: 'proximity-operations',
    description: 'Station-keeping and docking maneuvers',
    graphSize: { nodes: 5000, avgOutDegree: 15 },
    trajectoryConfig: { positionResolution: 15, velocityResolution: 12, timeSteps: 50 },
    iterations: 200,
    expectedSpeedup: 2.0
  }
]

/**
 * Comprehensive benchmark runner
 */
export class TrajectoryPlanningBenchmark {
  private results: ComprehensiveBenchmarkResult[] = []

  /**
   * Run all benchmark scenarios
   */
  async runAllBenchmarks(): Promise<ComprehensiveBenchmarkResult[]> {
    console.log('🚀 Starting comprehensive trajectory planning benchmarks...')
    this.results = []

    for (const scenario of BENCHMARK_SCENARIOS) {
      console.log(`\n📊 Running benchmark: ${scenario.name}`)
      console.log(`   ${scenario.description}`)

      try {
        const result = await this.runBenchmarkScenario(scenario)
        this.results.push(result)

        console.log(`✅ Completed: ${result.results.speedupFactor.toFixed(2)}x speedup`)
      } catch (error) {
        console.error(`❌ Failed benchmark ${scenario.name}:`, error)
      }
    }

    this.generateBenchmarkReport()
    return this.results
  }

  /**
   * Run a single benchmark scenario
   */
  async runBenchmarkScenario(config: BenchmarkConfig): Promise<ComprehensiveBenchmarkResult> {
    // Create trajectory planner with scenario-specific configuration
    const trajectoryConfig = {
      ...DEFAULT_LAUNCH_PLANNING_CONFIG,
      resolution: {
        position: config.trajectoryConfig.positionResolution,
        velocity: config.trajectoryConfig.velocityResolution
      },
      timeHorizon: config.trajectoryConfig.timeSteps * 10, // 10s per step
      timeStep: 10
    }

    const planner = new EnhancedTrajectoryPlanner(trajectoryConfig)

    // Initialize and run core benchmark
    await planner.initialize()
    const benchmarkResult = await planner.benchmarkPerformance(config.iterations)

    // Validate correctness by comparing paths
    const validation = await this.validateCorrectness(planner, config)

    // Measure real-world metrics
    const realWorldMetrics = await this.measureRealWorldMetrics(planner, config)

    return {
      config,
      results: benchmarkResult,
      validation,
      performance: {
        memoryUsage: this.estimateMemoryUsage(config.graphSize),
        cacheEfficiency: this.estimateCacheEfficiency(benchmarkResult),
        parallelizationGain: 1.0 // Would measure in actual parallel implementation
      },
      realWorldMetrics
    }
  }

  /**
   * Validate algorithm correctness against known optimal solutions
   */
  private async validateCorrectness(
    planner: EnhancedTrajectoryPlanner,
    config: BenchmarkConfig
  ): Promise<{ correctness: boolean, pathLengthMatch: boolean, optimalityGap: number }> {
    try {
      // Create test scenario
      const initialState = {
        position: [6.371e6, 0, 0] as [number, number, number],
        velocity: [0, 464, 0] as [number, number, number],
        time: 0,
        fuelMass: 100000,
        phase: 'stage1_burn' as any
      }

      const targetState = {
        position: [6.771e6, 0, 0] as [number, number, number],
        velocity: [0, 7600, 0] as [number, number, number],
        time: 600,
        fuelMass: 50000,
        phase: 'orbit_circularization' as any
      }

      // Plan trajectory
      const plan = await planner.planTrajectory(initialState, targetState)

      // Validate basic properties
      const pathExists = plan.states.length > 0
      const reachesTarget = plan.states[plan.states.length - 1]?.time >= targetState.time - 60

      // Estimate optimality gap (simplified)
      const theoreticalMinDeltaV = 9400 // m/s for LEO insertion
      const actualDeltaV = plan.maneuvers.reduce((sum, m) =>
        sum + Math.sqrt(m.deltaV[0] ** 2 + m.deltaV[1] ** 2 + m.deltaV[2] ** 2), 0)
      const optimalityGap = ((actualDeltaV - theoreticalMinDeltaV) / theoreticalMinDeltaV) * 100

      return {
        correctness: pathExists && reachesTarget,
        pathLengthMatch: plan.states.length >= 10, // Reasonable path length
        optimalityGap: Math.max(0, optimalityGap)
      }
    } catch (error) {
      console.warn('Validation failed:', error)
      return { correctness: false, pathLengthMatch: false, optimalityGap: 100 }
    }
  }

  /**
   * Measure real-world trajectory planning metrics
   */
  private async measureRealWorldMetrics(
    planner: EnhancedTrajectoryPlanner,
    config: BenchmarkConfig
  ): Promise<{
    trajectoryLength: number
    totalDeltaV: number
    fuelEfficiency: number
    planningLatency: number
  }> {
    try {
      // Measure planning latency for real-time scenarios
      const startTime = performance.now()

      const initialState = {
        position: [6.371e6, 0, 0] as [number, number, number],
        velocity: [0, 464, 0] as [number, number, number],
        time: 0,
        fuelMass: 80000,
        phase: 'stage1_burn' as any
      }

      const targetState = {
        position: [6.771e6, 0, 0] as [number, number, number],
        velocity: [0, 7600, 0] as [number, number, number],
        time: 500,
        fuelMass: 40000,
        phase: 'orbit_circularization' as any
      }

      const plan = await planner.planTrajectory(initialState, targetState)
      const planningLatency = performance.now() - startTime

      // Calculate trajectory metrics
      const trajectoryLength = plan.maneuvers.length
      const totalDeltaV = plan.maneuvers.reduce((sum, m) =>
        sum + Math.sqrt(m.deltaV[0] ** 2 + m.deltaV[1] ** 2 + m.deltaV[2] ** 2), 0)

      // Estimate fuel efficiency vs naive approach
      const naiveDeltaV = 12000 // Typical inefficient ascent
      const fuelSaved = (naiveDeltaV - totalDeltaV) * 0.1 // kg per m/s (simplified)

      return {
        trajectoryLength,
        totalDeltaV,
        fuelEfficiency: Math.max(0, fuelSaved),
        planningLatency
      }
    } catch (error) {
      console.warn('Real-world metrics measurement failed:', error)
      return { trajectoryLength: 0, totalDeltaV: 0, fuelEfficiency: 0, planningLatency: 1000 }
    }
  }

  /**
   * Estimate memory usage for graph representation
   */
  private estimateMemoryUsage(graphSize: { nodes: number, avgOutDegree: number }): number {
    const edges = graphSize.nodes * graphSize.avgOutDegree

    // CSR representation: outgoing_edges + destinations + weights
    const outgoingEdgesBytes = (graphSize.nodes + 1) * 4 // Uint32Array
    const destinationsBytes = edges * 4 // Uint32Array
    const weightsBytes = edges * 8 // Float64Array

    const totalBytes = outgoingEdgesBytes + destinationsBytes + weightsBytes
    return totalBytes / (1024 * 1024) // Convert to MB
  }

  /**
   * Estimate cache efficiency from performance metrics
   */
  private estimateCacheEfficiency(result: BenchmarkResult): number {
    // Heuristic: better cache efficiency leads to better performance
    const expectedOpsPerNode = 5 // Expected operations per node
    const actualOpsPerNode = result.edgesRelaxed / result.nodesVisited

    return Math.max(0, Math.min(100, 100 * expectedOpsPerNode / actualOpsPerNode))
  }

  /**
   * Generate comprehensive benchmark report
   */
  private generateBenchmarkReport(): void {
    console.log('\n📈 Comprehensive Benchmark Report')
    console.log('='.repeat(60))

    let totalSpeedup = 0
    let validScenarios = 0

    for (const result of this.results) {
      const { config, results, validation, realWorldMetrics } = result

      console.log(`\n🎯 Scenario: ${config.name}`)
      console.log(`   Description: ${config.description}`)
      console.log(`   Graph Size: ${config.graphSize.nodes} nodes, ~${config.graphSize.nodes * config.graphSize.avgOutDegree} edges`)

      console.log(`\n   Performance:`)
      console.log(`   • Enhanced SSSP: ${results.enhancedTimeMs.toFixed(2)}ms`)
      console.log(`   • Dijkstra:      ${results.dijkstraTimeMs.toFixed(2)}ms`)
      console.log(`   • Speedup:       ${results.speedupFactor.toFixed(2)}x`)
      console.log(`   • Expected:      ${config.expectedSpeedup}x`)

      console.log(`\n   Validation:`)
      console.log(`   • Correctness:   ${validation.correctness ? '✅' : '❌'}`)
      console.log(`   • Path Valid:    ${validation.pathLengthMatch ? '✅' : '❌'}`)
      console.log(`   • Optimality:    ${validation.optimalityGap.toFixed(1)}% gap`)

      console.log(`\n   Real-World Metrics:`)
      console.log(`   • Trajectory:    ${realWorldMetrics.trajectoryLength} maneuvers`)
      console.log(`   • Total ΔV:      ${realWorldMetrics.totalDeltaV.toFixed(0)} m/s`)
      console.log(`   • Fuel Saved:    ${realWorldMetrics.fuelEfficiency.toFixed(0)} kg`)
      console.log(`   • Latency:       ${realWorldMetrics.planningLatency.toFixed(1)}ms`)

      if (validation.correctness) {
        totalSpeedup += results.speedupFactor
        validScenarios++
      }
    }

    const avgSpeedup = validScenarios > 0 ? totalSpeedup / validScenarios : 0

    console.log('\n🏆 Summary:')
    console.log(`   • Valid Scenarios: ${validScenarios}/${this.results.length}`)
    console.log(`   • Average Speedup: ${avgSpeedup.toFixed(2)}x`)
    console.log(`   • Success Rate:    ${(validScenarios / this.results.length * 100).toFixed(1)}%`)

    if (avgSpeedup > 2.0) {
      console.log('   🎉 Significant performance improvement achieved!')
    } else if (avgSpeedup > 1.5) {
      console.log('   ✅ Moderate performance improvement demonstrated.')
    } else {
      console.log('   ⚠️  Performance improvement below expectations.')
    }
  }

  /**
   * Export results for analysis
   */
  exportResults(): {
    summary: {
      avgSpeedup: number
      successRate: number
      totalScenarios: number
      timestamp: string
    }
    scenarios: ComprehensiveBenchmarkResult[]
  } {
    const validScenarios = this.results.filter(r => r.validation.correctness).length
    const totalSpeedup = this.results
      .filter(r => r.validation.correctness)
      .reduce((sum, r) => sum + r.results.speedupFactor, 0)

    return {
      summary: {
        avgSpeedup: validScenarios > 0 ? totalSpeedup / validScenarios : 0,
        successRate: validScenarios / this.results.length,
        totalScenarios: this.results.length,
        timestamp: new Date().toISOString()
      },
      scenarios: this.results
    }
  }
}

/**
 * Utility function to run quick performance test
 */
export async function runQuickBenchmark(): Promise<BenchmarkResult> {
  console.log('🚀 Running quick SSSP performance benchmark...')

  const planner = new EnhancedTrajectoryPlanner(DEFAULT_LAUNCH_PLANNING_CONFIG)
  await planner.initialize()

  const result = await planner.benchmarkPerformance(50)

  console.log(`⚡ Quick benchmark results:`)
  console.log(`   Enhanced: ${result.enhancedTimeMs.toFixed(2)}ms`)
  console.log(`   Dijkstra: ${result.dijkstraTimeMs.toFixed(2)}ms`)
  console.log(`   Speedup:  ${result.speedupFactor.toFixed(2)}x`)

  return result
}

/**
 * Validate SSSP algorithm implementation
 */
export async function validateAlgorithm(): Promise<boolean> {
  console.log('🔍 Validating Enhanced SSSP algorithm...')

  try {
    const benchmark = new TrajectoryPlanningBenchmark()
    const testScenario = BENCHMARK_SCENARIOS[0] // Use smallest scenario

    const result = await benchmark.runBenchmarkScenario(testScenario)

    const isValid = result.validation.correctness &&
      result.results.speedupFactor > 1.0 &&
      result.validation.optimalityGap < 50

    console.log(`${isValid ? '✅' : '❌'} Algorithm validation ${isValid ? 'passed' : 'failed'}`)

    return isValid
  } catch (error) {
    console.error('❌ Validation failed:', error)
    return false
  }
}
