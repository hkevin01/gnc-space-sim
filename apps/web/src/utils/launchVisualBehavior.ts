import { LaunchState } from '@gnc/core'

// Shared scene scale constants; keep aligned with LaunchDemo and SolarSystem.
const KM_PER_SCENE_UNIT = 1_000_000
const EARTH_RADIUS_KM = 6371.0
const MOON_RADIUS_KM = 1737.4
const SIZE_MULT_INNER = 25
const SIZE_MULT_MOON = 25
const EARTH_CENTER_M = 6.371e6
const ROCKET_CORE_LENGTH_FACTOR = 4
const CAPE_CANAVERAL_LAT_DEG = 28.3922
const CAPE_CANAVERAL_LON_DEG = -80.6077
const EARTH_AXIAL_TILT_DEG = 23.44
const EARTH_ROTATION_PERIOD_HOURS = 23.9345

export const EARTH_RADIUS_SCENE = (EARTH_RADIUS_KM / KM_PER_SCENE_UNIT) * SIZE_MULT_INNER
export const ROCKET_POS_SCALE = 1e-9
const MOON_RADIUS_SCENE = (MOON_RADIUS_KM / KM_PER_SCENE_UNIT) * SIZE_MULT_MOON
const TARGET_ROCKET_LENGTH_SCENE = MOON_RADIUS_SCENE / 8
export const ROCKET_VISUAL_SCALE = TARGET_ROCKET_LENGTH_SCENE / ROCKET_CORE_LENGTH_FACTOR
export const ROCKET_SURFACE_CLEARANCE_SCENE = ROCKET_VISUAL_SCALE * 2.9

export type Vec3 = [number, number, number]

function normalize(v: Vec3): Vec3 {
  const mag = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / mag, v[1] / mag, v[2] / mag]
}

function scale(v: Vec3, factor: number): Vec3 {
  return [v[0] * factor, v[1] * factor, v[2] * factor]
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function rotateAroundY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    v[0] * cos + v[2] * sin,
    v[1],
    -v[0] * sin + v[2] * cos,
  ]
}

function rotateAroundZ(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    v[0] * cos - v[1] * sin,
    v[0] * sin + v[1] * cos,
    v[2],
  ]
}

const CAPE_LAT_RAD = (CAPE_CANAVERAL_LAT_DEG * Math.PI) / 180
const CAPE_LON_RAD = (CAPE_CANAVERAL_LON_DEG * Math.PI) / 180

export const CAPE_CANAVERAL_UP: Vec3 = normalize([
  Math.cos(CAPE_LAT_RAD) * Math.cos(CAPE_LON_RAD),
  Math.sin(CAPE_LAT_RAD),
  Math.cos(CAPE_LAT_RAD) * Math.sin(CAPE_LON_RAD),
])

export const CAPE_CANAVERAL_EAST: Vec3 = normalize([
  -Math.sin(CAPE_LON_RAD),
  0,
  Math.cos(CAPE_LON_RAD),
])

export const CAPE_CANAVERAL_NORTH: Vec3 = normalize([
  -Math.sin(CAPE_LAT_RAD) * Math.cos(CAPE_LON_RAD),
  Math.cos(CAPE_LAT_RAD),
  -Math.sin(CAPE_LAT_RAD) * Math.sin(CAPE_LON_RAD),
])

export const CAPE_CANAVERAL_SURFACE_POSITION: Vec3 = scale(CAPE_CANAVERAL_UP, EARTH_RADIUS_SCENE)

export function getEarthRotationAngle(missionTime: number): number {
  const timeInHours = missionTime * 0.01 * 24
  return (timeInHours / EARTH_ROTATION_PERIOD_HOURS) * 2 * Math.PI
}

function orientEarthVector(v: Vec3, missionTime: number): Vec3 {
  const rotated = rotateAroundY(v, getEarthRotationAngle(missionTime))
  return rotateAroundZ(rotated, (EARTH_AXIAL_TILT_DEG * Math.PI) / 180)
}

export function getCapeCanaveralWorldFrame(missionTime: number): {
  surface: Vec3
  up: Vec3
  east: Vec3
  north: Vec3
} {
  const up = normalize(orientEarthVector(CAPE_CANAVERAL_UP, missionTime))
  const east = normalize(orientEarthVector(CAPE_CANAVERAL_EAST, missionTime))
  const north = normalize(orientEarthVector(CAPE_CANAVERAL_NORTH, missionTime))
  return {
    surface: scale(up, EARTH_RADIUS_SCENE),
    up,
    east,
    north,
  }
}

