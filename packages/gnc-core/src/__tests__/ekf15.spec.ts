import { describe, expect, it } from 'vitest'

import { MU_EARTH } from '../math/constants'
import { EKF15Navigation, type EKF15State, type IMUSample } from '../navigation/ekf15'

describe('EKF15Navigation', () => {
  const baseState: EKF15State = {
    position: [7000e3, 0, 0],
    velocity: [0, 7500, 0],
    attitude: { roll: 0, pitch: 0, yaw: 0 },
    accelBias: [0, 0, 0],
    gyroBias: [0, 0, 0]
  }

  const zeroImu: IMUSample = {
    specificForce: [0, 0, 0],
    angularRate: [0, 0, 0]
  }

  it('initializes with finite state and 15x15 covariance', () => {
    const ekf = new EKF15Navigation(baseState)
    const state = ekf.getState()
    const P = ekf.getCovariance()

    expect(P.length).toBe(15)
    expect(P[0].length).toBe(15)
    expect(Number.isFinite(state.position[0])).toBe(true)
    expect(Number.isFinite(state.velocity[1])).toBe(true)
  })

  it('predict step advances kinematics and keeps state finite', () => {
    const ekf = new EKF15Navigation(baseState)
    ekf.predict(zeroImu, 1)

    const state = ekf.getState()
    expect(state.position[1]).toBeGreaterThan(7000)
    expect(state.position[0]).toBeCloseTo(7000e3, -1)
    expect(Number.isFinite(state.velocity[0])).toBe(true)
    expect(Number.isFinite(state.velocity[1])).toBe(true)
  })

  it('predict with gravity produces inward radial acceleration', () => {
    const ekf = new EKF15Navigation(baseState, undefined, { mu: MU_EARTH })
    const before = ekf.getState()
    ekf.predict(zeroImu, 1)
    const after = ekf.getState()

    expect(after.velocity[0]).toBeLessThan(before.velocity[0])
  })

  it('GPS update reduces position residual magnitude', () => {
    const biasedState: EKF15State = {
      ...baseState,
      position: [baseState.position[0] + 150, baseState.position[1] - 120, baseState.position[2] + 80],
      velocity: [baseState.velocity[0] + 4, baseState.velocity[1] - 3, baseState.velocity[2] + 2]
    }

    const ekf = new EKF15Navigation(biasedState)

    const pre = ekf.getState()
    const preErr = Math.hypot(
      pre.position[0] - baseState.position[0],
      pre.position[1] - baseState.position[1],
      pre.position[2] - baseState.position[2]
    )

    ekf.updateGPS({
      position: baseState.position,
      velocity: baseState.velocity,
      positionStd: 3,
      velocityStd: 0.2,
      available: true
    })

    const post = ekf.getState()
    const postErr = Math.hypot(
      post.position[0] - baseState.position[0],
      post.position[1] - baseState.position[1],
      post.position[2] - baseState.position[2]
    )

    expect(postErr).toBeLessThan(preErr)
  })

  it('GPS unavailable leaves state unchanged', () => {
    const ekf = new EKF15Navigation(baseState)
    ekf.predict(zeroImu, 0.5)

    const pre = ekf.getState()
    ekf.updateGPS({
      position: [1, 2, 3],
      velocity: [4, 5, 6],
      positionStd: 1,
      velocityStd: 1,
      available: false
    })
    const post = ekf.getState()

    expect(post.position[0]).toBeCloseTo(pre.position[0], 10)
    expect(post.position[1]).toBeCloseTo(pre.position[1], 10)
    expect(post.velocity[2]).toBeCloseTo(pre.velocity[2], 10)
  })

  it('GPS update reduces covariance trace', () => {
    const ekf = new EKF15Navigation(baseState)
    ekf.predict(zeroImu, 1)

    const trace = (M: number[][]) => M.reduce((s, r, i) => s + r[i], 0)
    const preTrace = trace(ekf.getCovariance())

    ekf.updateGPS({
      position: baseState.position,
      velocity: baseState.velocity,
      positionStd: 2,
      velocityStd: 0.1,
      available: true
    })

    const postTrace = trace(ekf.getCovariance())
    expect(postTrace).toBeLessThan(preTrace)
  })
})
