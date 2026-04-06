/**
 * ID: TEST-THRUST-001
 * Requirement: Verify interpolateThrust returns physically correct thrust values
 *   across SLS SRB and RS-25 liquid engine profiles, including boundary and
 *   edge-case handling.
 * Purpose: Regression guard on the propulsion model that drives mass-flow
 *   calculations in VehicleIntegrator.
 * References: GNC-ENGINE-001; SLSSRBThrustProfile data; Sutton & Biblarz §12.
 */

import { describe, it, expect } from 'vitest'
import { interpolateThrust, SLSSRBThrustProfile, LiquidEngineProfile } from '../engines/thrust_curves'

// ── SRB thrust profile ────────────────────────────────────────────────────────

describe('interpolateThrust – SLS SRB', () => {
  it('returns 0 before ignition (time < 0)', () => {
    expect(interpolateThrust(-1, SLSSRBThrustProfile)).toBe(0)
  })

  it('returns maximum thrust at t=2s (peak)', () => {
    // At t=2s thrust fraction = 1.0 → full 16 MN
    const thrust = interpolateThrust(2, SLSSRBThrustProfile)
    expect(thrust).toBeCloseTo(SLSSRBThrustProfile.maxThrust, -3)
  })

  it('thrust is positive at t=0 (ignition)', () => {
    expect(interpolateThrust(0, SLSSRBThrustProfile)).toBeGreaterThan(0)
  })

  it('thrust decreases toward burnout end (t=120 < t=126)', () => {
    const t120 = interpolateThrust(120, SLSSRBThrustProfile)
    const t125 = interpolateThrust(125, SLSSRBThrustProfile)
    expect(t125).toBeLessThan(t120)
  })

  it('returns 0 at burnout (t = duration)', () => {
    expect(interpolateThrust(SLSSRBThrustProfile.duration, SLSSRBThrustProfile)).toBe(0)
  })

  it('returns 0 after burnout (time > duration)', () => {
    expect(interpolateThrust(200, SLSSRBThrustProfile)).toBe(0)
  })

  it('mid-burn thrust is between 90% and 100% of maxThrust', () => {
    const thrust = interpolateThrust(60, SLSSRBThrustProfile)
    expect(thrust).toBeGreaterThan(SLSSRBThrustProfile.maxThrust * 0.90)
    expect(thrust).toBeLessThanOrEqual(SLSSRBThrustProfile.maxThrust)
  })

  it('interpolates smoothly between data points (no jumps)', () => {
    // Sample at 0.5s intervals from t=0 to t=30 and check monotone decrease
    // after the initial ramp (t > 10)
    let prev = interpolateThrust(10, SLSSRBThrustProfile)
    for (let t = 11; t <= 126; t += 1) {
      const cur = interpolateThrust(t, SLSSRBThrustProfile)
      // Thrust should never jump UP during the sustained/tail-off phase
      expect(cur).toBeLessThanOrEqual(prev + 1) // allow floating point eps
      prev = cur
    }
  })
})

// ── Liquid engine profile ─────────────────────────────────────────────────────

describe('interpolateThrust – RS-25 liquid engine', () => {
  it('returns 0 at ignition (t=0, startup transient begins)', () => {
    expect(interpolateThrust(0, LiquidEngineProfile)).toBe(0)
  })

  it('reaches full thrust shortly after startup', () => {
    // RS-25 reaches full thrust by ~6 s per profile
    const thrust = interpolateThrust(10, LiquidEngineProfile)
    expect(thrust).toBeGreaterThan(LiquidEngineProfile.maxThrust * 0.95)
  })

  it('returns 0 after burn duration', () => {
    expect(interpolateThrust(LiquidEngineProfile.duration + 1, LiquidEngineProfile)).toBe(0)
  })
})

// ── Profile data integrity ────────────────────────────────────────────────────

describe('SLSSRBThrustProfile data integrity', () => {
  it('all thrust fractions are in [0, 1]', () => {
    for (const p of SLSSRBThrustProfile.points) {
      expect(p.thrust).toBeGreaterThanOrEqual(0)
      expect(p.thrust).toBeLessThanOrEqual(1)
    }
  })

  it('time values are strictly increasing', () => {
    const times = SLSSRBThrustProfile.points.map(p => p.time)
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1])
    }
  })

  it('duration matches last point time', () => {
    const lastTime = SLSSRBThrustProfile.points.at(-1)!.time
    expect(SLSSRBThrustProfile.duration).toBeCloseTo(lastTime, 0)
  })
})
