import {
  getBodyPositionRelativeToCenter,
  getRenderRadius,
  type SolarBodyName,
} from '../components/SolarSystem'
import { clampPointOutsideSphere, ROCKET_VISUAL_SCALE, type Vec3 } from './launchVisualBehavior'

export interface SceneBodyBoundary {
  name: SolarBodyName
  center: Vec3
  radius: number
}

const DEFAULT_BOUNDARY_BODIES: SolarBodyName[] = ['EARTH', 'MOON', 'MARS', 'JUPITER']

export function buildSceneBodyBoundaries(
  missionTime: number,
  centerOn: 'SUN' | 'EARTH' | 'MOON' = 'EARTH',
  bodyNames: SolarBodyName[] = DEFAULT_BOUNDARY_BODIES,
  clearanceScene: number = ROCKET_VISUAL_SCALE * 0.65,
): SceneBodyBoundary[] {
  return bodyNames.map((name) => ({
    name,
    center: name === centerOn
      ? ([0, 0, 0] as Vec3)
      : getBodyPositionRelativeToCenter(name, centerOn, missionTime),
    radius: getRenderRadius(name, centerOn) + clearanceScene,
  }))
}

export function constrainPointToBoundaries(
  point: Vec3,
  boundaries: SceneBodyBoundary[],
): Vec3 {
  return boundaries.reduce<Vec3>((candidate, boundary) => {
    return clampPointOutsideSphere(candidate, boundary.center, boundary.radius)
  }, point)
}
