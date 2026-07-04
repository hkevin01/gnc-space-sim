/**
 * ID: GNC-NAV-003
 * Requirement: Implement a 15-state Extended Kalman Filter (EKF) for launch
 *   navigation using INS propagation and GPS position/velocity updates.
 * Purpose: Improve nonlinear navigation fidelity over the linear 6-state KF by
 *   estimating attitude and inertial sensor biases in addition to position and
 *   velocity.
 * Rationale: A 15-state INS/GPS EKF is a standard aerospace baseline that
 *   captures first-order inertial error dynamics without the complexity of
 *   full strapdown mechanization with Earth rotation terms.
 * State definition:
 *   x = [rx, ry, rz, vx, vy, vz, roll, pitch, yaw, bax, bay, baz, bgx, bgy, bgz]^T
 * Units:
 *   position [m], velocity [m/s], attitude [rad], accel bias [m/s^2], gyro bias [rad/s]
 * References:
 *   - Titterton & Weston, Strapdown Inertial Navigation Technology
 *   - Brown & Hwang, Introduction to Random Signals and Applied Kalman Filtering
 */

import { MU_EARTH } from '../math/constants'

export type Vec3 = [number, number, number]
export type Vec15 = [
  number, number, number,
  number, number, number,
  number, number, number,
  number, number, number,
  number, number, number
]

export interface IMUSample {
  specificForce: Vec3 // body frame [m/s^2]
  angularRate: Vec3   // body frame [rad/s]
  timestamp?: number
}

export interface GPSPVMeasurement {
  position: Vec3
  velocity: Vec3
  positionStd: number
  velocityStd: number
  available?: boolean
  timestamp?: number
}

export interface EKF15Options {
  mu?: number
  accelNoiseStd?: number
  gyroNoiseStd?: number
  accelBiasRwStd?: number
  gyroBiasRwStd?: number
}

export interface EKF15State {
  position: Vec3
  velocity: Vec3
  attitude: { roll: number; pitch: number; yaw: number }
  accelBias: Vec3
  gyroBias: Vec3
}

export class EKF15Navigation {
  private x: Vec15
  private P: number[][]
  private readonly mu: number

  private readonly accelNoiseStd: number
  private readonly gyroNoiseStd: number
  private readonly accelBiasRwStd: number
  private readonly gyroBiasRwStd: number

  constructor(initial: EKF15State, covDiag?: number[], options?: EKF15Options) {
    this.x = [
      initial.position[0], initial.position[1], initial.position[2],
      initial.velocity[0], initial.velocity[1], initial.velocity[2],
      initial.attitude.roll, initial.attitude.pitch, initial.attitude.yaw,
      initial.accelBias[0], initial.accelBias[1], initial.accelBias[2],
      initial.gyroBias[0], initial.gyroBias[1], initial.gyroBias[2]
    ]

    const d = covDiag ?? [
      100, 100, 100,
      1, 1, 1,
      1e-2, 1e-2, 1e-2,
      1e-2, 1e-2, 1e-2,
      1e-4, 1e-4, 1e-4
    ]
    this.P = diag(d)

    this.mu = options?.mu ?? MU_EARTH
    this.accelNoiseStd = options?.accelNoiseStd ?? 0.08
    this.gyroNoiseStd = options?.gyroNoiseStd ?? 0.002
    this.accelBiasRwStd = options?.accelBiasRwStd ?? 1e-4
    this.gyroBiasRwStd = options?.gyroBiasRwStd ?? 1e-5
  }

