/**
 * ID: GNC-ORBIT-001
 * Requirement: Propagate a 6-DOF state vector (position + velocity) forward in
 *   time under two-body gravity using a first-order Euler integrator.
 * Purpose: Provide the minimum-viable orbit propagator needed by the GNC
 *   guidance and navigation subsystems while the Rust/WASM RK4 integrator
 *   is under development.
 * Rationale: Euler integration is O(dt) accurate; acceptable for dt ≤ 1 s at
 *   LEO altitudes where higher-order terms are small per orbit revolution.
 *   The function is typed to match the future Rust WASM replacement interface
 *   so the swap is a single import change.
 * Inputs:
 *   state0.r  – position  [m, m, m], magnitude > 0 (avoid singularity at origin)
 *   state0.v  – velocity  [m/s × 3]
 *   dt        – time step [s], any finite real; negative dt propagates backward
 *   mu        – gravitational parameter [m³/s²], must be > 0
 * Outputs: State6 { r: Vec3, v: Vec3 } at time t₀ + dt
 * Preconditions: |r| > 0; mu > 0; dt is finite.
 * Postconditions: |r_new| is finite; returned state satisfies Euler step equations.
 * Failure Modes: |r| → 0 causes division by r³ → ∞ (Nan/Inf propagation).
 *   Caller must ensure vehicle is not at Earth centre.
 * Constraints: Euler error grows as O(dt); for dt > 60 s accuracy degrades.
 *   Replace with RK4 + J2 perturbations before flight-software use.
 * Verification: physics.spec.ts TEST-PHYS-TWOBODY-* (5 test cases).
 * References: Vallado § 2.3 "Kepler's Equation"; Bate, Mueller & White
 *   "Fundamentals of Astrodynamics" ch. 2; NASA-STD-7009A appendix B.
 */
export type Vec3 = [number, number, number]

export interface State6 {
  r: Vec3
  v: Vec3
}

export function keplerianPropagateTwoBody(state0: State6, dt: number, mu: number): State6 {
  // Simple Euler as placeholder; will be replaced by Rust WASM integrator
  const r: Vec3 = [
    state0.r[0] + state0.v[0] * dt,
    state0.r[1] + state0.v[1] * dt,
    state0.r[2] + state0.v[2] * dt,
  ]
  const rnorm = Math.hypot(r[0], r[1], r[2])
  const accel = (-mu) / (rnorm * rnorm * rnorm)
  const v: Vec3 = [
    state0.v[0] + accel * r[0] * dt,
    state0.v[1] + accel * r[1] * dt,
    state0.v[2] + accel * r[2] * dt,
  ]
  return { r, v }
}
