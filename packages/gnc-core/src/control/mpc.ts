/** Minimal MPC interfaces and a simple placeholder solver.
 * This defines the contract for plugging in a real QP solver later (e.g., OSQP via WASM).
 */
export interface MPCModel {
  // Discrete linear model x_{k+1} = A x_k + B u_k
  A: number[][]
  B: number[][]
  // Cost matrices for stage cost: x'Qx + u'Ru
  Q: number[][]
  R: number[][]
  // Constraints: u_min <= u <= u_max
  uMin?: number[]
  uMax?: number[]
}

export interface MPCProblem {
  model: MPCModel
  horizon: number // N
  x0: number[]
  xRef?: number[] // reference state
  uRef?: number[] // reference control
}

export interface MPCSolution {
  u0: number[]
  cost: number
  status: 'OK' | 'INFEASIBLE' | 'ERROR'
}

/**
 * solveMPC: Placeholder receding horizon controller using greedy LQR-like step.
 * This is NOT a true MPC QP solve; it approximates a single control step via u = -K (x - xRef).
 */
export function solveMPC(problem: MPCProblem): MPCSolution {
  const { model, x0, xRef } = problem
  const nx = model.A.length
  const nu = model.B[0].length
  const ref = xRef ?? Array(nx).fill(0)
  const err = x0.map((v, i) => v - ref[i])
  // Heuristic gain from diagonal of R (larger R -> smaller control)
  const rdiag = Array(nu).fill(1).map((_, i) => model.R[i]?.[i] ?? 1)
  const gain = rdiag.map(v => 1 / Math.max(v, 1e-3))
  const u = Array(nu).fill(0).map((_, i) => -gain[i] * clamp(err[i] ?? 0, -10, 10))
  // Apply bounds
  const bounded = u.map((ui, i) => clamp(ui, model.uMin?.[i] ?? -Infinity, model.uMax?.[i] ?? Infinity))
  return { u0: bounded, cost: quadraticCost(err, bounded, model.Q, model.R), status: 'OK' }
}

function clamp(x: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, x)) }
function quadraticCost(x: number[], u: number[], Q: number[][], R: number[][]) {
  const xQx = x.reduce((s, xi, i) => s + xi * (Q[i]?.[i] ?? 0) * xi, 0)
  const uRu = u.reduce((s, ui, i) => s + ui * (R[i]?.[i] ?? 0) * ui, 0)
  return xQx + uRu
}
