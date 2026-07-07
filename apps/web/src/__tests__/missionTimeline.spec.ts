import { describe, expect, it } from 'vitest'
import { MISSION_SCENARIOS } from '../components/MissionTypes'
import { buildCompressedMissionTimeline, getCompressedMissionPhase, getLunarMissionTrailProgress } from '../utils/missionTimeline'

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

  it('reveals outbound, lunar operations, and return trail segments in sequence', () => {
    const timeline = buildCompressedMissionTimeline(MISSION_SCENARIOS.lunarMission.phases)

    const outboundOnly = getLunarMissionTrailProgress(timeline, 90)
    expect(outboundOnly.outbound).toBeGreaterThan(0)
    expect(outboundOnly.operations).toBe(0)
    expect(outboundOnly.returnLeg).toBe(0)

    const duringOps = getLunarMissionTrailProgress(timeline, 500)
    expect(duringOps.outbound).toBe(1)
    expect(duringOps.operations).toBeGreaterThan(0)
    expect(duringOps.returnLeg).toBe(0)

    const duringReturn = getLunarMissionTrailProgress(timeline, 640)
    expect(duringReturn.outbound).toBe(1)
    expect(duringReturn.operations).toBe(1)
    expect(duringReturn.returnLeg).toBeGreaterThan(0)
  })
})
