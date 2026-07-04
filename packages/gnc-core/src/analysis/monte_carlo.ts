/**
 * ID: GNC-ANALYSIS-001
 * Requirement: Provide deterministic Monte Carlo dispersion utilities for mission
 *   robustness studies using seeded random sampling.
 * Purpose: Quantify sensitivity and uncertainty envelopes reproducibly so that
 *   test runs and CI comparisons remain deterministic.
 * Rationale: Seeded pseudo-random generation allows exact replay of dispersion
 *   runs, which is essential for regression testing and performance tuning.
 */

export interface SeededRandom {
  next(): number // uniform in [0, 1)
  normal(mean?: number, std?: number): number
}

export interface MonteCarloConfig<TInput, TOutput> {
  iterations: number
  seed: number
  sample: (rng: SeededRandom, index: number) => TInput
  evaluate: (input: TInput, index: number) => TOutput
  metric?: (output: TOutput, index: number) => number
}

export interface MonteCarloResult<TInput, TOutput> {
  seed: number
  iterations: number
  inputs: TInput[]
  outputs: TOutput[]
  metrics?: number[]
  summary?: DispersionSummary
}

export interface DispersionSummary {
  mean: number
  std: number
  min: number
  max: number
  p05: number
  p50: number
  p95: number
}

class XorShift32 implements SeededRandom {
  private state: number

  constructor(seed: number) {
    const s = seed >>> 0
    this.state = s === 0 ? 0x9e3779b9 : s
  }

  next(): number {
    let x = this.state
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.state = x >>> 0
    return (this.state >>> 0) / 4294967296
  }

  normal(mean = 0, std = 1): number {
    const u1 = Math.max(this.next(), 1e-12)
    const u2 = this.next()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + z * std
  }
}

export function createSeededRandom(seed: number): SeededRandom {
  return new XorShift32(seed)
}

export function summarize(values: number[]): DispersionSummary {
  if (values.length === 0) {
    throw new Error('summarize requires at least one value')
  }

  const sorted = values.slice().sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((s, v) => s + v, 0) / n
  const variance = sorted.reduce((s, v) => s + (v - mean) * (v - mean), 0) / n

  const pick = (p: number): number => {
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))))
    return sorted[idx]
  }

  return {
    mean,
    std: Math.sqrt(Math.max(variance, 0)),
    min: sorted[0],
    max: sorted[n - 1],
    p05: pick(0.05),
    p50: pick(0.5),
    p95: pick(0.95),
  }
}

export function runMonteCarlo<TInput, TOutput>(config: MonteCarloConfig<TInput, TOutput>): MonteCarloResult<TInput, TOutput> {
  if (!Number.isInteger(config.iterations) || config.iterations <= 0) {
    throw new Error('iterations must be a positive integer')
  }

  const rng = createSeededRandom(config.seed)
  const inputs: TInput[] = []
  const outputs: TOutput[] = []
  const metrics: number[] | undefined = config.metric ? [] : undefined

  for (let i = 0; i < config.iterations; i++) {
    const input = config.sample(rng, i)
    const output = config.evaluate(input, i)

    inputs.push(input)
    outputs.push(output)

    if (metrics) {
      metrics.push(config.metric!(output, i))
    }
  }

  return {
    seed: config.seed,
    iterations: config.iterations,
    inputs,
    outputs,
    metrics,
    summary: metrics ? summarize(metrics) : undefined,
  }
}

export function runScalarDispersion(config: {
  iterations: number
  seed: number
  sample: (rng: SeededRandom, index: number) => number
}): DispersionSummary {
  const out = runMonteCarlo<number, number>({
    iterations: config.iterations,
    seed: config.seed,
    sample: config.sample,
    evaluate: (x) => x,
    metric: (x) => x,
  })
  return out.summary as DispersionSummary
}
