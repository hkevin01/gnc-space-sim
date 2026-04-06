/**
 * ID: TEST-SENS-001
 * Requirement: Verify CoordinateTransforms round-trips are accurate, and that
 *   SensorSimulator produces measurements with correct structural fields,
 *   finite values, and altitude-dependent GPS availability.
 * Purpose: Guards the navigation sensor layer against regressions that would
 *   break the Kalman filter measurement updates.
 * References: GNC-NAV-002; WGS84 standard; GPS SPS Performance Standard.
 */

import { describe, it, expect } from 'vitest'
import { CoordinateTransforms, SensorSimulator } from '../navigation/sensors'
import type { LaunchState } from '../launch/guidance'
import { LaunchPhase } from '../launch/guidance'

// ── Coordinate transforms ─────────────────────────────────────────────────────

describe('CoordinateTransforms – ECEF ↔ Geodetic', () => {
  // KSC LC-39B: lat=28.6272°N, lon=-80.6206°E, alt=16 m
  const KSC_LAT = 28.6272 * Math.PI / 180
  const KSC_LON = -80.6206 * Math.PI / 180
  const KSC_ALT = 16

  it('converts KSC geodetic to ECEF and back within 1 m', () => {
    const ecef = CoordinateTransforms.geodeticToEcef(KSC_LAT, KSC_LON, KSC_ALT)
    const geo = CoordinateTransforms.ecefToGeodetic(ecef)
    expect(geo.lat).toBeCloseTo(KSC_LAT, 6)
    expect(geo.lon).toBeCloseTo(KSC_LON, 6)
    expect(geo.alt).toBeCloseTo(KSC_ALT, 0) // within 1 m
  })

  it('ECEF coordinates are Earth-radius scale (~6.4×10⁶ m)', () => {
    const ecef = CoordinateTransforms.geodeticToEcef(KSC_LAT, KSC_LON, KSC_ALT)
    const r = Math.hypot(...ecef)
    expect(r).toBeGreaterThan(6_350_000)
    expect(r).toBeLessThan(6_400_000)
  })

  it('equatorial point has near-zero z coordinate', () => {
    const ecef = CoordinateTransforms.geodeticToEcef(0, 0, 0)
    expect(Math.abs(ecef[2])).toBeLessThan(1) // z ≈ 0 on equator
  })

  it('north pole x,y ≈ 0', () => {
    const ecef = CoordinateTransforms.geodeticToEcef(Math.PI / 2, 0, 0)
    expect(Math.abs(ecef[0])).toBeLessThan(10)
    expect(Math.abs(ecef[1])).toBeLessThan(10)
  })
})

describe('CoordinateTransforms – ENU matrix', () => {
  it('returns a 3×3 matrix', () => {
    const M = CoordinateTransforms.ecefToEnuMatrix(0.5, -1.4)
    expect(M).toHaveLength(3)
    M.forEach(row => expect(row).toHaveLength(3))
  })

  it('matrix rows are unit vectors', () => {
    const M = CoordinateTransforms.ecefToEnuMatrix(0.5, -1.4)
    for (const row of M) {
      const norm = Math.hypot(...row)
      expect(norm).toBeCloseTo(1, 5)
    }
  })
})

// ── SensorSimulator ───────────────────────────────────────────────────────────

// Minimal LaunchState stub (only fields used by SensorSimulator)
function makeState(altitude = 10000): LaunchState {
  const r_mag = 6_371_000 + altitude
  return {
    r: [r_mag, 0, 0],
    v: [0, 7800, 0],
    phase: LaunchPhase.STAGE1_BURN,
    mission_time: 60,
    altitude,
    velocity_magnitude: 7800,
    flight_path_angle: 0.1,
    heading: 1.55,
    mass: 500_000,
    thrust: [0, 8_000_000, 0],
    drag: [0, 0, 0],
    atmosphere: { pressure: 26_500, density: 0.36, temperature: 222 },
    guidance: { pitch_program: 1.0, yaw_program: 0.0, throttle: 1.0 }
  }
}

describe('SensorSimulator.simulateIMU', () => {
  it('returns an object with acceleration, angular_velocity, timestamp', () => {
    const meas = SensorSimulator.simulateIMU(makeState(), 0.1)
    expect(meas).toHaveProperty('acceleration')
    expect(meas).toHaveProperty('angular_velocity')
    expect(meas).toHaveProperty('timestamp')
  })

  it('acceleration has 3 finite components', () => {
    const { acceleration } = SensorSimulator.simulateIMU(makeState(), 0.1)
    expect(acceleration).toHaveLength(3)
    acceleration.forEach(a => expect(Number.isFinite(a)).toBe(true))
  })

  it('angular_velocity has 3 finite components', () => {
    const { angular_velocity } = SensorSimulator.simulateIMU(makeState(), 0.1)
    expect(angular_velocity).toHaveLength(3)
    angular_velocity.forEach(w => expect(Number.isFinite(w)).toBe(true))
  })

  it('timestamp matches state mission_time', () => {
    const state = makeState()
    const meas = SensorSimulator.simulateIMU(state, 0.1)
    expect(meas.timestamp).toBe(state.mission_time)
  })
})

describe('SensorSimulator.simulateGPS', () => {
  it('GPS is available at low altitude (<80 km)', () => {
    const meas = SensorSimulator.simulateGPS(makeState(10_000))
    expect(meas.available).toBe(true)
  })

  it('GPS is unavailable above 80 km', () => {
    const meas = SensorSimulator.simulateGPS(makeState(85_000))
    expect(meas.available).toBe(false)
  })

  it('GPS position has 3 finite components', () => {
    const meas = SensorSimulator.simulateGPS(makeState(10_000))
    expect(meas.position).toHaveLength(3)
    meas.position.forEach(p => expect(Number.isFinite(p)).toBe(true))
  })

  it('GPS accuracy degrades with altitude', () => {
    const low  = SensorSimulator.simulateGPS(makeState(10_000))
    const high = SensorSimulator.simulateGPS(makeState(70_000))
    expect(high.accuracy.position).toBeGreaterThan(low.accuracy.position)
  })
})
