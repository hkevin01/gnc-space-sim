import React, { useState } from 'react'
import { LaunchState } from '@gnc/core'

interface GNCPanelProps {
  launchState: LaunchState
  currentState?: any
  missionTime?: number
}

export function GNCPanel({ launchState, currentState, missionTime }: GNCPanelProps) {
  const [activeTab, setActiveTab] = useState<'guidance' | 'navigation' | 'control'>('guidance')

  const tabs = [
    { id: 'guidance' as const, label: '🎯 GUIDANCE', color: 'text-cyan-400' },
    { id: 'navigation' as const, label: '🧭 NAVIGATION', color: 'text-green-400' },
    { id: 'control' as const, label: '⚡ CONTROL', color: 'text-yellow-400' }
  ]

  return (
    <div className="bg-black/90 backdrop-blur-sm border border-zinc-600 rounded-lg h-full flex flex-col">
      {/* Tab Headers */}
      <div className="flex border-b border-zinc-600">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? `${tab.color} bg-zinc-800 border-b-2 border-current`
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'guidance' && (
          <div className="space-y-4">
            <div className="text-cyan-400 font-bold text-sm mb-3">TARGET PARAMETERS</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Target Altitude:</span>
                <span className="text-cyan-400">200 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Target Velocity:</span>
                <span className="text-cyan-400">7.8 km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Target Inclination:</span>
                <span className="text-cyan-400">28.5°</span>
              </div>
            </div>

            <div className="text-cyan-400 font-bold text-sm mb-3 mt-6">CURRENT GUIDANCE</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Pitch Program:</span>
                <span className="text-cyan-400">{(launchState.guidance?.pitch_program || 0).toFixed(3)} rad</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Yaw Program:</span>
                <span className="text-cyan-400">{(launchState.guidance?.yaw_program || 0).toFixed(3)} rad</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Throttle:</span>
                <span className="text-cyan-400">{((launchState.guidance?.throttle || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="space-y-4">
            <div className="text-green-400 font-bold text-sm mb-3">POSITION & VELOCITY</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Altitude:</span>
                <span className="text-green-400">{(launchState.altitude / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Velocity:</span>
                <span className="text-green-400">{(launchState.velocity_magnitude / 1000).toFixed(2)} km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Flight Path Angle:</span>
                <span className="text-green-400">{(launchState.flight_path_angle * (180 / Math.PI)).toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Heading:</span>
                <span className="text-green-400">{(launchState.heading * (180 / Math.PI)).toFixed(1)}°</span>
              </div>
            </div>

            <div className="text-green-400 font-bold text-sm mb-3 mt-6">NAVIGATION SYSTEMS</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">GPS:</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">IMU:</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Kalman Filter:</span>
                <span className="text-green-400">Converged</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="space-y-4">
            <div className="text-yellow-400 font-bold text-sm mb-3">VEHICLE SYSTEMS</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Mass:</span>
                <span className="text-yellow-400">{(launchState.mass / 1000).toFixed(1)} t</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Thrust:</span>
                <span className="text-yellow-400">{(Math.sqrt(launchState.thrust.reduce((a, b) => a + b * b, 0)) / 1000000).toFixed(1)} MN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Throttle:</span>
                <span className="text-yellow-400">{((launchState.guidance?.throttle || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="text-yellow-400 font-bold text-sm mb-3 mt-6">CONTROL SYSTEMS</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Gimbal X:</span>
                <span className="text-yellow-400">±8°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Gimbal Y:</span>
                <span className="text-yellow-400">±8°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">TV Control:</span>
                <span className="text-yellow-400">Active</span>
              </div>
            </div>

            <div className="text-yellow-400 font-bold text-sm mb-3 mt-6">ATMOSPHERIC</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Pressure:</span>
                <span className="text-yellow-400">{(launchState.atmosphere.pressure / 1000).toFixed(1)} kPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Density:</span>
                <span className="text-yellow-400">{launchState.atmosphere.density.toFixed(3)} kg/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Temperature:</span>
                <span className="text-yellow-400">{launchState.atmosphere.temperature} K</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