  /**
   * EKF prediction step with first-order INS mechanization.
   *
   * r_dot = v
   * v_dot = R_nb * (f_b - b_a) + g(r)
   * euler_dot = w_b - b_g
   * b_dot = 0 + random walk
   */
  predict(imu: IMUSample, dt: number): void {
    if (!(dt > 0) || !Number.isFinite(dt)) {
      throw new Error('EKF15 predict requires dt > 0')
    }

    const r: Vec3 = [this.x[0], this.x[1], this.x[2]]
    const v: Vec3 = [this.x[3], this.x[4], this.x[5]]
    const euler: Vec3 = [this.x[6], this.x[7], this.x[8]]
    const ba: Vec3 = [this.x[9], this.x[10], this.x[11]]
    const bg: Vec3 = [this.x[12], this.x[13], this.x[14]]

    const fBody: Vec3 = [
      imu.specificForce[0] - ba[0],
      imu.specificForce[1] - ba[1],
      imu.specificForce[2] - ba[2]
    ]
    const wBody: Vec3 = [
      imu.angularRate[0] - bg[0],
      imu.angularRate[1] - bg[1],
      imu.angularRate[2] - bg[2]
    ]

    const Rnb = rotationMatrixBodyToNav(euler[0], euler[1], euler[2])
    const fNav = matVec3(Rnb, fBody)
    const gNav = gravityTwoBody(r, this.mu)

    const aNav: Vec3 = [fNav[0] + gNav[0], fNav[1] + gNav[1], fNav[2] + gNav[2]]

    // State integration (forward Euler, deterministic and fast)
    this.x[0] = r[0] + v[0] * dt
    this.x[1] = r[1] + v[1] * dt
    this.x[2] = r[2] + v[2] * dt

    this.x[3] = v[0] + aNav[0] * dt
    this.x[4] = v[1] + aNav[1] * dt
    this.x[5] = v[2] + aNav[2] * dt

    this.x[6] = wrapAngle(this.x[6] + wBody[0] * dt)
    this.x[7] = wrapAngle(this.x[7] + wBody[1] * dt)
    this.x[8] = wrapAngle(this.x[8] + wBody[2] * dt)

    // Biases follow random walk in covariance only; mean stays constant.

    const F = identity(15)
    F[0][3] = dt
    F[1][4] = dt
    F[2][5] = dt

    // dv/dba = -R_nb
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        F[3 + i][9 + j] = -Rnb[i][j] * dt
      }
    }

    // dv/deuler = d(R_nb * f_body)/deuler * dt
    const dAccdEuler = attitudeAccelJacobianNumerical(euler, fBody)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        F[3 + i][6 + j] = dAccdEuler[i][j] * dt
      }
    }

    // deuler/dbg = -I
    F[6][12] = -dt
    F[7][13] = -dt
    F[8][14] = -dt

    const qPos = 0.0
    const qVel = this.accelNoiseStd * this.accelNoiseStd * dt
    const qAtt = this.gyroNoiseStd * this.gyroNoiseStd * dt
    const qBa = this.accelBiasRwStd * this.accelBiasRwStd * dt
    const qBg = this.gyroBiasRwStd * this.gyroBiasRwStd * dt

    const Q = diag([
      qPos, qPos, qPos,
      qVel, qVel, qVel,
      qAtt, qAtt, qAtt,
      qBa, qBa, qBa,
      qBg, qBg, qBg
    ])

    this.P = add(matMul(matMul(F, this.P), transpose(F)), Q)
  }

  /** GPS position/velocity update: z = [rx ry rz vx vy vz]. */
  updateGPS(meas: GPSPVMeasurement): void {
    if (meas.available === false) return

    const z = [
      meas.position[0], meas.position[1], meas.position[2],
      meas.velocity[0], meas.velocity[1], meas.velocity[2]
    ]

    const H = zeros(6, 15)
    for (let i = 0; i < 3; i++) {
      H[i][i] = 1
      H[i + 3][i + 3] = 1
    }

    const rPosVar = meas.positionStd * meas.positionStd
    const rVelVar = meas.velocityStd * meas.velocityStd
    const R = diag([rPosVar, rPosVar, rPosVar, rVelVar, rVelVar, rVelVar])

    const hx = matVec(H, this.x)
    const y = z.map((v, i) => v - hx[i])

    const S = add(matMul(matMul(H, this.P), transpose(H)), R)
    const K = matMul(matMul(this.P, transpose(H)), inv(S))

    const dx = matVec(K, y)
    for (let i = 0; i < 15; i++) this.x[i] += dx[i]

    // Joseph form for numerical robustness
    const I = identity(15)
    const KH = matMul(K, H)
    const IminusKH = sub(I, KH)
    this.P = add(matMul(matMul(IminusKH, this.P), transpose(IminusKH)), matMul(matMul(K, R), transpose(K)))
  }

  getState(): EKF15State {
    return {
      position: [this.x[0], this.x[1], this.x[2]],
      velocity: [this.x[3], this.x[4], this.x[5]],
      attitude: { roll: this.x[6], pitch: this.x[7], yaw: this.x[8] },
      accelBias: [this.x[9], this.x[10], this.x[11]],
      gyroBias: [this.x[12], this.x[13], this.x[14]]
    }
  }

  getCovariance(): number[][] {
    return this.P.map((row) => row.slice())
  }
}

