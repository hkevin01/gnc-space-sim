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
    expect(lambert.conicCase).toBe('elliptic')
    expect(lambert.diagnostics?.transferDirection).toBe('prograde')
    expect(lambert.diagnostics?.transferAngleRad).toBeGreaterThan(0)

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

  it('matches canonical 120-degree circular-arc transfer speed and endpoint', () => {
    const r = 8000e3
    const n = Math.sqrt(MU_EARTH / (r * r * r))
    const theta = (120 * Math.PI) / 180
    const tof = theta / n
    const vc = Math.sqrt(MU_EARTH / r)

    const r1: [number, number, number] = [r, 0, 0]
    const r2: [number, number, number] = [r * Math.cos(theta), r * Math.sin(theta), 0]

    const lambert = lambertIzzo(r1, r2, tof, MU_EARTH, true, 80)
    expect(lambert.success).toBe(true)
    expect(lambert.conicCase).toBe('elliptic')
    expect(Math.abs(norm3(lambert.v1) - vc)).toBeLessThan(10)
    expect(Math.abs(norm3(lambert.v2) - vc)).toBeLessThan(10)

    const steps = 2400
    const dt = tof / steps
    const s0: [number, number, number, number, number, number] = [
      r1[0], r1[1], r1[2],
      lambert.v1[0], lambert.v1[1], lambert.v1[2],
    ]
    const sf = rk4Propagate(s0, dt, steps, MU_EARTH)
    const posErr = Math.hypot(sf[0] - r2[0], sf[1] - r2[1], sf[2] - r2[2])
    expect(posErr).toBeLessThan(2.5e4)
  })

  it('rejects invalid and degenerate transfer inputs', () => {
    const r1: [number, number, number] = [7000e3, 0, 0]
    const r2: [number, number, number] = [7000e3, 0, 0]

    const samePoint = lambertIzzo(r1, r2, 1000, MU_EARTH)
    expect(samePoint.success).toBe(false)
    expect(samePoint.diagnostics?.failureReason).toBe('degenerate_geometry')

    const invalidInput = lambertIzzo([0, 0, 0], [1, 0, 0], 1000, MU_EARTH)
    expect(invalidInput.success).toBe(false)
    expect(invalidInput.diagnostics?.failureReason).toBe('invalid_input')

    const zeroTof = lambertIzzo([7000e3, 0, 0], [-7000e3, 0, 0], 0, MU_EARTH)
    expect(zeroTof.success).toBe(false)
    expect(zeroTof.diagnostics?.failureReason).toBe('invalid_input')
  })

  it('reports infeasible-time diagnostics for too-short transfer time', () => {
    const r1: [number, number, number] = [8000e3, 0, 0]
    const r2: [number, number, number] = [0, 8000e3, 0]
    const impossibleTof = 1 // seconds, deliberately infeasible

    const result = lambertIzzo(r1, r2, impossibleTof, MU_EARTH)
    expect(result.success).toBe(false)
    expect(result.diagnostics?.failureReason).toBe('infeasible_time_of_flight')
    expect(result.diagnostics?.minFeasibleTof).toBeDefined()
    expect(result.diagnostics?.requestedTof).toBe(impossibleTof)
  })

  it('computes delta-v decomposition correctly', () => {
    const out = lambertDeltaV([1, 0, 0], [0, 0, 0], [0, 1, 0], [0, 0, 0])
    expect(out.dv1).toBeCloseTo(1, 10)
    expect(out.dv2).toBeCloseTo(1, 10)
    expect(out.dvTotal).toBeCloseTo(2, 10)
  })
})
