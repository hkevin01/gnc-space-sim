export type Vec3 = [number, number, number]

export interface OrbitalBodySnapshot {
  position: Vec3
  sceneRadius: number
}

export interface CameraPose {
  target: Vec3
  position: Vec3
  distance: number
}

export function translateToReferenceFrame(position: Vec3, center: Vec3): Vec3 {
  return [
    position[0] - center[0],
    position[1] - center[1],
    position[2] - center[2],
  ]
}

export function buildBodyLookup<T extends { name: string; position: Vec3 }>(bodies: T[]): Map<string, T> {
  return new Map(bodies.map((body) => [body.name, body]))
}

export function getBodyPositionInReferenceFrame<T extends { position: Vec3 }>(
  bodyName: string,
  centerName: string,
  bodies: Map<string, T>
): Vec3 | null {
  const body = bodies.get(bodyName)
  const center = bodies.get(centerName)

  if (!body || !center) return null
  return translateToReferenceFrame(body.position, center.position)
}

export function computeBodyAwareCameraDistance(sceneRadius: number, target: Vec3): number {
  const radialMagnitude = Math.hypot(target[0], target[1], target[2])
  return Math.max(sceneRadius * 18, radialMagnitude * 0.18, 0.8)
}

export function computeBodySnapPose(target: Vec3, sceneRadius: number): CameraPose {
  const distance = computeBodyAwareCameraDistance(sceneRadius, target)

  return {
    target,
    distance,
    position: [
      target[0] + distance,
      target[1] + distance * 0.3,
      target[2] + distance,
    ],
  }
}

export function computeSolarOverviewPose(maxOrbitRadius: number): CameraPose {
  const distance = Math.max(maxOrbitRadius * 2.2, 120)

  return {
    target: [0, 0, 0],
    distance,
    position: [distance, distance * 0.27, distance],
  }
}
