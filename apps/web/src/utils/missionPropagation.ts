import type { CompressedMissionPhase } from './missionTimeline'
import type { SceneBodyBoundary } from './sceneBoundaries'
import { constrainPointToBoundariesDetailed } from './sceneBoundaries'
import {
  getBodyPositionRelativeToCenter,
  getBodySceneRadius,
  type SolarBodyName,
} from '../components/SolarSystem'
import type { Vec3 } from './launchVisualBehavior'

export type MissionSoiOwner = 'EARTH' | 'MOON' | 'MARS'

export type MissionTrailSegment =
  | 'launch'
  | 'outbound'
  | 'operations'
  | 'return'
  | 'cruise'
  | 'arrival'

export interface MissionTelemetrySnapshot {
  nearestBody: SolarBodyName
  nearestDistance: number
  clearanceMargin: number
  soiOwner: MissionSoiOwner
  soiTransition: {
    from: MissionSoiOwner
    to: MissionSoiOwner
    missionTime: number
  } | null
  boundaryEvents: Array<{
    body: SolarBodyName
    type: 'hard-surface' | 'soft-corridor' | 'altitude-floor'
    penetration: number
  }>
}

export interface PropagatedMissionVehicle {
  position: Vec3
  velocity: Vec3
  trailSegment: MissionTrailSegment
  telemetry: MissionTelemetrySnapshot
}

interface PropagationInput {
  selectedMission?: string
  missionTime: number
  activePhase: (CompressedMissionPhase & { progress: number }) | null
  boundaries: SceneBodyBoundary[]
  previousPosition?: Vec3
  previousSoiOwner?: MissionSoiOwner
  dt: number
}

const SOI_FACTORS: Record<MissionSoiOwner, number> = {
  EARTH: 12,
  MOON: 9,
  MARS: 10,
}

function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

