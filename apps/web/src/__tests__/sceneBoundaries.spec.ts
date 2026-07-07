import { describe, expect, it } from 'vitest'
import { buildSceneBodyBoundaries, constrainPointToBoundaries } from '../utils/sceneBoundaries'

describe('sceneBoundaries', () => {
  it('builds Earth-centered boundaries with Earth at the origin', () => {
    const boundaries = buildSceneBodyBoundaries(0, 'EARTH', ['EARTH', 'MOON'])
    const earth = boundaries.find((boundary) => boundary.name === 'EARTH')
    const moon = boundaries.find((boundary) => boundary.name === 'MOON')

    expect(earth).toBeDefined()
    expect(earth?.center[0]).toBeCloseTo(0, 8)
    expect(earth?.center[1]).toBeCloseTo(0, 8)
    expect(earth?.center[2]).toBeCloseTo(0, 8)

    expect(moon).toBeDefined()
    expect(Math.hypot(moon?.center[0] ?? 0, moon?.center[1] ?? 0, moon?.center[2] ?? 0)).toBeGreaterThan(0)
  })

  it('pushes an interior point back outside the nearest protected body', () => {
    const boundaries = buildSceneBodyBoundaries(0, 'EARTH', ['EARTH'])
    const earth = boundaries[0]
    const clamped = constrainPointToBoundaries([0, 0, 0], boundaries)
    const distance = Math.hypot(
      clamped[0] - earth.center[0],
      clamped[1] - earth.center[1],
      clamped[2] - earth.center[2],
    )

    expect(distance).toBeCloseTo(earth.radius, 6)
  })
})