function gravityTwoBody(r: Vec3, mu: number): Vec3 {
  const r2 = r[0] * r[0] + r[1] * r[1] + r[2] * r[2]
  const rMag = Math.sqrt(r2)
  if (!Number.isFinite(rMag) || rMag < 1) return [0, 0, 0]
  const k = -mu / (r2 * rMag)
  return [k * r[0], k * r[1], k * r[2]]
}

function rotationMatrixBodyToNav(roll: number, pitch: number, yaw: number): number[][] {
  const sr = Math.sin(roll), cr = Math.cos(roll)
  const sp = Math.sin(pitch), cp = Math.cos(pitch)
  const sy = Math.sin(yaw), cy = Math.cos(yaw)

  // ZYX: R = Rz(yaw) * Ry(pitch) * Rx(roll)
  return [
    [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
    [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
    [-sp, cp * sr, cp * cr]
  ]
}

function attitudeAccelJacobianNumerical(euler: Vec3, fBody: Vec3): number[][] {
  const eps = 1e-6
  const J = zeros(3, 3)

  for (let j = 0; j < 3; j++) {
    const ep: Vec3 = [euler[0], euler[1], euler[2]]
    const em: Vec3 = [euler[0], euler[1], euler[2]]
    ep[j] += eps
    em[j] -= eps

    const ap = matVec3(rotationMatrixBodyToNav(ep[0], ep[1], ep[2]), fBody)
    const am = matVec3(rotationMatrixBodyToNav(em[0], em[1], em[2]), fBody)

    J[0][j] = (ap[0] - am[0]) / (2 * eps)
    J[1][j] = (ap[1] - am[1]) / (2 * eps)
    J[2][j] = (ap[2] - am[2]) / (2 * eps)
  }

  return J
}

function wrapAngle(a: number): number {
  let x = a
  while (x > Math.PI) x -= 2 * Math.PI
  while (x < -Math.PI) x += 2 * Math.PI
  return x
}

function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

function identity(n: number): number[][] {
  const I = zeros(n, n)
  for (let i = 0; i < n; i++) I[i][i] = 1
  return I
}

function diag(vals: number[]): number[][] {
  return vals.map((v, i) => vals.map((_, j) => (i === j ? v : 0)))
}

function add(A: number[][], B: number[][]): number[][] {
  return A.map((r, i) => r.map((v, j) => v + B[i][j]))
}

function sub(A: number[][], B: number[][]): number[][] {
  return A.map((r, i) => r.map((v, j) => v - B[i][j]))
}

function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map((r) => r[j]))
}

function matMul(A: number[][], B: number[][]): number[][] {
  const out = zeros(A.length, B[0].length)
  for (let i = 0; i < A.length; i++) {
    for (let k = 0; k < B.length; k++) {
      const aik = A[i][k]
      if (aik === 0) continue
      for (let j = 0; j < B[0].length; j++) out[i][j] += aik * B[k][j]
    }
  }
  return out
}

function matVec(A: number[][], x: number[]): number[] {
  const out = new Array(A.length).fill(0)
  for (let i = 0; i < A.length; i++) {
    let s = 0
    for (let j = 0; j < x.length; j++) s += A[i][j] * x[j]
    out[i] = s
  }
  return out
}

function matVec3(A: number[][], x: Vec3): Vec3 {
  const y = matVec(A, x)
  return [y[0], y[1], y[2]]
}

// Generic dense inverse (Gauss-Jordan). Input is expected to be non-singular.
function inv(Ain: number[][]): number[][] {
  const n = Ain.length
  const A = Ain.map((r) => r.slice())
  const I = identity(n)

  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r
    }
    if (p !== i) {
      const tr = A[i]; A[i] = A[p]; A[p] = tr
      const ti = I[i]; I[i] = I[p]; I[p] = ti
    }

    const pivot = A[i][i] || 1e-12
    const invPivot = 1 / pivot
    for (let c = 0; c < n; c++) {
      A[i][c] *= invPivot
      I[i][c] *= invPivot
    }

    for (let r = 0; r < n; r++) {
      if (r === i) continue
      const f = A[r][i]
      if (f === 0) continue
      for (let c = 0; c < n; c++) {
        A[r][c] -= f * A[i][c]
        I[r][c] -= f * I[i][c]
      }
    }
  }

  return I
}
