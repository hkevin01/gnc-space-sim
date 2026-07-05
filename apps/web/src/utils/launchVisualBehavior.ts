import { LaunchState } from '@gnc/core'

// Shared scene scale constants; keep aligned with LaunchDemo and SolarSystem.
const KM_PER_SCENE_UNIT = 1_000_000
const EARTH_RADIUS_KM = 6371.0
const MOON_RADIUS_KM = 1737.4
const SIZE_MULT_INNER = 25
const SIZE_MULT_MOON = 25
const EARTH_CENTER_M = 6.371e6
const ROCKET_CORE_LENGTH_FACTOR = 4

export const EARTH_RADIUS_SCENE = (EARTH_RADIUS_KM / KM_PER_SCENE_UNIT) * SIZE_MULT_INNER
export const ROCKET_POS_SCALE = 1e-9
const MOON_RADIUS_SCENE = (MOON_RADIUS_KM / KM_PER_SCENE_UNIT) * SIZE_MULT_MOON
const TARGET_ROCKET_LENGTH_SCENE = MOON_RADIUS_SCENE / 8
export const ROCKET_VISUAL_SCALE = TARGET_ROCKET_LENGTH_SCENE / ROCKET_CORE_LENGTH_FACTOR

export type Vec3 = [number, number, number]

export function rocketScenePositionFromR(
  r: Vec3,
  earthCenterM: number = EARTH_CENTER_M
): Vec3 {
  return [
    (r[0] - earthCenterM) * ROCKET_POS_SCALE + EARTH_RADIUS_SCENE,
    r[1] * ROCKET_POS_SCALE,
    r[2] * ROCKET_POS_SCALE,
  ]
}

export function rocketScenePositionFromState(state: LaunchState): Vec3 {
  return rocketScenePositionFromR(state.r as Vec3)
}

export function isFiniteVec3(v: Vec3): boolean {
  return Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2])
}

export function isValidRocketScenePosition(v: Vec3, maxDistance = 10): boolean {
  if (!isFiniteVec3(v)) return false
  const mag = Math.hypot(v[0], v[1], v[2])
  return mag < maxDistance
}

export function cameraDistanceForAltitudeKm(altitudeKm: number): number {
  if (altitudeKm < 50) return EARTH_RADIUS_SCENE * 0.5
  if (altitudeKm < 200) return EARTH_RADIUS_SCENE * 0.8
  if (altitudeKm < 500) return EARTH_RADIUS_SCENE * 1.5
  if (altitudeKm < 2000) return EARTH_RADIUS_SCENE * 3.0
  return EARTH_RADIUS_SCENE * 6.0
}

export function followCameraTarget(rocketPos: Vec3, altitudeKm: number): {
  distance: number
  position: Vec3
  lookAt: Vec3
} {
  const d = cameraDistanceForAltitudeKm(altitudeKm)
  const position: Vec3 = [
    rocketPos[0] + d * 0.3,
    rocketPos[1] + d * 0.2,
    rocketPos[2] + d,
  ]
  return { distance: d, position, lookAt: rocketPos }
}
