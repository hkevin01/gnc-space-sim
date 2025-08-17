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
