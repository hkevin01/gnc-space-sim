import { describe, expect, it } from 'vitest'

import { ensureRenderablePlanetPositions } from '../components/SolarSystem'

describe('NasaSolarSystem fallback visibility guarantees', () => {
  it('ensures all core bodies are present when input list is empty', () => {
    const out = ensureRenderablePlanetPositions([], 0)
    const names = new Set(out.map((p) => p.name))

    for (const required of ['SUN', 'MERCURY', 'VENUS', 'EARTH', 'MOON', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE']) {
      expect(names.has(required)).toBe(true)
    }
    expect(out.length).toBe(10)
  })

  it('preserves provided planet entries and fills only missing bodies', () => {
    const input = [
      {
        name: 'EARTH',
        position: [1, 2, 3] as [number, number, number],
        dataSource: 'nasa' as const,
        timestamp: new Date(),
      },
      {
        name: 'MOON',
        position: [1.3, 2.1, 3.2] as [number, number, number],
        dataSource: 'nasa' as const,
        timestamp: new Date(),
      },
    ]

    const out = ensureRenderablePlanetPositions(input, 0)
    expect(out.length).toBe(10)

    const earth = out.find((p) => p.name === 'EARTH')
    expect(earth?.position).toEqual([1, 2, 3])
    expect(earth?.dataSource).toBe('nasa')
  })

  it('returns finite fallback coordinates for generated bodies', () => {
    const out = ensureRenderablePlanetPositions([], 123.45)
    for (const p of out) {
      expect(Number.isFinite(p.position[0])).toBe(true)
      expect(Number.isFinite(p.position[1])).toBe(true)
      expect(Number.isFinite(p.position[2])).toBe(true)
    }
  })
})
