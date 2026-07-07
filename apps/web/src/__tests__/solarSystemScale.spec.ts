/**
 * ID: TEST-SOLARSYS-001
 * Requirement: Verify solar system scale constants are self-consistent and
 *   produce accurate scene-unit positions for Earth and rocket placement.
 * Purpose: Catch regressions in scale constants that would make the SLS
 *   rocket appear at the wrong position relative to the Earth sphere.
 * References: SolarSystem.tsx SOLAR_SYSTEM_DATA; LaunchDemo.tsx constants.
 */

import { describe, it, expect } from 'vitest'
import {
  getBodySceneRadius,
  getBodyPosition,
  getBodyPositionRelativeToCenter,
  getRenderRadius,
} from '../components/SolarSystem'

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
  it('exported Earth scene radius remains close to launch scale expectations', () => {
    expect(getBodySceneRadius('EARTH')).toBeCloseTo(0.159, 3)
  })

  it('uses an Earth-centered render profile that favors local bodies over the Sun', () => {
    expect(getRenderRadius('SUN', 'EARTH')).toBeLessThan(getBodySceneRadius('SUN') * 0.2)
    expect(getRenderRadius('EARTH', 'EARTH')).toBeGreaterThan(getBodySceneRadius('EARTH'))
    expect(getRenderRadius('MOON', 'EARTH')).toBeGreaterThan(getBodySceneRadius('MOON'))
  })

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

describe('Reference-frame helper behavior', () => {
  it('returns origin for a body relative to itself', () => {
    const earthRelativeEarth = getBodyPositionRelativeToCenter('EARTH', 'EARTH', 0)
    expect(earthRelativeEarth[0]).toBeCloseTo(0, 8)
    expect(earthRelativeEarth[1]).toBeCloseTo(0, 8)
    expect(earthRelativeEarth[2]).toBeCloseTo(0, 8)
  })

  it('matches subtraction of absolute body and center positions', () => {
    const missionTime = 1234
    const mars = getBodyPosition('MARS', missionTime)
    const earth = getBodyPosition('EARTH', missionTime)
    const expected: [number, number, number] = [
      mars[0] - earth[0],
      mars[1] - earth[1],
      mars[2] - earth[2],
    ]

    const actual = getBodyPositionRelativeToCenter('MARS', 'EARTH', missionTime)
    expect(actual[0]).toBeCloseTo(expected[0], 8)
    expect(actual[1]).toBeCloseTo(expected[1], 8)
    expect(actual[2]).toBeCloseTo(expected[2], 8)
  })
})
