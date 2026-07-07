import type { MissionPhase } from '../components/MissionTypes'

export interface CompressedMissionPhase extends MissionPhase {
  compressedDuration: number
  startTime: number
  endTime: number
}

const COMPRESSED_LAUNCH_SECONDS = 60
const COMPRESSED_REMAINDER_SECONDS = 600

export function buildCompressedMissionTimeline(
  phases: MissionPhase[],
  launchSeconds: number = COMPRESSED_LAUNCH_SECONDS,
  remainderSeconds: number = COMPRESSED_REMAINDER_SECONDS,
): CompressedMissionPhase[] {
  if (phases.length === 0) return []

  const [launchPhase, ...remainingPhases] = phases
  const remainingActualDuration = remainingPhases.reduce((total, phase) => total + phase.duration, 0)

  const compressedDurations = [launchSeconds]

  if (remainingPhases.length > 0) {
    const provisional = remainingPhases.map((phase) => {
      if (remainingActualDuration <= 0) return remainderSeconds / remainingPhases.length
      return (phase.duration / remainingActualDuration) * remainderSeconds
    })

    const normalizedTotal = provisional.reduce((total, value) => total + value, 0) || 1
    const normalized = provisional.map((value) => (value / normalizedTotal) * remainderSeconds)
    compressedDurations.push(...normalized)
  }

  let elapsed = 0
  return [launchPhase, ...remainingPhases].map((phase, index) => {
    const compressedDuration = compressedDurations[index] ?? 0
    const startTime = elapsed
    elapsed += compressedDuration
    return {
      ...phase,
      compressedDuration,
      startTime,
      endTime: elapsed,
    }
  })
}

export function getCompressedMissionPhase(
  phases: CompressedMissionPhase[],
  elapsedSeconds: number,
): (CompressedMissionPhase & { progress: number; timeInPhase: number; completed?: boolean }) | null {
  if (phases.length === 0 || elapsedSeconds < 0) return null

  for (const phase of phases) {
    if (elapsedSeconds <= phase.endTime) {
      const timeInPhase = Math.max(0, elapsedSeconds - phase.startTime)
      const progress = phase.compressedDuration > 0
        ? Math.min(timeInPhase / phase.compressedDuration, 1)
        : 1

      return {
        ...phase,
        progress,
        timeInPhase,
      }
    }
  }

  const finalPhase = phases[phases.length - 1]
  return {
    ...finalPhase,
    progress: 1,
    timeInPhase: finalPhase.compressedDuration,
    completed: true,
  }
}
