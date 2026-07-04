import {
  GravityTurnGuidance,
  integrateLaunchTrajectory,
  LAUNCH_VEHICLES,
  LaunchPhase,
  LaunchState,
} from '@gnc/core'
import { describe, expect, it } from 'vitest'

import {
  EARTH_RADIUS_SCENE,
  cameraDistanceForAltitudeKm,
  followCameraTarget,
  isFiniteVec3,
  isValidRocketScenePosition,
  rocketScenePositionFromState,
} from '../utils/launchVisualBehavior'

describe('Launch visual behavior harness', () => {
  it('camera distance schedule is monotonic and bounded across key altitude bands', () => {
    const d0 = cameraDistanceForAltitudeKm(0)
    const d1 = cameraDistanceForAltitudeKm(60)
    const d2 = cameraDistanceForAltitudeKm(300)
    const d3 = cameraDistanceForAltitudeKm(1000)
    const d4 = cameraDistanceForAltitudeKm(3000)

    expect(d0).toBeLessThan(d1)
    expect(d1).toBeLessThan(d2)
    expect(d2).toBeLessThan(d3)
    expect(d3).toBeLessThan(d4)

    expect(d0).toBeCloseTo(EARTH_RADIUS_SCENE * 0.5, 10)
    expect(d4).toBeCloseTo(EARTH_RADIUS_SCENE * 6.0, 10)
  })

  it('asserts rocket/camera invariants across simulated mission windows', () => {
    const vehicle = LAUNCH_VEHICLES.FALCON_9
    const guidance = new GravityTurnGuidance(400000, (28.5 * Math.PI) / 180)

    let state: LaunchState = {
      r: [6371000, 0, 0],
      v: [0, 463.8, 0],
      phase: LaunchPhase.PRELAUNCH,
      mission_time: 0,
      altitude: 0,
      velocity_magnitude: 463.8,
      flight_path_angle: Math.PI / 2,
      heading: Math.PI / 2,
      mass:
        vehicle.stage1.mass_dry + vehicle.stage1.mass_propellant +
        vehicle.stage2.mass_dry + vehicle.stage2.mass_propellant +
        vehicle.payload_mass + vehicle.fairing_mass,
      thrust: [0, 0, 0],
      drag: [0, 0, 0],
      atmosphere: { pressure: 101325, density: 1.225, temperature: 288.15 },
      guidance: { pitch_program: Math.PI / 2, yaw_program: Math.PI / 2, throttle: 0 },
    }

    const dt = 0.5
    const windows = [
      { endT: 60 },
      { endT: 300 },
      { endT: 650 },
    ]

    let step = 0
    let prevAlt = 0
    for (const w of windows) {
      while (state.mission_time < w.endT) {
        state = integrateLaunchTrajectory(state, vehicle, guidance, dt)
        step++

        const rocketPos = rocketScenePositionFromState(state)
        expect(isFiniteVec3(rocketPos)).toBe(true)
        expect(isValidRocketScenePosition(rocketPos, 10)).toBe(true)

        const altKm = Math.max(0, state.altitude / 1000)
        const cam = followCameraTarget(rocketPos, altKm)

        expect(Number.isFinite(cam.distance)).toBe(true)
        expect(cam.distance).toBeGreaterThan(0)
        expect(isFiniteVec3(cam.position)).toBe(true)
        expect(isFiniteVec3(cam.lookAt)).toBe(true)

        const separation = Math.hypot(
          cam.position[0] - cam.lookAt[0],
          cam.position[1] - cam.lookAt[1],
          cam.position[2] - cam.lookAt[2],
        )
        expect(separation).toBeGreaterThan(0)

        expect(state.altitude).toBeGreaterThanOrEqual(-1e-6)
        expect(state.mass).toBeGreaterThan(0)

        if (step > 1 && step % 4 === 0) {
          expect(state.altitude + 200).toBeGreaterThanOrEqual(prevAlt)
        }
        prevAlt = state.altitude
      }
    }

    expect(state.mission_time).toBeGreaterThan(600)
    expect(state.velocity_magnitude).toBeGreaterThan(1000)
  })
})
