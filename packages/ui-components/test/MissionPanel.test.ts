import { describe, it, expect } from 'vitest'
import { MissionPanel } from '../src/mission/MissionPanel'

describe('MissionPanel', () => {
  it('should be a component', () => {
    expect(MissionPanel).toBeDefined()
    expect(typeof MissionPanel).toBe('function')
  })
})
