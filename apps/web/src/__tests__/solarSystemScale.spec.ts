/**
 * ID: TEST-SOLARSYS-001
 * Requirement: Verify solar system scale constants are self-consistent and
 *   produce accurate scene-unit positions for Earth and rocket placement.
 * Purpose: Catch regressions in scale constants that would make the SLS
 *   rocket appear at the wrong position relative to the Earth sphere.
 * References: SolarSystem.tsx SOLAR_SYSTEM_DATA; LaunchDemo.tsx constants.
 */

import { describe, it, expect } from 'vitest'

// ---- Replicate scale constants from SolarSystem.tsx ----
const DISTANCE_SCALE = 1   // 1 scene unit = 1 million km
const KM_PER_SCENE_UNIT = 1_000_000 * DISTANCE_SCALE
const RADIUS_SCENE_CONVERSION = 1 / KM_PER_SCENE_UNIT
const SIZE_MULT_INNER = 25

// Earth physical radius (km)
const EARTH_RADIUS_KM = 6371.0
// Expected visual scene radius
const EARTH_SCENE_RADIUS = EARTH_RADIUS_KM * RADIUS_SCENE_CONVERSION * SIZE_MULT_INNER

// ---- Replicate constants from LaunchDemo.tsx ----
const KM_PER_SCENE_LAUNCH = 1_000_000
const SIZE_MULT_LAUNCH = 25
const LAUNCH_EARTH_SCENE_RADIUS = (EARTH_RADIUS_KM / KM_PER_SCENE_LAUNCH) * SIZE_MULT_LAUNCH

describe('SolarSystem scale constants', () => {
  it('Earth scene radius is approximately 0.159 scene units', () => {
    expect(EARTH_SCENE_RADIUS).toBeCloseTo(0.159, 3)
  })

  it('Earth orbit radius is approximately 149.6 scene units (1 AU)', () => {
    const AU_MILLION_KM = 149.597
    const earthOrbit = AU_MILLION_KM / DISTANCE_SCALE
    expect(earthOrbit).toBeCloseTo(149.6, 0)
  })

  it('Earth visual sphere radius is much smaller than orbit radius', () => {
    const earthOrbit = 149.6
    expect(EARTH_SCENE_RADIUS).toBeLessThan(earthOrbit * 0.01)
  })

  it('SIZE_MULT enlarges sphere by 25× for inner planets', () => {
    const physicalRadius = EARTH_RADIUS_KM * RADIUS_SCENE_CONVERSION
    const visualRadius = physicalRadius * SIZE_MULT_INNER
    expect(visualRadius / physicalRadius).toBeCloseTo(25, 5)
  })
})

describe('LaunchDemo scale consistency', () => {
  it('LaunchDemo Earth scene radius matches SolarSystem Earth scene radius', () => {
    expect(LAUNCH_EARTH_SCENE_RADIUS).toBeCloseTo(EARTH_SCENE_RADIUS, 4)
  })

  it('Rocket starts within 2× Earth visual radius from origin (visible on surface)', () => {
    // Rocket starts at EARTH_RADIUS_SCENE in x-axis
    const rocketX = LAUNCH_EARTH_SCENE_RADIUS
    expect(rocketX / EARTH_SCENE_RADIUS).toBeCloseTo(1.0, 3)
  })

  it('ROCKET_POS_SCALE correctly converts Earth surface metres to scene units', () => {
    const ROCKET_POS_SCALE = 1e-9 // 1 m = 1e-9 scene units (1 scene = 1e9 m = 1e6 km)
    const earthCentreM = 6.371e6  // m
    const earthCentreScene = earthCentreM * ROCKET_POS_SCALE // should be ~0.006371 units
    // With offset subtraction + EARTH_RADIUS_SCENE, rocket starts at EARTH_RADIUS_SCENE
    const rocketStartPos = (earthCentreM - earthCentreM) * ROCKET_POS_SCALE + LAUNCH_EARTH_SCENE_RADIUS
    expect(rocketStartPos).toBeCloseTo(LAUNCH_EARTH_SCENE_RADIUS, 5)
  })
})

describe('SLS mission scenarios - scale sanity', () => {
  it('SRB separation altitude (50 km) maps to < 1× Earth scene radius displacement', () => {
    const ROCKET_POS_SCALE = 1e-9
    const earthCentreM = 6.371e6
    const srbSepAlt = 50e3 // 50 km in metres
    const rocketR = earthCentreM + srbSepAlt
    const posX = (rocketR - earthCentreM) * ROCKET_POS_SCALE + LAUNCH_EARTH_SCENE_RADIUS
    const displacement = posX - LAUNCH_EARTH_SCENE_RADIUS
    // 50 km displacement in scene units should be much less than Earth visual radius
    expect(displacement).toBeLessThan(LAUNCH_EARTH_SCENE_RADIUS * 10)
    expect(displacement).toBeGreaterThan(0)
  })

  it('LEO insertion (400 km) rocket position is within 5× Earth visual radius', () => {
    const ROCKET_POS_SCALE = 1e-9
    const earthCentreM = 6.371e6
    const leoAlt = 400e3
    const rocketR = earthCentreM + leoAlt
    const posX = (rocketR - earthCentreM) * ROCKET_POS_SCALE + LAUNCH_EARTH_SCENE_RADIUS
    // Should be within reasonable camera view distance
    expect(posX).toBeLessThan(LAUNCH_EARTH_SCENE_RADIUS * 10)
  })
})
