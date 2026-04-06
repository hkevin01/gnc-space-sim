/**
 * ID: TEST-GUIDANCE-001
 * Requirement: Verify GravityTurnGuidance and SLSGuidance compute valid pitch,
 *   yaw, and throttle commands across all mission phases.
 * Purpose: Validate that guidance algorithms produce physically meaningful
 *   flight commands that keep the vehicle on a safe trajectory.
 * References: NASA-STD-7009A ascent guidance standards; SLS Flight Design Doc.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GravityTurnGuidance, SLSGuidance, LaunchPhase } from '../launch/guidance'

// Helper: create a minimal LaunchState
function makeState(overrides: Partial<{
  velocity_magnitude: number
  altitude: number
  mission_time: number
}> = {}) {
  return {
    r: [6371000, 0, 0] as [number,number,number],
    v: [0, 0, 0] as [number,number,number],
    phase: LaunchPhase.STAGE1_BURN,
    mission_time: overrides.mission_time ?? 0,
    altitude: overrides.altitude ?? 0,
    velocity_magnitude: overrides.velocity_magnitude ?? 0,
    flight_path_angle: Math.PI / 2,
    heading: Math.PI / 2,
    mass: 2800000,
    thrust: [0, 0, 1000000] as [number,number,number],
    drag: [0, 0, 0] as [number,number,number],
    atmosphere: { pressure: 101325, density: 1.225, temperature: 288.15 },
    guidance: { pitch_program: Math.PI / 2, yaw_program: 0, throttle: 1.0 },
  }
}

describe('GravityTurnGuidance', () => {
  let guidance: GravityTurnGuidance

  beforeEach(() => {
    // Target 185 km parking orbit at 28.5° inclination (KSC standard)
    guidance = new GravityTurnGuidance(185000, (28.5 * Math.PI) / 180)
  })

  it('returns pitch = 90° (vertical) at zero velocity', () => {
    const { pitch } = guidance.computeGuidance(makeState({ velocity_magnitude: 0 }))
    expect(pitch).toBeCloseTo(Math.PI / 2, 5)
  })

  it('returns pitch < 90° once above threshold velocity', () => {
    const { pitch } = guidance.computeGuidance(makeState({ velocity_magnitude: 500 }))
    expect(pitch).toBeLessThan(Math.PI / 2)
  })

  it('pitch monotonically decreases as velocity increases 0→3000 m/s', () => {
    let prevPitch = Math.PI / 2
    for (let v = 100; v <= 3000; v += 200) {
      const { pitch } = guidance.computeGuidance(makeState({ velocity_magnitude: v }))
      expect(pitch).toBeLessThanOrEqual(prevPitch + 0.01) // allow tiny float noise
      prevPitch = pitch
    }
  })

  it('throttle reduces during max-Q phase (12-100 km altitude)', () => {
    const { throttle: throttleAtMaxQ } = guidance.computeGuidance(
      makeState({ altitude: 13000, velocity_magnitude: 1500 })
    )
    const { throttle: throttleAbove } = guidance.computeGuidance(
      makeState({ altitude: 120000, velocity_magnitude: 1500 })
    )
    expect(throttleAtMaxQ).toBeLessThan(throttleAbove)
  })

  it('throttle is in [0, 1] range for all altitudes', () => {
    const altitudes = [0, 1000, 12000, 50000, 100000, 200000, 400000]
    for (const alt of altitudes) {
      const { throttle } = guidance.computeGuidance(makeState({ altitude: alt, velocity_magnitude: 2000 }))
      expect(throttle).toBeGreaterThanOrEqual(0)
      expect(throttle).toBeLessThanOrEqual(1.0)
    }
  })

  it('yaw is finite and within [-π, π]', () => {
    const { yaw } = guidance.computeGuidance(makeState())
    expect(Number.isFinite(yaw)).toBe(true)
    expect(yaw).toBeGreaterThanOrEqual(-Math.PI)
    expect(yaw).toBeLessThanOrEqual(Math.PI)
  })

  it('pitch is always positive (upward component)', () => {
    for (let v = 0; v <= 8000; v += 500) {
      const { pitch } = guidance.computeGuidance(makeState({ velocity_magnitude: v, altitude: 200000 }))
      expect(pitch).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('SLSGuidance', () => {
  let sls: SLSGuidance

  beforeEach(() => {
    sls = new SLSGuidance(185000, (28.5 * Math.PI) / 180)
  })

  it('uses correct pitch at T=0 (vertical, 90°)', () => {
    const { pitch } = sls.computeGuidance(makeState({ mission_time: 0 }))
    expect(pitch).toBeCloseTo(Math.PI / 2, 3)
  })

  it('pitches over by T=60s', () => {
    const { pitch: p0 } = sls.computeGuidance(makeState({ mission_time: 0 }))
    const { pitch: p60 } = sls.computeGuidance(makeState({ mission_time: 60 }))
    expect(p60).toBeLessThan(p0)
  })

  it('throttle follows programmed schedule at T=50s (max-Q reduction)', () => {
    const { throttle } = sls.computeGuidance(makeState({ mission_time: 50 }))
    // T+40-70s throttle program drops to 0.67 for max-Q
    expect(throttle).toBeLessThan(1.0)
  })

  it('returns all finite values at T=300s', () => {
    const result = sls.computeGuidance(makeState({ mission_time: 300 }))
    expect(Number.isFinite(result.pitch)).toBe(true)
    expect(Number.isFinite(result.yaw)).toBe(true)
    expect(Number.isFinite(result.throttle)).toBe(true)
  })

  it('pitch reaches near-zero by T=480s (orbital insertion)', () => {
    const { pitch } = sls.computeGuidance(makeState({ mission_time: 480 }))
    expect(pitch).toBeCloseTo(0, 3)
  })
})
