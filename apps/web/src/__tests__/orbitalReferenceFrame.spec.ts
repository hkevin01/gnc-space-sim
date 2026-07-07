import { describe, expect, it } from 'vitest'

import {
  buildBodyLookup,
  computeBodyAwareCameraDistance,
  computeBodySnapPose,
  computePlanetOverviewPose,
  computeSolarOverviewPose,
  getBodyPositionInReferenceFrame,
  translateToReferenceFrame,
  type Vec3,
} from '../utils/orbitalReferenceFrame'

describe('orbitalReferenceFrame utility', () => {
  it('translates a position to the chosen reference frame', () => {
    const translated = translateToReferenceFrame([15, -2, 7], [10, 1, 4])
    expect(translated).toEqual([5, -3, 3])
  })

  it('resolves body positions relative to a center body from lookup data', () => {
    const bodies = buildBodyLookup([
      { name: 'EARTH', position: [5, 0, 0] as Vec3 },
      { name: 'MARS', position: [8, 1, -2] as Vec3 },
    ])

    expect(getBodyPositionInReferenceFrame('MARS', 'EARTH', bodies)).toEqual([3, 1, -2])
  })

  it('returns null when body or center is missing from lookup', () => {
    const bodies = buildBodyLookup([{ name: 'EARTH', position: [0, 0, 0] as Vec3 }])
    expect(getBodyPositionInReferenceFrame('MARS', 'EARTH', bodies)).toBeNull()
    expect(getBodyPositionInReferenceFrame('EARTH', 'SUN', bodies)).toBeNull()
  })
})

describe('launch camera presets', () => {
  it('computes body-aware distance with minimum readable framing', () => {
    const minByRadius = computeBodyAwareCameraDistance(0.25, [0, 0, 0])
    expect(minByRadius).toBeCloseTo(4.5, 8)

    const farTarget = computeBodyAwareCameraDistance(0.25, [100, 0, 0])
    expect(farTarget).toBeCloseTo(18, 8)
  })

  it('builds body snap pose offset from the target with expected camera geometry', () => {
    const pose = computeBodySnapPose([10, 2, -5], 0.3)
    expect(pose.target).toEqual([10, 2, -5])

    const d = pose.distance
    expect(pose.position).toEqual([10 + d, 2 + d * 0.3, -5 + d])
    expect(d).toBeGreaterThan(0)
  })

  it('builds a wider planet overview pose that stays outside the selected body', () => {
    const pose = computePlanetOverviewPose([20, 0, 0], 0.25, 70)

    expect(pose.target).toEqual([20, 0, 0])
    expect(pose.distance).toBeGreaterThan(20)
    expect(pose.position[0]).toBeGreaterThan(20)
    expect(pose.position[2]).toBeGreaterThan(0)
  })

  it('computes a solar overview pose that scales with max orbit radius', () => {
    const pose = computeSolarOverviewPose(100)
    expect(pose.target).toEqual([0, 0, 0])
    expect(pose.distance).toBeCloseTo(220, 8)
    expect(pose.position[0]).toBeCloseTo(220, 8)
    expect(pose.position[1]).toBeCloseTo(59.4, 8)
    expect(pose.position[2]).toBeCloseTo(220, 8)
  })
})
