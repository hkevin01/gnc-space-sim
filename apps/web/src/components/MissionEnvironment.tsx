import { LaunchPhase } from '@gnc/core'
import { useMemo } from 'react'

/**
 * Enhanced Mission Environment Visualizer
 *
 * Renders appropriate celestial bodies and environments based on mission phase
 * with advanced lighting, orbital mechanics, and UI components
 */

interface MissionEnvironmentProps {
  phase: LaunchPhase
  missionTime: number
  altitude: number
}

export function MissionEnvironment({ phase, missionTime, altitude }: MissionEnvironmentProps) {
  // Placeholder: this environment is currently disabled. Props kept for API compatibility.
  void phase; void missionTime; void altitude;
  return null
}

/**
 * Mission Phase Visual Indicators
 */
interface PhaseIndicatorProps {
  phase: LaunchPhase
  missionTime: number
}

export function PhaseVisualIndicator({ phase, missionTime }: PhaseIndicatorProps) {
  const phaseConfig = useMemo(() => {
    switch (phase) {
      case LaunchPhase.PRELAUNCH:
        return { color: '#6B7280', label: 'Pre-Launch', icon: '🚀' }
      case LaunchPhase.LIFTOFF:
        return { color: '#EF4444', label: 'Liftoff', icon: '🔥' }
      case LaunchPhase.STAGE1_BURN:
        return { color: '#F59E0B', label: 'Stage 1 Burn', icon: '🚀' }
      case LaunchPhase.MAX_Q:
        return { color: '#8B5CF6', label: 'Max Q', icon: '💨' }
      case LaunchPhase.STAGE1_SEPARATION:
        return { color: '#10B981', label: 'Stage 1 Sep', icon: '🔄' }
      case LaunchPhase.STAGE2_IGNITION:
        return { color: '#F59E0B', label: 'Stage 2 Ignition', icon: '🔥' }
      case LaunchPhase.FAIRING_JETTISON:
        return { color: '#06B6D4', label: 'Fairing Jettison', icon: '📦' }
      case LaunchPhase.STAGE2_BURN:
        return { color: '#F59E0B', label: 'Stage 2 Burn', icon: '🚀' }
      case LaunchPhase.ORBITAL_INSERTION:
        return { color: '#3B82F6', label: 'Orbital Insertion', icon: '🌍' }
      case LaunchPhase.ORBIT_CIRCULARIZATION:
        return { color: '#8B5CF6', label: 'Orbit Circularization', icon: '🔄' }
      default:
        return { color: '#6B7280', label: 'Unknown', icon: '❓' }
    }
  }, [phase])

  return (
    <div className="flex items-center space-x-2 text-white">
      <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: phaseConfig.color }} />
      <span className="text-lg">{phaseConfig.icon}</span>
      <span className="font-bold">{phaseConfig.label}</span>
      <span className="text-sm opacity-75">
        T+{Math.floor(missionTime / 60)}:{(missionTime % 60).toFixed(0).padStart(2, '0')}
      </span>
    </div>
  )
}
