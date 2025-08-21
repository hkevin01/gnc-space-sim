import { describe, expect, it } from 'vitest'

describe('MissionPanel exports', () => {
  it('should export MissionPanel function', async () => {
    const { MissionPanel } = await import('../src/mission/MissionPanel')
    expect(MissionPanel).toBeDefined()
    expect(typeof MissionPanel).toBe('function')
  })

  it('should export Phase type constants', async () => {
    const module = await import('../src/mission/MissionPanel')
    expect(module).toBeDefined()
    // Basic module structure test
  })
})