export function launchSiteScenePositionFromLocalFrame(
  radialOffsetScene: number,
  eastOffsetScene: number,
  northOffsetScene: number,
  missionTime: number = 0,
): Vec3 {
  const frame = getCapeCanaveralWorldFrame(missionTime)
  const surface = scale(frame.up, EARTH_RADIUS_SCENE + radialOffsetScene)
  const east = scale(frame.east, eastOffsetScene)
  const north = scale(frame.north, northOffsetScene)
  return add(add(surface, east), north)
}

export function launchSiteSceneVectorFromLocalFrame(
  radialScene: number,
  eastScene: number,
  northScene: number,
  missionTime: number = 0,
): Vec3 {
  const frame = getCapeCanaveralWorldFrame(missionTime)
  return add(
    add(scale(frame.up, radialScene), scale(frame.east, eastScene)),
    scale(frame.north, northScene),
  )
}

export function rocketScenePositionFromR(
  r: Vec3,
  earthCenterM: number = EARTH_CENTER_M,
  missionTime: number = 0,
): Vec3 {
  const radialOffset = Math.max((r[0] - earthCenterM) * ROCKET_POS_SCALE, ROCKET_SURFACE_CLEARANCE_SCENE)
  return launchSiteScenePositionFromLocalFrame(
    radialOffset,
    r[1] * ROCKET_POS_SCALE,
    r[2] * ROCKET_POS_SCALE,
    missionTime,
  )
}

export function rocketScenePositionFromState(state: LaunchState): Vec3 {
  return rocketScenePositionFromR(state.r as Vec3, EARTH_CENTER_M, state.mission_time)
}

export function isFiniteVec3(v: Vec3): boolean {
  return Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2])
}

export function isValidRocketScenePosition(v: Vec3, maxDistance = 10): boolean {
  if (!isFiniteVec3(v)) return false
  const mag = Math.hypot(v[0], v[1], v[2])
  return mag < maxDistance
}

export function clampPointOutsideSphere(point: Vec3, center: Vec3, minimumDistance: number): Vec3 {
  const delta = subtract(point, center)
  const distance = Math.hypot(delta[0], delta[1], delta[2])

  if (distance >= minimumDistance) return point

  const direction = distance > 1e-9 ? normalize(delta) : [1, 0, 0] as Vec3
  return add(center, scale(direction, minimumDistance))
}

export function cameraDistanceForAltitudeKm(altitudeKm: number): number {
  if (altitudeKm < 50) return EARTH_RADIUS_SCENE * 0.34
  if (altitudeKm < 200) return EARTH_RADIUS_SCENE * 0.5
  if (altitudeKm < 500) return EARTH_RADIUS_SCENE * 0.85
  if (altitudeKm < 2000) return EARTH_RADIUS_SCENE * 1.6
  return EARTH_RADIUS_SCENE * 3.2
}

export function followCameraTarget(
  rocketPos: Vec3,
  altitudeKm: number,
  missionTime: number = 0,
): {
  distance: number
  position: Vec3
  lookAt: Vec3
} {
  const d = cameraDistanceForAltitudeKm(altitudeKm)
  const frame = getCapeCanaveralWorldFrame(missionTime)
  const position = add(
    add(
      add(rocketPos, scale(frame.east, d * 0.48)),
      scale(frame.north, d * 0.1),
    ),
    scale(frame.up, d * 0.22),
  )
  return { distance: d, position, lookAt: rocketPos }
}

export function applyBoundaryAwareCameraFraming(
  desiredCameraPos: Vec3,
  protectedCenter: Vec3,
  protectedRadius: number,
  minimumOffset: number = ROCKET_VISUAL_SCALE * 14,
): Vec3 {
  const delta = subtract(desiredCameraPos, protectedCenter)
  const distance = Math.hypot(delta[0], delta[1], delta[2])
  const requiredDistance = protectedRadius + minimumOffset

  if (distance >= requiredDistance) {
    return desiredCameraPos
  }

  const direction = distance > 1e-9 ? normalize(delta) : [1, 0, 0] as Vec3
  return add(protectedCenter, scale(direction, requiredDistance))
}
