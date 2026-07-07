import { describe, expect, it } from 'vitest'
import { MISSION_SCENARIOS } from '../components/MissionTypes'
import { buildCompressedMissionTimeline, getCompressedMissionPhase } from '../utils/missionTimeline'

describe('missionTimeline', () => {
  it('compresses the lunar mission to a 60 second launch plus 600 second mission remainder', () => {
    const timeline = buildCompressedMissionTimeline(MISSION_SCENARIOS.lunarMission.phases)
    const total = timeline.reduce((sum, phase) => sum + phase.compressedDuration, 0)

    expect(timeline[0].compressedDuration).toBeCloseTo(60, 5)
    expect(total).toBeCloseTo(660, 5)
  })

  it('returns the expected active compressed phase for the lunar mission', () => {
    const timeline = buildCompressedMissionTimeline(MISSION_SCENARIOS.lunarMission.phases)

    expect(getCompressedMissionPhase(timeline, 30)?.name).toBe('Trans-Lunar Injection')
    expect(getCompressedMissionPhase(timeline, 120)?.name).toBe('Lunar Transit')
    expect(getCompressedMissionPhase(timeline, 450)?.name).toBe('Lunar Operations')
    expect(getCompressedMissionPhase(timeline, 650)?.name).toBe('Earth Return')
  })
})
