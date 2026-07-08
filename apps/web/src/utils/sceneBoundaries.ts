import {
  getBodyPositionRelativeToCenter,
  getRenderRadius,
  type SolarBodyName,
} from '../components/SolarSystem'
import { ROCKET_VISUAL_SCALE, type Vec3 } from './launchVisualBehavior'

export interface SceneBodyBoundary {
  name: SolarBodyName
  center: Vec3
  radius: number
  hardRadius: number
  softCorridorRadius: number
  altitudeFloorRadius: number
}

export interface BoundaryConstraintEvent {
  body: SolarBodyName
  type: 'hard-surface' | 'soft-corridor' | 'altitude-floor'
  penetration: number
  distanceBefore: number
  distanceAfter: number
}

export interface BoundaryConstraintResult {
  point: Vec3
  nearestBody: SolarBodyName
  nearestDistance: number
  clearanceMargin: number
  events: BoundaryConstraintEvent[]
}

interface BoundaryProfile {
  hardClearance: number
  softCorridor: number
  altitudeFloor: number
}

const DEFAULT_BOUNDARY_BODIES: SolarBodyName[] = ['EARTH', 'MOON', 'MARS', 'JUPITER']

const DEFAULT_BOUNDARY_PROFILE: Record<SolarBodyName, BoundaryProfile> = {
  SUN: {
    hardClearance: ROCKET_VISUAL_SCALE * 0.8,
    softCorridor: ROCKET_VISUAL_SCALE * 8,
    altitudeFloor: ROCKET_VISUAL_SCALE * 10,
  },
  MERCURY: {
    hardClearance: ROCKET_VISUAL_SCALE * 0.6,
    softCorridor: ROCKET_VISUAL_SCALE * 5,
    altitudeFloor: ROCKET_VISUAL_SCALE * 6,
  },
  VENUS: {
    hardClearance: ROCKET_VISUAL_SCALE * 0.6,
    softCorridor: ROCKET_VISUAL_SCALE * 5,
    altitudeFloor: ROCKET_VISUAL_SCALE * 7,
  },
  EARTH: {
    hardClearance: ROCKET_VISUAL_SCALE * 0.65,
    softCorridor: ROCKET_VISUAL_SCALE * 12,
    altitudeFloor: ROCKET_VISUAL_SCALE * 18,
  },
  MOON: {
    hardClearance: ROCKET_VISUAL_SCALE * 0.55,
    softCorridor: ROCKET_VISUAL_SCALE * 7,
    altitudeFloor: ROCKET_VISUAL_SCALE * 12,
  },
  MARS: {
    hardClearance: ROCKET_VISUAL_SCALE * 0.6,
    softCorridor: ROCKET_VISUAL_SCALE * 8,
    altitudeFloor: ROCKET_VISUAL_SCALE * 14,
  },
  JUPITER: {
    hardClearance: ROCKET_VISUAL_SCALE * 1.4,
    softCorridor: ROCKET_VISUAL_SCALE * 18,
    altitudeFloor: ROCKET_VISUAL_SCALE * 24,
  },
  SATURN: {
    hardClearance: ROCKET_VISUAL_SCALE * 1.2,
    softCorridor: ROCKET_VISUAL_SCALE * 16,
    altitudeFloor: ROCKET_VISUAL_SCALE * 22,
  },
  URANUS: {
    hardClearance: ROCKET_VISUAL_SCALE * 1.1,
    softCorridor: ROCKET_VISUAL_SCALE * 14,
    altitudeFloor: ROCKET_VISUAL_SCALE * 20,
  },
  NEPTUNE: {
    hardClearance: ROCKET_VISUAL_SCALE * 1.1,
    softCorridor: ROCKET_VISUAL_SCALE * 14,
    altitudeFloor: ROCKET_VISUAL_SCALE * 20,
  },
}

function vectorFrom(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function norm(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2])
}

function normalize(v: Vec3): Vec3 {
  const magnitude = norm(v)
  if (magnitude < 1e-9) return [1, 0, 0]
  return [v[0] / magnitude, v[1] / magnitude, v[2] / magnitude]
}

