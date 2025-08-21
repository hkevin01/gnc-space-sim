import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { CELESTIAL_BODIES, CelestialBodyData, getCelestialBodyPositions } from './OrbitalMechanics'

/**
 * Enhanced UI Components for GNC Space Simulator
 *
 * Provides professional mission planning interface with:
 * - Interactive celestial body information panels
 * - Real-time mission data displays
 * - Orbital parameter visualizations
 * - Mission timeline controls
 */

// Mission data interface
interface MissionData {
  phase: string
  altitude: number
  velocity: number
  missionTime: number
  fuel: number
  targetBody?: string
}

/**
 * Mission Control Panel - Main UI overlay
 */
interface MissionControlPanelProps {
  missionData: MissionData
  onTimeControlChange: (timeMultiplier: number) => void
  onTargetBodyChange: (bodyId: string) => void
  simulationTime: number
}

export function MissionControlPanel({
  missionData,
  onTimeControlChange,
  onTargetBodyChange,
  simulationTime
}: MissionControlPanelProps) {
  const [selectedBody, setSelectedBody] = useState<string | null>(null)
  const [showOrbitalData, setShowOrbitalData] = useState(false)
  const [timeMultiplier, setTimeMultiplier] = useState(1)

  const handleTimeChange = (multiplier: number) => {
    setTimeMultiplier(multiplier)
    onTimeControlChange(multiplier)
  }

  const handleBodySelect = (bodyId: string) => {
    setSelectedBody(bodyId)
    onTargetBodyChange(bodyId)
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Top Status Bar */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto">
        <MissionStatusBar missionData={missionData} />
      </div>

      {/* Left Panel - Celestial Bodies */}
      <div className="absolute top-20 left-4 w-80 pointer-events-auto">
        <CelestialBodyPanel
          selectedBody={selectedBody}
          onBodySelect={handleBodySelect}
          simulationTime={simulationTime}
        />
      </div>

      {/* Right Panel - Mission Controls */}
      <div className="absolute top-20 right-4 w-80 pointer-events-auto">
        <MissionControlsPanel
          timeMultiplier={timeMultiplier}
          onTimeChange={handleTimeChange}
          showOrbitalData={showOrbitalData}
          onToggleOrbitalData={() => setShowOrbitalData(!showOrbitalData)}
        />
      </div>

      {/* Bottom Panel - Orbital Parameters */}
      {showOrbitalData && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <OrbitalParametersPanel
            missionData={missionData}
            selectedBody={selectedBody}
            simulationTime={simulationTime}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Mission Status Bar
 */
function MissionStatusBar({ missionData }: { missionData: MissionData }) {
  const getPhaseColor = (phase: string) => {
    if (phase.includes('BURN')) return 'bg-orange-500'
    if (phase.includes('ORBITAL')) return 'bg-blue-500'
    if (phase.includes('SEPARATION')) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `T+${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4 border border-zinc-700">
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full animate-pulse ${getPhaseColor(missionData.phase)}`} />
          <span className="font-bold text-lg">{missionData.phase.replace(/_/g, ' ')}</span>
          <span className="text-zinc-300">{formatTime(missionData.missionTime)}</span>
        </div>

        <div className="flex items-center space-x-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-zinc-400">Altitude</span>
            <span className="font-mono">{(missionData.altitude / 1000).toFixed(1)} km</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-400">Velocity</span>
            <span className="font-mono">{(missionData.velocity / 1000).toFixed(2)} km/s</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-400">Fuel</span>
            <span className="font-mono">{missionData.fuel.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Celestial Body Information Panel
 */
interface CelestialBodyPanelProps {
  selectedBody: string | null
  onBodySelect: (bodyId: string) => void
  simulationTime: number
}

function CelestialBodyPanel({
  selectedBody,
  onBodySelect,
  simulationTime
}: CelestialBodyPanelProps) {
  const celestialPositions = getCelestialBodyPositions(simulationTime)

  return (
    <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4 border border-zinc-700">
      <h3 className="text-white font-bold mb-4 flex items-center">
        <span className="mr-2">🌌</span>
        Celestial Bodies
      </h3>

      <div className="space-y-2">
        {CELESTIAL_BODIES.map(body => (
          <CelestialBodyCard
            key={body.id}
            body={body}
            isSelected={selectedBody === body.id}
            onSelect={onBodySelect}
            position={celestialPositions.get(body.id)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual Celestial Body Card
 */
interface CelestialBodyCardProps {
  body: CelestialBodyData
  isSelected: boolean
  onSelect: (bodyId: string) => void
  position?: THREE.Vector3
}

function CelestialBodyCard({
  body,
  isSelected,
  onSelect,
  position
}: CelestialBodyCardProps) {
  const getBodyIcon = (type: string) => {
    switch (type) {
      case 'star': return '☀️'
      case 'planet': return '🌍'
      case 'moon': return '🌙'
      default: return '🪨'
    }
  }

  const distance = position ? position.length() : 0

  return (
    <button
      onClick={() => onSelect(body.id)}
      className={`w-full p-3 rounded-lg transition-all duration-200 ${
        isSelected
          ? 'bg-blue-600 bg-opacity-50 border border-blue-400'
          : 'bg-zinc-800 bg-opacity-50 hover:bg-zinc-700 border border-transparent'
      }`}
    >
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <span className="text-xl">{getBodyIcon(body.type)}</span>
          <div className="text-left">
            <div className="font-semibold">{body.name}</div>
            <div className="text-xs text-zinc-400">
              {body.type.charAt(0).toUpperCase() + body.type.slice(1)}
            </div>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="text-zinc-300">
            {distance > 0 ? `${distance.toFixed(1)} units` : 'Origin'}
          </div>
          <div className="text-zinc-400">
            {(body.radiusKm / 1000).toFixed(0)}k km
          </div>
        </div>
      </div>
    </button>
  )
}

/**
 * Mission Controls Panel
 */
interface MissionControlsPanelProps {
  timeMultiplier: number
  onTimeChange: (multiplier: number) => void
  showOrbitalData: boolean
  onToggleOrbitalData: () => void
}

function MissionControlsPanel({
  timeMultiplier,
  onTimeChange,
  showOrbitalData,
  onToggleOrbitalData
}: MissionControlsPanelProps) {
  const timePresets = [0.1, 0.5, 1, 2, 5, 10, 100, 1000]

  return (
    <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4 border border-zinc-700">
      <h3 className="text-white font-bold mb-4 flex items-center">
        <span className="mr-2">🎛️</span>
        Mission Controls
      </h3>

      {/* Time Control */}
      <div className="mb-6">
        <label className="text-zinc-300 text-sm mb-2 block">Time Acceleration</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {timePresets.map(preset => (
            <button
              key={preset}
              onClick={() => onTimeChange(preset)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                timeMultiplier === preset
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {preset < 1 ? `${preset}x` : `${preset}x`}
            </button>
          ))}
        </div>
        <div className="text-white text-center">
          Current: <span className="font-mono">{timeMultiplier}x</span>
        </div>
      </div>

      {/* View Controls */}
      <div className="space-y-3">
        <button
          onClick={onToggleOrbitalData}
          className={`w-full p-2 rounded text-sm transition-colors ${
            showOrbitalData
              ? 'bg-green-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {showOrbitalData ? '📊 Hide' : '📊 Show'} Orbital Data
        </button>

        <button className="w-full p-2 rounded text-sm bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors">
          🎯 Center on Target
        </button>

        <button className="w-full p-2 rounded text-sm bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors">
          📡 Track Spacecraft
        </button>
      </div>
    </div>
  )
}

/**
 * Orbital Parameters Panel
 */
interface OrbitalParametersPanelProps {
  missionData: MissionData
  selectedBody: string | null
  simulationTime: number
}

function OrbitalParametersPanel({
  missionData,
  selectedBody,
  simulationTime
}: OrbitalParametersPanelProps) {
  const selectedBodyData = selectedBody
    ? CELESTIAL_BODIES.find(b => b.id === selectedBody)
    : null

  const orbitalParams = useMemo(() => {
    if (!selectedBodyData) return null

    // Calculate current orbital parameters
    const positions = getCelestialBodyPositions(simulationTime)
    const bodyPos = positions.get(selectedBody!)

    return {
      semiMajorAxis: (selectedBodyData.semiMajorAxisKm / 1000).toFixed(0),
      eccentricity: selectedBodyData.eccentricity.toFixed(4),
      inclination: selectedBodyData.inclinationDeg.toFixed(2),
      orbitalPeriod: selectedBodyData.orbitalPeriodDays.toFixed(1),
      currentDistance: bodyPos ? (bodyPos.length() * 1000).toFixed(0) : '0'
    }
  }, [selectedBodyData, selectedBody, simulationTime])

  if (!orbitalParams || !selectedBodyData) {
    return (
      <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4 border border-zinc-700">
        <div className="text-zinc-400 text-center">
          Select a celestial body to view orbital parameters
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4 border border-zinc-700">
      <h3 className="text-white font-bold mb-4 flex items-center">
        <span className="mr-2">🛰️</span>
        Orbital Parameters - {selectedBodyData.name}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
          <div className="text-zinc-400 text-xs mb-1">Semi-Major Axis</div>
          <div className="text-white font-mono">{orbitalParams.semiMajorAxis} Mm</div>
        </div>

        <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
          <div className="text-zinc-400 text-xs mb-1">Eccentricity</div>
          <div className="text-white font-mono">{orbitalParams.eccentricity}</div>
        </div>

        <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
          <div className="text-zinc-400 text-xs mb-1">Inclination</div>
          <div className="text-white font-mono">{orbitalParams.inclination}°</div>
        </div>

        <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
          <div className="text-zinc-400 text-xs mb-1">Orbital Period</div>
          <div className="text-white font-mono">{orbitalParams.orbitalPeriod} days</div>
        </div>

        <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
          <div className="text-zinc-400 text-xs mb-1">Current Distance</div>
          <div className="text-white font-mono">{orbitalParams.currentDistance} km</div>
        </div>
      </div>

      {/* Mission-specific parameters */}
      <div className="mt-4 pt-4 border-t border-zinc-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
            <div className="text-zinc-400 text-xs mb-1">Spacecraft Alt.</div>
            <div className="text-white font-mono">{(missionData.altitude / 1000).toFixed(1)} km</div>
          </div>

          <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
            <div className="text-zinc-400 text-xs mb-1">Velocity</div>
            <div className="text-white font-mono">{(missionData.velocity / 1000).toFixed(2)} km/s</div>
          </div>

          <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
            <div className="text-zinc-400 text-xs mb-1">Mission Time</div>
            <div className="text-white font-mono">
              T+{Math.floor(missionData.missionTime / 60)}:
              {(missionData.missionTime % 60).toFixed(0).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-zinc-800 bg-opacity-50 rounded p-3">
            <div className="text-zinc-400 text-xs mb-1">Fuel Remaining</div>
            <div className="text-white font-mono">{missionData.fuel.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 3D Label Component for celestial bodies
 */
interface CelestialBodyLabelProps {
  position: THREE.Vector3
  body: CelestialBodyData
  distance: number
}

export function CelestialBodyLabel({
  position,
  body,
  distance
}: CelestialBodyLabelProps) {
  const { camera } = useThree()
  const labelRef = useRef<HTMLDivElement>(null)

  useFrame(() => {
    if (labelRef.current) {
      // Calculate if the body is visible to the camera
      const worldPosition = position.clone()
      const screenPosition = worldPosition.project(camera)

      // Hide if behind camera
      const isVisible = screenPosition.z < 1
      labelRef.current.style.display = isVisible ? 'block' : 'none'
    }
  })

  return (
    <Html
      position={position}
      center
      distanceFactor={10}
      occlude
    >
      <div
        ref={labelRef}
        className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none border border-zinc-600"
      >
        <div className="font-semibold">{body.name}</div>
        <div className="text-zinc-300 text-xs">
          {distance > 1000 ? `${(distance / 1000).toFixed(1)}k km` : `${distance.toFixed(0)} km`}
        </div>
      </div>
    </Html>
  )
}
