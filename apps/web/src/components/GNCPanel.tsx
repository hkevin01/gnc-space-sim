import React, { useState } from 'react'
import { LaunchState } from '@gnc/core'
import { MissionEvent } from './MissionTypes'

interface GNCPanelProps {
  launchState: LaunchState
  currentState?: Record<string, unknown>
  missionTime?: number
  selectedMission?: string
  currentPhase?: {
    progress: number
    timeInPhase: number
    name: string
    description: string
    duration: number
    requirements: string[]
    events: MissionEvent[]
  } | null
}

export function GNCPanel({ launchState, selectedMission, currentPhase }: GNCPanelProps) {
  const [activeTab, setActiveTab] = useState<'guidance' | 'navigation' | 'control' | 'mission'>('mission')

  const velocityKms = (launchState.velocity_magnitude / 1000).toFixed(2)
  const altitudeKm = (launchState.altitude / 1000).toFixed(1)
  const speedKms = (Math.hypot(...launchState.v) / 1000).toFixed(2)
  const thrustKn = (Math.hypot(...launchState.thrust) / 1000).toFixed(0)
  const dragKn = (Math.hypot(...launchState.drag) / 1000).toFixed(1)
  const targetAltitudeKm = 200
  const targetVelocityKms = 7.8
  const altitudeErrorKm = (targetAltitudeKm - launchState.altitude / 1000).toFixed(1)
  const velocityErrorKms = (targetVelocityKms - launchState.velocity_magnitude / 1000).toFixed(2)
  const massTons = (launchState.mass / 1000).toFixed(1)
  const throttlePct = ((launchState.guidance?.throttle || 0) * 100).toFixed(1)

  const tabs = [
    { id: 'mission' as const, icon: '🚀', label: 'MISSION', color: 'text-orange-400' },
    { id: 'guidance' as const, icon: '🎯', label: 'GUIDANCE', color: 'text-cyan-400' },
    { id: 'navigation' as const, icon: '🧭', label: 'NAVIGATION', color: 'text-green-400' },
    { id: 'control' as const, icon: '⚡', label: 'CONTROL', color: 'text-yellow-400' }
  ]

  return (
    <div className="bg-black/90 backdrop-blur-sm border border-zinc-600 rounded-lg h-full w-100 flex flex-col">
      {/* Tab Headers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-zinc-600">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-0 px-2 py-2 text-[10px] sm:text-[11px] font-bold leading-tight text-center transition-colors ${
              activeTab === tab.id
                ? `${tab.color} bg-zinc-800 border-b-2 border-current`
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <span className="flex flex-col sm:flex-row items-center justify-center gap-1 whitespace-normal break-words text-center">
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'mission' && (
          <div className="space-y-4">
            <div className="text-orange-400 font-bold text-xs md:text-sm mb-3">MISSION STATUS</div>
            <div className="space-y-2 text-xs md:text-sm">
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-zinc-400 shrink-0">Mission:</span>
                <span className="text-orange-400 truncate text-right min-w-0">{selectedMission || 'Not Selected'}</span>
              </div>
              <div className="flex justify-between gap-2 whitespace-nowrap">
                <span className="text-zinc-400 shrink-0">Current Phase:</span>
                <span className="text-orange-400 truncate text-right min-w-0">{currentPhase?.name || 'Pre-Launch'}</span>
              </div>
              {currentPhase && (
                <>
                  <div className="flex justify-between gap-2 whitespace-nowrap">
                    <span className="text-zinc-400 shrink-0">Phase Progress:</span>
                    <span className="text-orange-400 text-right">{(currentPhase.progress * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between gap-2 whitespace-nowrap">
                    <span className="text-zinc-400 shrink-0">Time in Phase:</span>
                    <span className="text-orange-400 text-right">{Math.round(currentPhase.timeInPhase)}s</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-orange-400 font-bold text-sm mb-3 mt-6">MISSION EVENTS</div>
            <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
              {currentPhase?.events?.map((event, index) => (
                <div key={index} className="p-2 bg-zinc-800/50 rounded border border-zinc-700">
                  <div className="text-orange-300 font-semibold text-xs">
                    T+{event.time}s: {event.type}
                  </div>
                  <div className="text-zinc-400 text-xs mt-1">
                    {event.description}
                  </div>
                </div>
              )) || (
                <div className="text-zinc-400 text-xs">No events scheduled for this phase</div>
              )}
            </div>

            <div className="text-orange-400 font-bold text-sm mb-3 mt-6">PHASE REQUIREMENTS</div>
            <div className="space-y-1 text-sm">
              {currentPhase?.requirements?.map((req, index) => (
                <div key={index} className="text-zinc-400 text-xs">
                  • {req}
                </div>
              )) || (
                <div className="text-zinc-400 text-xs">No specific requirements</div>
              )}
            </div>
          </div>
        )}

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
              <div className="flex justify-between">
                <span className="text-zinc-400">Altitude Error:</span>
                <span className="text-cyan-400">{altitudeErrorKm} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Velocity Error:</span>
                <span className="text-cyan-400">{velocityErrorKms} km/s</span>
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
                <span className="text-cyan-400">{throttlePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">T/W Estimate:</span>
                <span className="text-cyan-400">{(Math.hypot(...launchState.thrust) / Math.max(launchState.mass * 9.80665, 1)).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-800/60 border border-zinc-700 rounded p-3 text-xs text-zinc-300">
              <div className="font-semibold text-cyan-300 mb-1">Guidance Notes</div>
              <div>Hold pitch within the gravity-turn corridor until staging.</div>
              <div>Use throttle to manage dynamic pressure near max-Q.</div>
              <div>Target climb: {targetAltitudeKm} km, {targetVelocityKms} km/s insertion.</div>
            </div>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="space-y-4">
            <div className="text-green-400 font-bold text-sm mb-3">POSITION & VELOCITY</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Altitude:</span>
                <span className="text-green-400">{altitudeKm} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Velocity:</span>
                <span className="text-green-400">{velocityKms} km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Flight Path Angle:</span>
                <span className="text-green-400">{(launchState.flight_path_angle * (180 / Math.PI)).toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Heading:</span>
                <span className="text-green-400">{(launchState.heading * (180 / Math.PI)).toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">State Vector X:</span>
                <span className="text-green-400">{(launchState.r[0] / 1000).toFixed(0)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Speed Magnitude:</span>
                <span className="text-green-400">{speedKms} km/s</span>
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
              <div className="flex justify-between">
                <span className="text-zinc-400">Reference Frame:</span>
                <span className="text-green-400">Earth-centered inertial</span>
              </div>
            </div>

            <div className="bg-zinc-800/60 border border-zinc-700 rounded p-3 text-xs text-zinc-300">
              <div className="font-semibold text-green-300 mb-1">Navigation Notes</div>
              <div>Monitor altitude and velocity against the 200 km / 7.8 km/s target band.</div>
              <div>Use heading hold to keep the ascent corridor stable through staging.</div>
              <div>Current radial position: [{(launchState.r[0] / 1000).toFixed(0)}, {(launchState.r[1] / 1000).toFixed(0)}, {(launchState.r[2] / 1000).toFixed(0)}] km.</div>
            </div>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="space-y-4">
            <div className="text-yellow-400 font-bold text-sm mb-3">VEHICLE SYSTEMS</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Mass:</span>
                <span className="text-yellow-400">{massTons} t</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Thrust:</span>
                <span className="text-yellow-400">{(Math.sqrt(launchState.thrust.reduce((a, b) => a + b * b, 0)) / 1000000).toFixed(1)} MN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Throttle:</span>
                <span className="text-yellow-400">{throttlePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Drag:</span>
                <span className="text-yellow-400">{dragKn} kN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Dynamic Pressure:</span>
                <span className="text-yellow-400">{(0.5 * launchState.atmosphere.density * launchState.velocity_magnitude * launchState.velocity_magnitude / 1000).toFixed(1)} kPa</span>
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
              <div className="flex justify-between">
                <span className="text-zinc-400">Telemetry Link:</span>
                <span className="text-yellow-400">Nominal</span>
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

            <div className="bg-zinc-800/60 border border-zinc-700 rounded p-3 text-xs text-zinc-300">
              <div className="font-semibold text-yellow-300 mb-1">Control Notes</div>
              <div>Use gimbal control to keep lateral acceleration within limits.</div>
              <div>Throttle down through max-Q, then return to ascent thrust as density drops.</div>
              <div>Fuel state: {throttlePct}% commanded throttle at {thrustKn} kN thrust.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
