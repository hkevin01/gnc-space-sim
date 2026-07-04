import { describe, expect, it } from 'vitest'

import { MU_EARTH } from '../math/constants'
import { lambertDeltaV, lambertIzzo } from '../orbits/lambert'
import { rk4Propagate } from '../orbits/rk4'

function norm3(v: [number, number, number]): number {
  return Math.hypot(v[0], v[1], v[2])
}

describe('Lambert solver verification', () => {
  it('solves quarter-orbit circular transfer with bounded endpoint error', () => {
    const r = 7000e3
    const n = Math.sqrt(MU_EARTH / (r * r * r))
    const period = 2 * Math.PI / n
    const tof = period / 4

    const r1: [number, number, number] = [r, 0, 0]
    const r2: [number, number, number] = [0, r, 0]

    const lambert = lambertIzzo(r1, r2, tof, MU_EARTH, true, 80)
    expect(lambert.success).toBe(true)

    const steps = 2400
    const dt = tof / steps
    const s0: [number, number, number, number, number, number] = [
      r1[0], r1[1], r1[2],
      lambert.v1[0], lambert.v1[1], lambert.v1[2],
    ]
    const sf = rk4Propagate(s0, dt, steps, MU_EARTH)

    const posErr = Math.hypot(sf[0] - r2[0], sf[1] - r2[1], sf[2] - r2[2])
    expect(posErr).toBeLessThan(2.0e4)
  })

  it('matches canonical Hohmann half-transfer endpoint speeds', () => {
    const r1mag = 7000e3
    const r2mag = 42164e3
    const aTransfer = 0.5 * (r1mag + r2mag)
    const tof = Math.PI * Math.sqrt((aTransfer ** 3) / MU_EARTH)

    const r1: [number, number, number] = [r1mag, 0, 0]
    const r2: [number, number, number] = [-r2mag, 0, 0]

    const lambert = lambertIzzo(r1, r2, tof, MU_EARTH, true, 100)
    expect(lambert.success).toBe(true)

    const vPerigeeExpected = Math.sqrt(MU_EARTH * (2 / r1mag - 1 / aTransfer))
    const vApogeeExpected = Math.sqrt(MU_EARTH * (2 / r2mag - 1 / aTransfer))

    expect(Math.abs(norm3(lambert.v1) - vPerigeeExpected)).toBeLessThan(20)
    expect(Math.abs(norm3(lambert.v2) - vApogeeExpected)).toBeLessThan(20)
  })

  it('rejects invalid and degenerate transfer inputs', () => {
    const r1: [number, number, number] = [7000e3, 0, 0]
    const r2: [number, number, number] = [7000e3, 0, 0]

    expect(lambertIzzo(r1, r2, 1000, MU_EARTH).success).toBe(false)
    expect(lambertIzzo([0, 0, 0], [1, 0, 0], 1000, MU_EARTH).success).toBe(false)
    expect(lambertIzzo([7000e3, 0, 0], [-7000e3, 0, 0], 0, MU_EARTH).success).toBe(false)
  })

  it('computes delta-v decomposition correctly', () => {
    const out = lambertDeltaV([1, 0, 0], [0, 0, 0], [0, 1, 0], [0, 0, 0])
    expect(out.dv1).toBeCloseTo(1, 10)
    expect(out.dv2).toBeCloseTo(1, 10)
    expect(out.dvTotal).toBeCloseTo(2, 10)
  })
})
