import { describe, expect, it } from 'vitest'

describe('keplerianPropagateTwoBody', () => {
  it('should return a new state', async () => {
    const { keplerianPropagateTwoBody } = await import('../src/orbits/twobody')
    const { MU_EARTH } = await import('../src/math/constants')
    const state = keplerianPropagateTwoBody(
      { r: [7000e3, 0, 0], v: [0, 7500, 0] },
      1,
      MU_EARTH
    )
    expect(state.r).toBeDefined()
    expect(state.v).toBeDefined()
  })
})
