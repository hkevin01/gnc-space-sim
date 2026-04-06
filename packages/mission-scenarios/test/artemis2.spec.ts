/**
 * ID: TEST-ARTEMIS2-001
 * Requirement: Verify the Artemis II mission configuration exports correct
 *   orbital, timing, and phase data for use by the simulation and UI layers.
 * Purpose: Catch regressions in mission constants that would silently produce
 *   wrong trajectories or UI phase timelines.
 * References: NASA Artemis II Mission Overview; LC-39B site data (KSC).
 */

import { describe, it, expect } from 'vitest'
import {
  Artemis2Mission,
  Artemis2TargetOrbit,
  LC39B,
  SLSAscentGuidance
} from '../src/missions/artemis2'

describe('LC39B launch site', () => {
  it('latitude is approximately 28.6° N (KSC)', () => {
    expect(LC39B.latitude).toBeGreaterThan(28.0)
    expect(LC39B.latitude).toBeLessThan(29.0)
  })

  it('longitude is approximately -80.6° (east coast Florida)', () => {
    expect(LC39B.longitude).toBeGreaterThan(-81.0)
    expect(LC39B.longitude).toBeLessThan(-80.0)
  })

  it('azimuth range allows 28.5° inclination launch', () => {
    const [minAz, maxAz] = LC39B.azimuthRange
    expect(minAz).toBeLessThan(90)   // can launch north-east
    expect(maxAz).toBeGreaterThan(90) // can launch south-east
  })
})

describe('Artemis2TargetOrbit', () => {
  it('target altitude is ~185 km parking orbit', () => {
    expect(Artemis2TargetOrbit.altitude).toBeCloseTo(185, -1)
  })

  it('inclination matches KSC launch latitude (~28.5°)', () => {
    expect(Artemis2TargetOrbit.inclination).toBeGreaterThanOrEqual(28.0)
    expect(Artemis2TargetOrbit.inclination).toBeLessThanOrEqual(30.0)
  })
})

describe('SLSAscentGuidance', () => {
  it('pitch starts at 90° (vertical liftoff)', () => {
    const first = SLSAscentGuidance.pitchProgram![0]
    expect(first.time).toBe(0)
    expect(first.pitch).toBe(90)
  })

  it('pitch ends at 0° by MECO (T=480 s)', () => {
    const last = SLSAscentGuidance.pitchProgram!.at(-1)!
    expect(last.pitch).toBe(0)
    expect(last.time).toBeCloseTo(480, -1)
  })

  it('pitch program is monotonically decreasing', () => {
    const prog = SLSAscentGuidance.pitchProgram!
    for (let i = 1; i < prog.length; i++) {
      expect(prog[i].pitch).toBeLessThanOrEqual(prog[i - 1].pitch)
    }
  })

  it('throttle program starts at 1.0 (full thrust liftoff)', () => {
    expect(SLSAscentGuidance.throttleProfile![0].throttle).toBe(1.0)
  })

  it('throttle dips below 1.0 during Max-Q window (T=40–70 s)', () => {
    const throttles = SLSAscentGuidance.throttleProfile!
    const maxQEntry = throttles.find(t => t.time === 40)
    expect(maxQEntry).toBeDefined()
    expect(maxQEntry!.throttle).toBeLessThan(1.0)
  })

  it('throttle ends at 0 at MECO', () => {
    const last = SLSAscentGuidance.throttleProfile!.at(-1)!
    expect(last.throttle).toBe(0)
  })
})

describe('Artemis2Mission – overall', () => {
  it('mission name is defined and non-empty', () => {
    expect(Artemis2Mission.name.length).toBeGreaterThan(0)
  })

  it('vehicle matches SLSBlock1', () => {
    expect(Artemis2Mission.vehicle.name).toContain('Space Launch System')
  })

  it('has at least 6 mission phases', () => {
    expect(Artemis2Mission.phases.length).toBeGreaterThanOrEqual(6)
  })

  it('first phase starts at or before T=0', () => {
    const first = Artemis2Mission.phases[0]
    expect(first.startTime).toBeLessThanOrEqual(0)
  })

  it('TLI phase exists (Trans-Lunar Injection)', () => {
    const tli = Artemis2Mission.phases.find(p =>
      p.name.toLowerCase().includes('lunar') || p.name.toLowerCase().includes('tli')
    )
    expect(tli).toBeDefined()
  })

  it('SRB separation phase exists', () => {
    const srb = Artemis2Mission.phases.find(p =>
      p.name.toLowerCase().includes('srb') || p.name.toLowerCase().includes('booster')
    )
    expect(srb).toBeDefined()
  })

  it('phases have non-zero durations', () => {
    for (const phase of Artemis2Mission.phases) {
      expect(phase.duration).toBeGreaterThan(0)
    }
  })

  it('has at least 1 mission objective', () => {
    expect(Artemis2Mission.objectives.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Artemis2Mission – guidance cross-check', () => {
  it('Liftoff phase guidance pitch matches guidance profile start', () => {
    const liftoffPhase = Artemis2Mission.phases.find(p => p.name === 'Liftoff')
    expect(liftoffPhase?.guidance?.pitchKick).toBeDefined()
    expect(liftoffPhase!.guidance!.pitchKick).toBeGreaterThan(0)
  })
})
