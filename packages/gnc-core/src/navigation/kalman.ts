/**
 * KalmanFilter3D: Linear KF for 3D position-velocity state with constant-acceleration model.
 * State x = [rx, ry, rz, vx, vy, vz]^T
 * Discrete-time model with dt:
 *   x_k+1 = A(dt) x_k + w,   z_k = H x_k + v
 * where A(dt) = [[I, dt I],[0, I]] and H = I (measure pos and vel directly)
 */
export type Vec6 = [number, number, number, number, number, number]

export interface KFNoiseOptions {
  processPosStd?: number // m
  processVelStd?: number // m/s
  measPosStd?: number    // m
  measVelStd?: number    // m/s
}

export class KalmanFilter3D {
  // State and covariance
  x: Vec6
  P: number[][] // 6x6

  // Measurement matrix (identity by default) and noise matrices
  private H: number[][] // 6x6
  private Q_base: number[][] // scaled per dt
  private R: number[][] // 6x6

  constructor(initial: { r: [number, number, number]; v: [number, number, number] },
              covariances?: { posVar?: number; velVar?: number },
              noise?: KFNoiseOptions) {
    const { r, v } = initial
    this.x = [r[0], r[1], r[2], v[0], v[1], v[2]]
    const posVar = covariances?.posVar ?? 1e2
    const velVar = covariances?.velVar ?? 1.0
    this.P = diag([posVar, posVar, posVar, velVar, velVar, velVar])

    // Identity H (measure all states directly)
    this.H = identity(6)

    const procPosStd = noise?.processPosStd ?? 0.5
    const procVelStd = noise?.processVelStd ?? 0.1
    this.Q_base = diag([
      procPosStd ** 2, procPosStd ** 2, procPosStd ** 2,
      procVelStd ** 2, procVelStd ** 2, procVelStd ** 2
    ])

    const measPosStd = noise?.measPosStd ?? 5.0
    const measVelStd = noise?.measVelStd ?? 0.5
    this.R = diag([
      measPosStd ** 2, measPosStd ** 2, measPosStd ** 2,
      measVelStd ** 2, measVelStd ** 2, measVelStd ** 2
    ])
  }

  /** Predict step using constant-acceleration model with zero control (accel folded into process noise). */
  predict(dt: number) {
    const A = makeA(dt)
    this.x = matVec6(A, this.x)
    // P = A P A^T + Q(dt)
    const AP = matMul(A, this.P)
    const APAT = matMul(AP, transpose(A))
    const Qdt = scaleQ(this.Q_base, dt)
    this.P = add(APAT, Qdt)
  }

  /** Update step with measurement z = [rx, ry, rz, vx, vy, vz] */
  update(z: Vec6) {
    const H = this.H
    const y = subVec(z, matVec(H, this.x)) // innovation
    const S = add(matMul(matMul(H, this.P), transpose(H)), this.R)
    const K = matMul(matMul(this.P, transpose(H)), inv6(S))
    // x = x + K y
  this.x = addVec6(this.x, matVec6(K, y as unknown as Vec6))
    // P = (I - K H) P
    const I = identity(6)
    const KH = matMul(K, H)
    const IminusKH = sub(I, KH)
    this.P = matMul(IminusKH, this.P)
  }
}

// ===== Helpers: small 6x6 linear algebra optimized for structure =====
function makeA(dt: number): number[][] {
  const I3 = identity(3)
  const Z3 = zeros(3)
  const dtI = scale(I3, dt)
  // [[I, dtI],[0, I]]
  return block([[I3, dtI],[Z3, I3]])
}

function scaleQ(Qbase: number[][], dt: number): number[][] {
  // Scale process noise approximately with dt
  return scale(Qbase, Math.max(dt, 1e-6))
}

function identity(n: number): number[][] { return diag(Array(n).fill(1)) }
function zeros(n: number): number[][] { return Array.from({ length: n }, () => Array(n).fill(0)) }
function diag(vals: number[]): number[][] { return vals.map((v, i) => vals.map((_, j) => (i === j ? v : 0))) }
function scale(M: number[][], s: number): number[][] { return M.map(row => row.map(x => x * s)) }
function add(A: number[][], B: number[][]): number[][] { return A.map((r, i) => r.map((v, j) => v + B[i][j])) }
function sub(A: number[][], B: number[][]): number[][] { return A.map((r, i) => r.map((v, j) => v - B[i][j])) }
function block(parts: [number[][], number[][]][]): number[][] {
  const top = concatCols(parts[0][0], parts[0][1])
  const bottom = concatCols(parts[1][0], parts[1][1])
  return top.concat(bottom)
}
function concatCols(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.concat(B[i]))
}
function transpose(A: number[][]): number[][] { return A[0].map((_, j) => A.map(row => row[j])) }
function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length, m = B[0].length, k = B.length
  const out = Array.from({ length: n }, () => Array(m).fill(0))
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < k; t++) {
      const a = A[i][t]
      if (a === 0) continue
      for (let j = 0; j < m; j++) out[i][j] += a * B[t][j]
    }
  }
  return out
}
function matVec(A: number[][], x: number[]): number[] {
  const n = A.length, m = x.length
  const out = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = 0; j < m; j++) s += A[i][j] * x[j]
    out[i] = s
  }
  return out
}
function matVec6(A: number[][], x: Vec6): Vec6 {
  const y = matVec(A, x)
  return [y[0], y[1], y[2], y[3], y[4], y[5]]
}
function addVec6(a: Vec6, b: Vec6): Vec6 { return [a[0]+b[0], a[1]+b[1], a[2]+b[2], a[3]+b[3], a[4]+b[4], a[5]+b[5]] }
function subVec(a: number[], b: number[]): number[] { return a.map((v, i) => v - b[i]) }

// Invert a symmetric positive-definite 6x6 by Gaussian elimination (simple, not optimized).
// For stability in production, consider a proper linear algebra library or Cholesky.
function inv6(Ain: number[][]): number[][] {
  const n = 6
  const A = Ain.map(r => r.slice())
  const I = identity(n)
  for (let i = 0; i < n; i++) {
    // Pivot
    let pivot = A[i][i]
    if (Math.abs(pivot) < 1e-12) {
      // Find a row to swap
      for (let r = i + 1; r < n; r++) {
        if (Math.abs(A[r][i]) > Math.abs(pivot)) { pivot = A[r][i]; swapRows(A, i, r); swapRows(I, i, r); break }
      }
    }
    const invPivot = 1 / (A[i][i] || 1e-12)
    // Normalize row i
    for (let j = 0; j < n; j++) { A[i][j] *= invPivot; I[i][j] *= invPivot }
    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r === i) continue
      const f = A[r][i]
      if (f === 0) continue
      for (let c = 0; c < n; c++) { A[r][c] -= f * A[i][c]; I[r][c] -= f * I[i][c] }
    }
  }
  return I
}
function swapRows(M: number[][], i: number, j: number) { if (i !== j) { const t = M[i]; M[i] = M[j]; M[j] = t } }
