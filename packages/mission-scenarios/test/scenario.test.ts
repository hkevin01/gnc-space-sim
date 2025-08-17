import { describe, it, expect } from 'vitest'

describe('EARTH_ASTEROID_MARS scenario', () => {
  it('should export a mission scenario', async () => {
    const { EARTH_ASTEROID_MARS } = await import('../src/scenarios/earth-asteroid-mars')
    expect(EARTH_ASTEROID_MARS).toBeDefined()
    expect(EARTH_ASTEROID_MARS.name).toBeDefined()
  })
})
