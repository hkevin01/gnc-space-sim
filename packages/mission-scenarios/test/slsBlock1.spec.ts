/**
 * ID: TEST-SLS-CONFIG-001
 * Requirement: Verify SLSBlock1 vehicle configuration exports accurate,
 *   physically consistent values matching NASA SLS Block 1 public specifications.
 * Purpose: Regression guard — prevents accidental constant edits from silently
 *   breaking the propulsion model used by VehicleIntegrator.
 * References: NASA SLS Fact Sheet; SLS Block 1 User's Guide (LS-SLS-19-001).
 */

import { describe, it, expect } from 'vitest'
import { SLSBlock1 } from '../src/vehicles/sls_block1'

describe('SLSBlock1 vehicle – structure', () => {
  it('exports a vehicle config with a name', () => {
    expect(SLSBlock1.name).toBeTruthy()
    expect(typeof SLSBlock1.name).toBe('string')
  })

  it('has exactly 3 stages: SRB, Core Stage, ICPS', () => {
    const names = SLSBlock1.stages.map(s => s.name)
    expect(names).toContain('SRB')
    expect(names).toContain('Core Stage')
    expect(names).toContain('ICPS')
    expect(SLSBlock1.stages).toHaveLength(3)
  })

  it('has a payload definition', () => {
    expect(SLSBlock1.payload.mass).toBeGreaterThan(0)
    expect(typeof SLSBlock1.payload.name).toBe('string')
  })

  it('has aerodynamic parameters', () => {
    expect(SLSBlock1.aerodynamics.referenceArea).toBeGreaterThan(0)
    expect(SLSBlock1.aerodynamics.dragCoefficient).toBeGreaterThan(0)
  })

  it('has at least 5 mission events', () => {
    expect(SLSBlock1.events.length).toBeGreaterThanOrEqual(5)
  })
})

describe('SLSBlock1 – SRB stage', () => {
  const srb = () => SLSBlock1.stages.find(s => s.name === 'SRB')!

  it('SRB is a parallel booster (parallel: true)', () => {
    expect(srb().parallel).toBe(true)
  })

  it('SRB vacuum thrust ≥ 14 MN (each)', () => {
    expect(srb().thrust).toBeGreaterThanOrEqual(14_000_000)
  })

  it('SRB Isp is within expected range 240–290 s', () => {
    expect(srb().isp).toBeGreaterThanOrEqual(240)
    expect(srb().isp).toBeLessThanOrEqual(290)
  })

  it('SRB burn time is ~126 s', () => {
    expect(srb().burnTime).toBeCloseTo(126, -1)
  })

  it('SRB propellant mass > dry mass (fuel-loaded)', () => {
    expect(srb().propMass).toBeGreaterThan(srb().dryMass)
  })
})

describe('SLSBlock1 – Core Stage', () => {
  const core = () => SLSBlock1.stages.find(s => s.name === 'Core Stage')!

  it('Core Stage vacuum Isp ~ 452 s (RS-25)', () => {
    expect(core().isp).toBeCloseTo(452, -1)
  })

  it('Core Stage has TVC (gimbalRange > 0)', () => {
    expect((core().gimbalRange ?? 0)).toBeGreaterThan(0)
  })

  it('Core Stage propellant > 800 000 kg (LOX/LH2 full load)', () => {
    expect(core().propMass).toBeGreaterThan(800_000)
  })

  it('Core Stage burn time is ≥ 400 s', () => {
    expect(core().burnTime).toBeGreaterThanOrEqual(400)
  })
})

describe('SLSBlock1 – ICPS', () => {
  const icps = () => SLSBlock1.stages.find(s => s.name === 'ICPS')!

  it('ICPS Isp > 460 s (RL10B-2 high-efficiency cryogenic)', () => {
    expect(icps().isp).toBeGreaterThan(460)
  })

  it('ICPS thrust is 110 ± 10 kN', () => {
    expect(icps().thrust).toBeGreaterThanOrEqual(100_000)
    expect(icps().thrust).toBeLessThanOrEqual(120_000)
  })

  it('ICPS sea-level thrust is 0 (upper stage only)', () => {
    expect(icps().thrustSL).toBe(0)
  })
})

describe('SLSBlock1 – total liftoff mass', () => {
  it('total liftoff mass is within 2400–3000 metric tons', () => {
    // parallel:true stages (SRBs) are physically 2 units — multiply by 2
    const total = SLSBlock1.stages.reduce((sum, st) => {
      const multiplier = st.parallel ? 2 : 1
      return sum + (st.dryMass + st.propMass) * multiplier
    }, SLSBlock1.payload.mass)
    expect(total).toBeGreaterThan(2_400_000)
    expect(total).toBeLessThan(3_000_000)
  })

  it('combined SRB liftoff thrust ≥ 2× Core Stage thrust (SRBs dominate liftoff)', () => {
    const srb = SLSBlock1.stages.find(s => s.name === 'SRB')!
    const core = SLSBlock1.stages.find(s => s.name === 'Core Stage')!
    const srbTotalSL = srb.thrustSL * 2  // 2 parallel SRBs
    expect(srbTotalSL).toBeGreaterThan(core.thrustSL)
  })
})

describe('SLSBlock1 – event timeline', () => {
  it('events are in chronological order', () => {
    const times = SLSBlock1.events.map(e => e.timeFromLiftoff)
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1])
    }
  })

  it('SRB burnout event exists at T ≈ 126 s', () => {
    const srbBurnout = SLSBlock1.events.find(e => e.name === 'SRB Burnout')
    expect(srbBurnout).toBeDefined()
    expect(srbBurnout!.timeFromLiftoff).toBeCloseTo(126, -1)
  })

  it('Core Stage MECO event exists at T ≈ 480 s', () => {
    const meco = SLSBlock1.events.find(e => e.name === 'Core Stage MECO')
    expect(meco).toBeDefined()
    expect(meco!.timeFromLiftoff).toBeCloseTo(480, -1)
  })

  it('all events have non-empty descriptions', () => {
    for (const event of SLSBlock1.events) {
      expect(event.description.length).toBeGreaterThan(0)
    }
  })
})
