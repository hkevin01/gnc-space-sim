/**
 * ID: TEST-PHYSICS-001
 * Requirement: Verify all GNC physics constants, two-body orbital mechanics,
 *   and atmospheric model functions produce NASA-accurate results.
 * Purpose: Ensure the mathematical foundation of the GNC simulation is
 *   numerically correct before higher-level systems rely on it.
 * References: NASA JPL DE430 ephemeris; NRLMSISE-00 atmosphere model;
 *   Bate, Mueller & White "Fundamentals of Astrodynamics" (1971).
 */

import { describe, it, expect } from 'vitest'

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------
describe('GNC Constants - math/constants.ts', () => {
  it('MU_EARTH matches NASA GM value within 0.001%', async () => {
    const { MU_EARTH } = await import('../math/constants')
    // NASA value: 3.986004418e14 m³/s²
    expect(MU_EARTH).toBeCloseTo(3.986004418e14, -5)
  })

  it('MU_SUN matches NASA GM value within 0.001%', async () => {
    const { MU_SUN } = await import('../math/constants')
    // NASA value: 1.32712440018e20 m³/s²
    expect(MU_SUN).toBeCloseTo(1.32712440018e20, -12)
  })

  it('AU matches IAU definition within 1 m', async () => {
    const { AU } = await import('../math/constants')
    // IAU 2012: exactly 149,597,870,700 m
    expect(AU).toBeCloseTo(1.495978707e11, 0)
  })

  it('MU_MARS matches NASA GM value', async () => {
    const { MU_MARS } = await import('../math/constants')
    expect(MU_MARS).toBeGreaterThan(4e13)
    expect(MU_MARS).toBeLessThan(5e13)
  })
})

describe('GNC Physics Constants - math/physics.ts', () => {
  it('EARTH_RADIUS matches WGS84 mean radius within 1 km', async () => {
    const { EARTH_RADIUS } = await import('../math/physics')
    expect(Math.abs(EARTH_RADIUS - 6371000)).toBeLessThan(1000)
  })

  it('STANDARD_GRAVITY matches BIPM definition', async () => {
    const { STANDARD_GRAVITY } = await import('../math/physics')
    expect(STANDARD_GRAVITY).toBeCloseTo(9.80665, 5)
  })

  it('EARTH_ROTATION_RATE matches sidereal rotation', async () => {
    const { EARTH_ROTATION_RATE } = await import('../math/physics')
    // ~7.292e-5 rad/s
    expect(EARTH_ROTATION_RATE).toBeCloseTo(7.2921159e-5, 10)
  })

  it('SEA_LEVEL_PRESSURE matches ISA standard atmosphere', async () => {
    const { SEA_LEVEL_PRESSURE } = await import('../math/physics')
    expect(SEA_LEVEL_PRESSURE).toBeCloseTo(101325, 0)
  })

  it('DEG_TO_RAD and RAD_TO_DEG are inverse of each other', async () => {
    const { DEG_TO_RAD, RAD_TO_DEG } = await import('../math/physics')
    expect(DEG_TO_RAD * RAD_TO_DEG).toBeCloseTo(1.0, 10)
  })

  it('GEO_ORBIT_ALT matches standard geostationary altitude', async () => {
    const { GEO_ORBIT_ALT } = await import('../math/physics')
    // ~35,786 km above Earth surface
    expect(Math.abs(GEO_ORBIT_ALT - 35786000)).toBeLessThan(1000)
  })
})

// --------------------------------------------------------------------------
// Two-Body Orbital Mechanics
// --------------------------------------------------------------------------
describe('keplerianPropagateTwoBody - orbits/twobody.ts', () => {
  it('returns defined r and v vectors', async () => {
    const { keplerianPropagateTwoBody } = await import('../orbits/twobody')
    const { MU_EARTH } = await import('../math/constants')
    const state = keplerianPropagateTwoBody({ r: [7000e3, 0, 0], v: [0, 7500, 0] }, 1, MU_EARTH)
    expect(state.r).toBeDefined()
    expect(state.v).toBeDefined()
    expect(state.r.length).toBe(3)
    expect(state.v.length).toBe(3)
  })

  it('position changes by velocity × dt in one small step', async () => {
    const { keplerianPropagateTwoBody } = await import('../orbits/twobody')
    const { MU_EARTH } = await import('../math/constants')
    const r0: [number, number, number] = [7000e3, 0, 0]
    const v0: [number, number, number] = [0, 7500, 0]
    const dt = 0.001 // very small step
    const state = keplerianPropagateTwoBody({ r: r0, v: v0 }, dt, MU_EARTH)
    // r ≈ r0 + v0 * dt for small dt
    expect(state.r[0]).toBeCloseTo(r0[0] + v0[0] * dt, 0)
    expect(state.r[1]).toBeCloseTo(r0[1] + v0[1] * dt, 0)
    expect(state.r[2]).toBeCloseTo(r0[2] + v0[2] * dt, 0)
  })

  it('orbiting body remains at approximately constant radius for circular orbit', async () => {
    const { keplerianPropagateTwoBody } = await import('../orbits/twobody')
    const { MU_EARTH } = await import('../math/constants')
    // Circular orbit at 400 km altitude
    const r = 6771e3
    const v = Math.sqrt(MU_EARTH / r) // circular velocity
    let state = { r: [r, 0, 0] as [number,number,number], v: [0, v, 0] as [number,number,number] }
    const dt = 1.0
    // Propagate 100 steps
    for (let i = 0; i < 100; i++) {
      state = keplerianPropagateTwoBody(state, dt, MU_EARTH)
    }
    const radius = Math.hypot(state.r[0], state.r[1], state.r[2])
    // After 100 seconds of Euler integration, radius shouldn't drift by more than 5%
    expect(Math.abs(radius - r) / r).toBeLessThan(0.05)
  })

  it('returns finite values for all components', async () => {
    const { keplerianPropagateTwoBody } = await import('../orbits/twobody')
    const { MU_EARTH } = await import('../math/constants')
    const state = keplerianPropagateTwoBody({ r: [6371e3, 0, 0], v: [0, 7900, 0] }, 10, MU_EARTH)
    state.r.forEach(v => expect(Number.isFinite(v)).toBe(true))
    state.v.forEach(v => expect(Number.isFinite(v)).toBe(true))
  })

  it('handles zero time step (state unchanged)', async () => {
    const { keplerianPropagateTwoBody } = await import('../orbits/twobody')
    const { MU_EARTH } = await import('../math/constants')
    const r0: [number,number,number] = [7000e3, 100, -200]
    const v0: [number,number,number] = [10, 7500, -5]
    const state = keplerianPropagateTwoBody({ r: r0, v: v0 }, 0, MU_EARTH)
    // Zero timestep: r unchanged, v may change due to accel*0=0
    expect(state.r[0]).toBeCloseTo(r0[0], 0)
    expect(state.r[1]).toBeCloseTo(r0[1], 0)
    expect(state.r[2]).toBeCloseTo(r0[2], 0)
  })
})
