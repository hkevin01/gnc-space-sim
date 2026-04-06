/**
 * ID: TEST-KALMAN-001
 * Requirement: Verify KalmanFilter3D correctly estimates 6-DoF position and
 *   velocity state from noisy measurements, and converges within bounds.
 * Purpose: Validate the navigation filter used for real-time GNC estimation.
 * References: Kalman (1960) "A New Approach to Linear Filtering and Prediction";
 *   NASA-SP-8083 Guidance and Navigation for Entry Vehicles.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { KalmanFilter3D } from '../navigation/kalman'

describe('KalmanFilter3D – initialisation', () => {
  it('constructs without error', () => {
    expect(() => new KalmanFilter3D(
      { r: [7000e3, 0, 0], v: [0, 7500, 0] },
      { posVar: 1e4, velVar: 10 },
      { processPosStd: 2, processVelStd: 0.5, measPosStd: 20, measVelStd: 1 }
    )).not.toThrow()
  })

  it('initial x[0] matches provided position r[0]', () => {
    const kf = new KalmanFilter3D(
      { r: [7000e3, 0, 0], v: [0, 7500, 0] },
      { posVar: 1e4, velVar: 10 },
      { processPosStd: 2, processVelStd: 0.5, measPosStd: 20, measVelStd: 1 }
    )
    expect(kf.x[0]).toBeCloseTo(7000e3, -5)
    expect(kf.x[4]).toBeCloseTo(7500, -3)
  })

  it('initial covariance matrix P is 6×6', () => {
    const kf = new KalmanFilter3D(
      { r: [7000e3, 0, 0], v: [0, 7500, 0] },
      { posVar: 1e4, velVar: 10 },
      {}
    )
    expect(kf.P).toHaveLength(6)
    kf.P.forEach(row => expect(row).toHaveLength(6))
  })
})

describe('KalmanFilter3D – predict / update cycle', () => {
  let kf: KalmanFilter3D

  beforeEach(() => {
    kf = new KalmanFilter3D(
      { r: [7000e3, 0, 0], v: [0, 7500, 0] },
      { posVar: 1e4, velVar: 10 },
      { processPosStd: 2, processVelStd: 0.5, measPosStd: 20, measVelStd: 1 }
    )
  })

  it('predict step does not throw', () => {
    expect(() => kf.predict(1.0)).not.toThrow()
  })

  it('update step does not throw', () => {
    kf.predict(1.0)
    expect(() => kf.update([7000e3, 0, 0, 0, 7500, 0])).not.toThrow()
  })

  it('all state components remain finite after predict + update', () => {
    kf.predict(1.0)
    kf.update([7000e3, 10, 0, 0, 7500, 0])
    kf.x.forEach(v => expect(Number.isFinite(v)).toBe(true))
  })

  it('converges position estimate toward repeated measurements', () => {
    // Apply 50 predict/update cycles with measurements near truth
    const measR0 = 7000e3
    for (let i = 0; i < 50; i++) {
      kf.predict(1.0)
      kf.update([
        measR0 + (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 1,
        7500 + (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1,
      ])
    }
    // After convergence, x[0] should be within 1 km of measurement centre
    expect(Math.abs(kf.x[0] - measR0)).toBeLessThan(1000)
  })

  it('covariance diagonal stays positive (numerically stable)', () => {
    for (let i = 0; i < 20; i++) {
      kf.predict(1.0)
      kf.update([7000e3, 0, 0, 0, 7500, 0])
    }
    for (let i = 0; i < 6; i++) {
      expect(kf.P[i][i]).toBeGreaterThan(0)
    }
  })
})
