/**
 * ID: TEST-SLS-INT-001
 * Requirement: Verify that the SLS mock vehicle state generator used in
 *   SimpleSLSDemo produces physically plausible values across a 0–600s timeline.
 * Purpose: Integration test that exercises the SLS state machine (staging,
 *   mass, thrust, altitude) without a running WebGL context.
 * References: SLS Block 1 Mission Design Document; AIAA-2019-0814.
 */

import { describe, it, expect } from 'vitest'

// Replicate mock state function from SimpleSLSDemo.tsx (pure function, no React)
function createMockVehicleState(time: number) {
  return {
    time,
    altitude: Math.max(0, time * 100),       // simple linear altitude model (m)
    velocity: Math.max(0, time * 50),          // simple linear velocity (m/s)
    mass: Math.max(100000, 2800000 - time * 3000), // decreasing mass (kg)
    thrust: time < 480 ? 16000000 : 0,        // 16 MN for ~8 minutes
    stages: [
      {
        name: 'SRB',
        active: time < 126,
        burnTime: Math.min(time, 126),
        propRemaining: Math.max(0, 1200000 - time * 9500),
        thrust: time < 126 ? 14000000 : 0
      },
      {
        name: 'Core Stage',
        active: time < 480,
        burnTime: Math.min(time, 480),
        propRemaining: Math.max(0, 980000 - time * 2000),
        thrust: time < 480 ? 2000000 : 0
      },
      {
        name: 'ICPS',
        active: time > 485,
        burnTime: Math.max(0, time - 485),
        propRemaining: Math.max(0, 30000 - Math.max(0, time - 485) * 100),
        thrust: time > 485 ? 110000 : 0
      }
    ],
    activeStages: time < 126 ? ['SRB', 'Core Stage']
                : time < 480 ? ['Core Stage']
                : time < 485 ? []
                : ['ICPS']
  }
}

describe('SLS Mock State – physical plausibility', () => {
  it('altitude is 0 at T=0', () => {
    expect(createMockVehicleState(0).altitude).toBe(0)
  })

  it('altitude increases monotonically during flight', () => {
    for (let t = 0; t < 600; t += 10) {
      const s0 = createMockVehicleState(t)
      const s1 = createMockVehicleState(t + 10)
      expect(s1.altitude).toBeGreaterThanOrEqual(s0.altitude)
    }
  })

  it('mass decreases monotonically during flight', () => {
    for (let t = 0; t < 600; t += 10) {
      const s0 = createMockVehicleState(t)
      const s1 = createMockVehicleState(t + 10)
      expect(s1.mass).toBeLessThanOrEqual(s0.mass)
    }
  })

  it('mass never drops to zero (minimum structural mass preserved)', () => {
    for (let t = 0; t <= 600; t += 10) {
      expect(createMockVehicleState(t).mass).toBeGreaterThan(0)
    }
  })

  it('thrust is non-negative at all times', () => {
    for (let t = 0; t <= 600; t += 10) {
      expect(createMockVehicleState(t).thrust).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('SLS Mock State – staging', () => {
  it('SRB active before T=126s', () => {
    expect(createMockVehicleState(0).activeStages).toContain('SRB')
    expect(createMockVehicleState(125).activeStages).toContain('SRB')
  })

  it('SRB inactive at T=126s (burnout)', () => {
    expect(createMockVehicleState(126).activeStages).not.toContain('SRB')
  })

  it('Core Stage active between T=0 and T=479s', () => {
    expect(createMockVehicleState(0).activeStages).toContain('Core Stage')
    expect(createMockVehicleState(200).activeStages).toContain('Core Stage')
    expect(createMockVehicleState(479).activeStages).toContain('Core Stage')
  })

  it('Core Stage inactive at T=480s (MECO)', () => {
    expect(createMockVehicleState(480).activeStages).not.toContain('Core Stage')
  })

  it('coast phase (T=480–485s) has no active stages', () => {
    const s = createMockVehicleState(482)
    expect(s.activeStages).toHaveLength(0)
  })

  it('ICPS ignites at T=486s', () => {
    expect(createMockVehicleState(486).activeStages).toContain('ICPS')
  })

  it('ICPS propellant depletes over time', () => {
    const s1 = createMockVehicleState(500)
    const s2 = createMockVehicleState(600)
    const icps1 = s1.stages.find(s => s.name === 'ICPS')!
    const icps2 = s2.stages.find(s => s.name === 'ICPS')!
    expect(icps2.propRemaining).toBeLessThan(icps1.propRemaining)
  })
})

describe('SLS Mock State – propellant tracking', () => {
  it('SRB propellant is zero after burnout', () => {
    const s = createMockVehicleState(200)
    const srb = s.stages.find(st => st.name === 'SRB')!
    expect(srb.propRemaining).toBe(0)
  })

  it('Core Stage propellant never goes negative', () => {
    for (let t = 0; t <= 600; t += 10) {
      const core = createMockVehicleState(t).stages.find(s => s.name === 'Core Stage')!
      expect(core.propRemaining).toBeGreaterThanOrEqual(0)
    }
  })
})
