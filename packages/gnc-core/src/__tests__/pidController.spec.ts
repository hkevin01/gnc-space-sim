/**
 * ID: TEST-PID-001
 * Requirement: Verify PIDController computes the correct discrete-time PID
 *   output, including proportional, integral, and derivative terms, and that
 *   reset() clears accumulated state.
 * Purpose: Regression guard for the attitude control law that drives TVC
 *   gimbal commands during powered ascent.
 * References: GNC-CTRL-001; Franklin et al. "Feedback Control" §8.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PIDController } from '../control/launch'

// ── Pure math correctness ─────────────────────────────────────────────────────

describe('PIDController – proportional only (ki=0, kd=0)', () => {
  it('output = kp × error on first call', () => {
    const pid = new PIDController(2.0, 0.0, 0.0, 0.1)
    expect(pid.update(10, 7)).toBeCloseTo(2.0 * 3.0) // error = 3
  })

  it('output is 0 when setpoint equals measurement', () => {
    const pid = new PIDController(5.0, 0.0, 0.0, 0.1)
    expect(pid.update(4.0, 4.0)).toBeCloseTo(0)
  })

  it('output is negative for negative error', () => {
    const pid = new PIDController(1.0, 0.0, 0.0, 0.1)
    expect(pid.update(-5, 0)).toBeLessThan(0)
  })
})

describe('PIDController – integral term (kp=0, kd=0)', () => {
  it('integral accumulates over multiple calls', () => {
    const dt = 0.1
    const pid = new PIDController(0.0, 1.0, 0.0, dt)
    // error = 2 each step; integral should be 2*dt after one call
    const out1 = pid.update(2, 0) // integral = 2*0.1 = 0.2
    expect(out1).toBeCloseTo(0.2)
    const out2 = pid.update(2, 0) // integral = 0.4
    expect(out2).toBeCloseTo(0.4)
    const out3 = pid.update(2, 0) // integral = 0.6
    expect(out3).toBeCloseTo(0.6)
  })
})

describe('PIDController – derivative term (kp=0, ki=0)', () => {
  it('derivative is (error_new - error_prev) / dt', () => {
    const dt = 0.1
    const pid = new PIDController(0.0, 0.0, 1.0, dt)
    // First call: previous_error = 0, error = 5 → derivative = (5 - 0)/0.1 = 50
    const out1 = pid.update(5, 0)
    expect(out1).toBeCloseTo(50)
    // Second call: previous_error = 5, error = 5 → derivative = 0
    const out2 = pid.update(5, 0)
    expect(out2).toBeCloseTo(0)
  })

  it('derivative is negative when error is shrinking', () => {
    const dt = 0.1
    const pid = new PIDController(0.0, 0.0, 1.0, dt)
    pid.update(10, 0)  // prime: previous_error = 10
    const out = pid.update(5, 0) // error = 5 < 10 → negative derivative
    expect(out).toBeLessThan(0)
  })
})

// ── reset() ───────────────────────────────────────────────────────────────────

describe('PIDController – reset()', () => {
  it('clears integral accumulator', () => {
    const pid = new PIDController(0.0, 1.0, 0.0, 0.1)
    pid.update(10, 0) // accumulate integral
    pid.update(10, 0)
    pid.reset()
    // After reset: integral = 0, so next output with ki=1 = 10*0.1 = 1
    expect(pid.update(10, 0)).toBeCloseTo(1.0)
  })

  it('clears previous error for derivative term', () => {
    const pid = new PIDController(0.0, 0.0, 1.0, 0.1)
    pid.update(100, 0) // previous_error = 100
    pid.reset()
    // After reset previous_error = 0, so derivative = (10-0)/0.1 = 100
    const out = pid.update(10, 0)
    expect(out).toBeCloseTo(100)
  })
})

// ── combined gains ────────────────────────────────────────────────────────────

describe('PIDController – combined PID', () => {
  it('full PID output is sum of P + I + D terms', () => {
    const kp = 1.0, ki = 0.5, kd = 0.2, dt = 0.1
    const pid = new PIDController(kp, ki, kd, dt)
    const setpoint = 10, measurement = 7, error = 3
    // P = kp*error = 3
    // I = ki*error*dt = 0.5*3*0.1 = 0.15
    // D = kd*(error-0)/dt = 0.2*3/0.1 = 6
    // Total = 3 + 0.15 + 6 = 9.15
    expect(pid.update(setpoint, measurement)).toBeCloseTo(9.15, 5)
  })
})