function bezierQuadratic(a: Vec3, b: Vec3, c: Vec3, t: number): Vec3 {
  const ab = lerp(a, b, t)
  const bc = lerp(b, c, t)
  return lerp(ab, bc, t)
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function scale(v: Vec3, factor: number): Vec3 {
  return [v[0] * factor, v[1] * factor, v[2] * factor]
}

function normalize(v: Vec3): Vec3 {
  const magnitude = Math.hypot(v[0], v[1], v[2])
  if (magnitude < 1e-9) return [1, 0, 0]
  return [v[0] / magnitude, v[1] / magnitude, v[2] / magnitude]
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

function buildLunarPosition(activePhase: (CompressedMissionPhase & { progress: number }) | null): { position: Vec3; segment: MissionTrailSegment } {
  const earth: Vec3 = [0, 0, 0]
  const earthRadius = getBodySceneRadius('EARTH')
  const moonPos = getBodyPositionRelativeToCenter('MOON', 'EARTH', 0)
  const moonRadius = getBodySceneRadius('MOON')

  const departure = [earthRadius * 3.2, 0.02, earthRadius * 0.4] as Vec3
  const moonApproachDir = normalize(subtract(moonPos, earth))
  const moonApproach = subtract(moonPos, scale(moonApproachDir, moonRadius * 4.5)) as Vec3
  const outboundControl = [moonPos[0] * 0.45, 0.2, moonPos[2] * 0.2] as Vec3
  const returnControl = [moonPos[0] * 0.55, -0.22, -moonPos[2] * 0.22] as Vec3
  const earthReturn = [earthRadius * 2.8, -0.03, -earthRadius * 0.5] as Vec3

  if (!activePhase) {
    return { position: departure, segment: 'launch' }
  }

  if (activePhase.name === 'Trans-Lunar Injection' || activePhase.name === 'Lunar Transit') {
    const transitProgress = activePhase.name === 'Trans-Lunar Injection'
      ? activePhase.progress * 0.28
      : 0.28 + (activePhase.progress * 0.72)
    return {
      position: bezierQuadratic(departure, outboundControl, moonApproach, Math.min(Math.max(transitProgress, 0), 1)),
      segment: 'outbound',
    }
  }

  if (activePhase.name === 'Lunar Operations') {
    const angle = activePhase.progress * Math.PI * 2
    const opsRadius = moonRadius * 3.6
    return {
      position: [
        moonPos[0] + Math.cos(angle) * opsRadius,
        moonPos[1] + Math.sin(angle) * opsRadius * 0.24,
        moonPos[2] + Math.sin(angle) * opsRadius,
      ],
      segment: 'operations',
    }
  }

  return {
    position: bezierQuadratic(moonApproach, returnControl, earthReturn, activePhase.progress),
    segment: 'return',
  }
}

function buildMarsPosition(activePhase: (CompressedMissionPhase & { progress: number }) | null, missionTime: number): { position: Vec3; segment: MissionTrailSegment } {
  const earthRadius = getBodySceneRadius('EARTH')
  const marsPos = getBodyPositionRelativeToCenter('MARS', 'EARTH', missionTime)
  const marsRadius = getBodySceneRadius('MARS')

  const departure = [earthRadius * 3.4, 0.03, earthRadius * 0.4] as Vec3
  const transitControl = [marsPos[0] * 0.38, 0.42, marsPos[2] * 0.32] as Vec3
  const marsApproachDir = normalize(marsPos)
  const marsApproach = subtract(marsPos, scale(marsApproachDir, marsRadius * 5.5)) as Vec3

  if (!activePhase) {
    return { position: departure, segment: 'launch' }
  }

  if (activePhase.name === 'Earth Departure') {
    return {
      position: bezierQuadratic([earthRadius * 2.4, 0, 0], [earthRadius * 2.9, 0.06, earthRadius * 0.7], departure, activePhase.progress),
      segment: 'outbound',
    }
  }

  if (activePhase.name === 'Interplanetary Cruise') {
    return {
      position: bezierQuadratic(departure, transitControl, marsApproach, activePhase.progress),
      segment: 'cruise',
    }
  }

  const angle = activePhase.progress * Math.PI * 2
  const arrivalRadius = marsRadius * 4.8
  return {
    position: [
      marsPos[0] + Math.cos(angle) * arrivalRadius,
      marsPos[1] + Math.sin(angle) * arrivalRadius * 0.2,
      marsPos[2] + Math.sin(angle) * arrivalRadius,
    ],
    segment: 'arrival',
  }
}

function buildEarthOrbitPosition(activePhase: (CompressedMissionPhase & { progress: number }) | null): { position: Vec3; segment: MissionTrailSegment } {
  const earthRadius = getBodySceneRadius('EARTH')
  const phaseProgress = activePhase?.progress ?? 0
  const angle = phaseProgress * Math.PI * 2
  const orbitRadius = earthRadius * 3.4
  return {
    position: [Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius * 0.1, Math.sin(angle) * orbitRadius],
    segment: 'operations',
  }
}

export function resolveSoiOwner(position: Vec3, missionTime: number, previousOwner: MissionSoiOwner = 'EARTH'): MissionSoiOwner {
  const earthPos: Vec3 = [0, 0, 0]
  const moonPos = getBodyPositionRelativeToCenter('MOON', 'EARTH', missionTime)
  const marsPos = getBodyPositionRelativeToCenter('MARS', 'EARTH', missionTime)

  const earthDistance = distance(position, earthPos)
  const moonDistance = distance(position, moonPos)
  const marsDistance = distance(position, marsPos)

  const earthLimit = getBodySceneRadius('EARTH') * SOI_FACTORS.EARTH
  const moonLimit = getBodySceneRadius('MOON') * SOI_FACTORS.MOON
  const marsLimit = getBodySceneRadius('MARS') * SOI_FACTORS.MARS

  if (moonDistance < moonLimit) return 'MOON'
  if (marsDistance < marsLimit) return 'MARS'
  if (earthDistance < earthLimit) return 'EARTH'

  const nearest = [
    { owner: 'EARTH' as const, value: earthDistance },
    { owner: 'MOON' as const, value: moonDistance },
    { owner: 'MARS' as const, value: marsDistance },
  ].sort((a, b) => a.value - b.value)[0]

  if (nearest.value > earthLimit * 1.8) {
    return previousOwner
  }

  return nearest.owner
}

export function propagateMissionVehicle({
  selectedMission,
  missionTime,
  activePhase,
  boundaries,
  previousPosition,
  previousSoiOwner = 'EARTH',
  dt,
}: PropagationInput): PropagatedMissionVehicle {
  const missionPosition = selectedMission === 'lunarMission'
    ? buildLunarPosition(activePhase)
    : selectedMission === 'marsTransfer'
      ? buildMarsPosition(activePhase, missionTime)
      : buildEarthOrbitPosition(activePhase)

  const constrained = constrainPointToBoundariesDetailed(missionPosition.position, boundaries)
  const soiOwner = resolveSoiOwner(constrained.point, missionTime, previousSoiOwner)

  const soiTransition = soiOwner !== previousSoiOwner
    ? { from: previousSoiOwner, to: soiOwner, missionTime }
    : null

  const safeDt = Math.max(dt, 1e-3)
  const prev = previousPosition ?? constrained.point
  const velocity = [
    (constrained.point[0] - prev[0]) / safeDt,
    (constrained.point[1] - prev[1]) / safeDt,
    (constrained.point[2] - prev[2]) / safeDt,
  ] as Vec3

  return {
    position: constrained.point,
    velocity,
    trailSegment: missionPosition.segment,
    telemetry: {
      nearestBody: constrained.nearestBody,
      nearestDistance: constrained.nearestDistance,
      clearanceMargin: constrained.clearanceMargin,
      soiOwner,
      soiTransition,
      boundaryEvents: constrained.events.map((event) => ({
        body: event.body,
        type: event.type,
        penetration: event.penetration,
      })),
    },
  }
}