function moveAlong(center: Vec3, direction: Vec3, distance: number): Vec3 {
  return [
    center[0] + direction[0] * distance,
    center[1] + direction[1] * distance,
    center[2] + direction[2] * distance,
  ]
}

function clampWithEvent(
  point: Vec3,
  boundary: SceneBodyBoundary,
  threshold: number,
  type: BoundaryConstraintEvent['type'],
): { point: Vec3; event?: BoundaryConstraintEvent } {
  const delta = vectorFrom(point, boundary.center)
  const distanceBefore = norm(delta)

  if (distanceBefore >= threshold) {
    return { point }
  }

  const direction = normalize(delta)
  const nextPoint = moveAlong(boundary.center, direction, threshold)
  const distanceAfter = norm(vectorFrom(nextPoint, boundary.center))

  return {
    point: nextPoint,
    event: {
      body: boundary.name,
      type,
      penetration: threshold - distanceBefore,
      distanceBefore,
      distanceAfter,
    },
  }
}

export function buildSceneBodyBoundaries(
  missionTime: number,
  centerOn: 'SUN' | 'EARTH' | 'MOON' = 'EARTH',
  bodyNames: SolarBodyName[] = DEFAULT_BOUNDARY_BODIES,
  clearanceScene: number = ROCKET_VISUAL_SCALE * 0.65,
): SceneBodyBoundary[] {
  return bodyNames.map((name) => ({
    ...(() => {
      const profile = DEFAULT_BOUNDARY_PROFILE[name]
      const baseRadius = getRenderRadius(name, centerOn)
      const center = name === centerOn
        ? ([0, 0, 0] as Vec3)
        : getBodyPositionRelativeToCenter(name, centerOn, missionTime)

      const hardRadius = baseRadius + Math.max(clearanceScene, profile.hardClearance)
      return {
        name,
        center,
        hardRadius,
        softCorridorRadius: hardRadius + profile.softCorridor,
        altitudeFloorRadius: hardRadius + profile.altitudeFloor,
        // Preserve the legacy field for existing callers/tests.
        radius: hardRadius,
      }
    })(),
  }))
}

export function constrainPointToBoundariesDetailed(
  point: Vec3,
  boundaries: SceneBodyBoundary[],
): BoundaryConstraintResult {
  let candidate = point
  const events: BoundaryConstraintEvent[] = []

  for (const boundary of boundaries) {
    const hard = clampWithEvent(candidate, boundary, boundary.hardRadius, 'hard-surface')
    candidate = hard.point
    if (hard.event) {
      events.push(hard.event)
      continue
    }

    const floor = clampWithEvent(candidate, boundary, boundary.altitudeFloorRadius, 'altitude-floor')
    candidate = floor.point
    if (floor.event) {
      events.push(floor.event)
      continue
    }

    const soft = clampWithEvent(candidate, boundary, boundary.softCorridorRadius, 'soft-corridor')
    candidate = soft.point
    if (soft.event) {
      events.push({
        ...soft.event,
        penetration: soft.event.penetration * 0.35,
      })
      const pullBackDistance = soft.event.distanceBefore + (soft.event.penetration * 0.35)
      const direction = normalize(vectorFrom(candidate, boundary.center))
      candidate = moveAlong(boundary.center, direction, pullBackDistance)
    }
  }

  let nearestBody = boundaries[0]?.name ?? 'EARTH'
  let nearestDistance = Number.POSITIVE_INFINITY
  let clearanceMargin = Number.POSITIVE_INFINITY

  for (const boundary of boundaries) {
    const distance = norm(vectorFrom(candidate, boundary.center))
    const margin = distance - boundary.hardRadius
    if (margin < clearanceMargin) {
      nearestBody = boundary.name
      nearestDistance = distance
      clearanceMargin = margin
    }
  }

  return {
    point: candidate,
    nearestBody,
    nearestDistance,
    clearanceMargin,
    events,
  }
}

export function constrainPointToBoundaries(
  point: Vec3,
  boundaries: SceneBodyBoundary[],
): Vec3 {
  return constrainPointToBoundariesDetailed(point, boundaries).point
}
