/**
 * ID: TEST-VEHICLE-001
 * Requirement: Verify VehicleIntegrator correctly tracks mass, thrust,
 *   staging events, and propellant consumption for SLS and generic vehicles.
 * Purpose: Ensure staging logic and mass bookkeeping are correct before
 *   trajectory integration relies on them for mission planning.
 * References: SLS Block 1 Vehicle Configuration; NASA Mass Properties Guidelines.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { VehicleIntegrator, type StageConfig, type StagingEvent } from '../launch/integration'

// Minimal 2-stage vehicle (SRB parallel + core)
const SRB_STAGE: StageConfig = {
  name: 'SRB',
  dryMass: 98000,
  propMass: 628000,
  thrust: 16000000,
  thrustSL: 14700000,
  isp: 269,
  ispSL: 242,
  parallel: true,
}

const CORE_STAGE: StageConfig = {
  name: 'Core Stage',
  dryMass: 85000,
  propMass: 1060000,
  thrust: 8800000,
  thrustSL: 7440000,
  isp: 452,
  ispSL: 366,
  parallel: false,
}

const ICPS_STAGE: StageConfig = {
  name: 'ICPS',
  dryMass: 3490,
  propMass: 26000,
  thrust: 110093,
  thrustSL: 0,
  isp: 465,
  ispSL: 0,
  parallel: false,
}

const PAYLOAD_MASS = 27000 // kg (Orion capsule)

const STAGING_EVENTS: StagingEvent[] = [
  {
    name: 'SRB Separation',
    condition: 'time',
    value: 126,
    jettison: { stageName: 'SRB', mass: 98000 * 2 },
  },
  {
    name: 'Core Stage MECO',
    condition: 'time',
    value: 480,
    jettison: { stageName: 'Core Stage', mass: 85000 },
  },
  {
    name: 'ICPS Ignition',
    condition: 'time',
    value: 485,
    ignition: { stageName: 'ICPS' },
  },
]

describe('VehicleIntegrator – initialisation', () => {
  let integrator: VehicleIntegrator

  beforeEach(() => {
    integrator = new VehicleIntegrator(
      [SRB_STAGE, CORE_STAGE, ICPS_STAGE],
      STAGING_EVENTS,
      PAYLOAD_MASS
    )
  })

  it('reports correct number of active stages at T=0', () => {
    const state = integrator.getState()
    // SRB, Core Stage, and ICPS all start active
    expect(state.activeStages).toHaveLength(3)
  })

  it('initial total mass equals sum of all stage masses + payload', () => {
    const state = integrator.getState()
    const expected =
      (SRB_STAGE.dryMass + SRB_STAGE.propMass) +
      (CORE_STAGE.dryMass + CORE_STAGE.propMass) +
      (ICPS_STAGE.dryMass + ICPS_STAGE.propMass) +
      PAYLOAD_MASS
    expect(state.mass).toBeCloseTo(expected, -2) // within 100 kg
  })

  it('time starts at 0', () => {
    const state = integrator.getState()
    expect(state.time).toBe(0)
  })

  it('altitude starts at 0', () => {
    const state = integrator.getState()
    expect(state.altitude).toBe(0)
  })
})

describe('VehicleIntegrator – SRB staging', () => {
  let integrator: VehicleIntegrator

  beforeEach(() => {
    integrator = new VehicleIntegrator(
      [SRB_STAGE, CORE_STAGE, ICPS_STAGE],
      STAGING_EVENTS,
      PAYLOAD_MASS
    )
  })

  it('SRB is listed as active at T=0', () => {
    expect(integrator.isStageActive('SRB')).toBe(true)
  })

  it('SRB jettisoned after T=126s', () => {
    // Update to time 127 with some altitude/velocity
    integrator.update(127, 50000, 1200)
    expect(integrator.isStageActive('SRB')).toBe(false)
  })

  it('mass decreases after SRB jettison', () => {
    const massBefore = integrator.getState().mass
    integrator.update(127, 50000, 1200)
    const massAfter = integrator.getState().mass
    expect(massAfter).toBeLessThan(massBefore)
  })
})

describe('VehicleIntegrator – Core Stage and ICPS', () => {
  let integrator: VehicleIntegrator

  beforeEach(() => {
    integrator = new VehicleIntegrator(
      [SRB_STAGE, CORE_STAGE, ICPS_STAGE],
      STAGING_EVENTS,
      PAYLOAD_MASS
    )
  })

  it('Core Stage active at T=200', () => {
    integrator.update(200, 100000, 3000)
    expect(integrator.isStageActive('Core Stage')).toBe(true)
  })

  it('Core Stage jettisoned after T=480s', () => {
    integrator.update(481, 185000, 7800)
    expect(integrator.isStageActive('Core Stage')).toBe(false)
  })

  it('ICPS ignites at T=485s', () => {
    integrator.update(486, 185000, 7800)
    expect(integrator.isStageActive('ICPS')).toBe(true)
  })
})

describe('VehicleIntegrator – getState immutability', () => {
  it('getState returns a copy, not a direct reference', () => {
    const integrator = new VehicleIntegrator(
      [SRB_STAGE, CORE_STAGE],
      [],
      PAYLOAD_MASS
    )
    const state1 = integrator.getState()
    const state2 = integrator.getState()
    // Modifying the copy should not affect the integrator
    state1.mass = 0
    expect(integrator.getState().mass).not.toBe(0)
    expect(state2.mass).not.toBe(0)
  })
})

describe('VehicleIntegrator – thrust-to-weight ratio', () => {
  it('T/W > 1 at liftoff (required for ascent)', () => {
    const integrator = new VehicleIntegrator(
      [SRB_STAGE, CORE_STAGE, ICPS_STAGE],
      STAGING_EVENTS,
      PAYLOAD_MASS
    )
    // update(0,0,0) triggers calculateMassAndThrust() so currentState.thrust is initialised
    integrator.update(0, 0, 0)
    const twr = integrator.getThrustToWeight()
    expect(twr).toBeGreaterThan(1.0)
  })
})
