import { describe, expect, it } from 'vitest'
import { MISSION_SCENARIOS } from '../components/MissionTypes'
import { getBodyPositionRelativeToCenter } from '../components/SolarSystem'
import { buildCompressedMissionTimeline, getCompressedMissionPhase } from '../utils/missionTimeline'
import { buildSceneBodyBoundaries } from '../utils/sceneBoundaries'
import { propagateMissionVehicle, resolveSoiOwner } from '../utils/missionPropagation'

describe('missionPropagation', () => {
  it('propagates lunar operations with telemetry and operations segment', () => {
    const timeline = buildCompressedMissionTimeline(MISSION_SCENARIOS.lunarMission.phases)
    const activePhase = getCompressedMissionPhase(timeline, 450)
    const boundaries = buildSceneBodyBoundaries(450, 'EARTH')

    const propagated = propagateMissionVehicle({
      selectedMission: 'lunarMission',
      missionTime: 450,
      activePhase,
      boundaries,
      previousSoiOwner: 'EARTH',
      dt: 0.05,
    })

    expect(propagated.trailSegment).toBe('operations')
    expect(Number.isFinite(propagated.position[0])).toBe(true)
    expect(Number.isFinite(propagated.velocity[0])).toBe(true)
    expect(propagated.telemetry.nearestBody).toBeDefined()
    expect(Number.isFinite(propagated.telemetry.clearanceMargin)).toBe(true)
  })

  it('switches SOI ownership based on boundary-relative position', () => {
    const moonPos = getBodyPositionRelativeToCenter('MOON', 'EARTH', 0)
    const nearEarth = [0.18, 0, 0] as [number, number, number]

    const earthOwner = resolveSoiOwner(nearEarth, 0, 'EARTH')
    const moonOwner = resolveSoiOwner(moonPos, 0, 'EARTH')

    expect(earthOwner).toBe('EARTH')
    expect(moonOwner).toBe('MOON')
  })
})
