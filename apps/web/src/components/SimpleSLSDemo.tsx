/**
 * Simple SLS Demo Component
 *
 * Basic demonstration of SLS vehicle visualization and mission selection.
 */

import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { StarField } from './StarField'
import { Canvas } from '@react-three/fiber'
import React, { useState } from 'react'
import { MissionSelector, type MissionConfig } from './MissionSelector'
import { LaunchPad, SLSBlock1 } from './SLSVisualization'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Rocket, Target } from './ui/Icons'

// Mock vehicle state for demo
const createMockVehicleState = (time: number) => ({
  time,
  altitude: Math.max(0, time * 100), // Simple altitude model
  velocity: Math.max(0, time * 50), // Simple velocity model
  mass: Math.max(100000, 2800000 - time * 3000), // Decreasing mass
  thrust: time < 480 ? 16000000 : 0, // 16 MN for 8 minutes
  stages: [
    {
      name: 'SRB',
      active: time < 126,
      burnTime: Math.min(time, 126),
      propRemaining: Math.max(0, 1200000 - time * 9500),
      thrust: time < 126 ? 14000000 : 0
    },
    {
      name: 'Core Stage',
      active: time < 480,
      burnTime: Math.min(time, 480),
      propRemaining: Math.max(0, 980000 - time * 2000),
      thrust: time < 480 ? 2000000 : 0
    },
    {
      name: 'ICPS',
      active: time > 485,
      burnTime: Math.max(0, time - 485),
      propRemaining: Math.max(0, 30000 - Math.max(0, time - 485) * 100),
      thrust: time > 485 ? 110000 : 0
    }
  ],
  activeStages: time < 126 ? ['SRB', 'Core Stage']
                : time < 480 ? ['Core Stage']
                : time < 485 ? []
                : ['ICPS']
})

interface SimpleSLSDemoProps {
  className?: string
}

export const SimpleSLSDemo: React.FC<SimpleSLSDemoProps> = ({ className = '' }) => {
  const [selectedMission, setSelectedMission] = useState<MissionConfig | undefined>()
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showMissionSelector, setShowMissionSelector] = useState(true)

  const vehicleState = createMockVehicleState(currentTime)

  // Simple simulation timer
  React.useEffect(() => {
  let interval: ReturnType<typeof setInterval> | undefined

    if (isSimulating && currentTime < 600) {
  interval = setInterval(() => {
        setCurrentTime(prev => prev + 1) // 1 second per step
  }, 100) as ReturnType<typeof setInterval> // 10x speed
    } else if (currentTime >= 600) {
      setIsSimulating(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSimulating, currentTime])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (showMissionSelector) {
    return (
      <div className={`space-y-6 ${className}`}>
        <MissionSelector
          onMissionSelect={(mission) => {
            setSelectedMission(mission)
            setShowMissionSelector(false)
          }}
          selectedMission={selectedMission}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Rocket className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-white">
              SLS Launch Simulation
            </h1>
            <p className="text-gray-300">
              NASA Space Launch System • {selectedMission?.name || 'Mission Selected'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowMissionSelector(true)}
        >
          Change Mission
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>3D Vehicle Visualization</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 rounded-b-lg overflow-hidden">
                <Canvas>
                  <StarField count={1000} radius={200} />
                  <PerspectiveCamera makeDefault position={[150, 100, 150]} />
                  <OrbitControls enablePan enableZoom enableRotate />

                  {/* Lighting */}
                  <ambientLight intensity={0.8} />
                  <pointLight position={[100, 100, 100]} intensity={1.2} />
                  <pointLight position={[-100, -100, -100]} intensity={0.6} />

                  {/* Launch Pad */}
                  <LaunchPad scale={0.3} />

                  {/* SLS Vehicle */}
                  <SLSBlock1
                    position={[0, Math.min(vehicleState.altitude / 2000, 100), 0]}
                    vehicleState={vehicleState}
                    scale={0.2}
                    showExhaust={isSimulating && vehicleState.thrust > 0}
                    showSeparation={!vehicleState.activeStages.includes('SRB')}
                  />
                </Canvas>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel and Telemetry */}
        <div className="space-y-6">
          {/* Mission Control */}
          <Card>
            <CardHeader>
              <CardTitle>Mission Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="flex-1"
                >
                  {isSimulating ? 'Pause' : 'Start'} Launch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSimulating(false)
                    setCurrentTime(0)
                  }}
                >
                  Reset
                </Button>
              </div>

              <div className="text-center">
                <div className="text-2xl font-mono font-bold">
                  T+{formatTime(currentTime)}
                </div>
                <div className="text-sm text-gray-300">Mission Elapsed Time</div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Telemetry */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Telemetry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-300">Altitude</div>
                  <div className="font-mono font-bold">
                    {(vehicleState.altitude / 1000).toFixed(1)} km
                  </div>
                </div>
                <div>
                  <div className="text-gray-300">Velocity</div>
                  <div className="font-mono font-bold">
                    {vehicleState.velocity.toFixed(0)} m/s
                  </div>
                </div>
                <div>
                  <div className="text-gray-300">Mass</div>
                  <div className="font-mono font-bold">
                    {(vehicleState.mass / 1000).toFixed(0)} t
                  </div>
                </div>
                <div>
                  <div className="text-gray-300">Thrust</div>
                  <div className="font-mono font-bold">
                    {(vehicleState.thrust / 1000000).toFixed(1)} MN
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-300 mb-2">T/W Ratio</div>
                <div className="font-mono font-bold text-lg">
                  {(vehicleState.thrust / (vehicleState.mass * 9.81)).toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-gray-300 mb-2">Active Stages</div>
                <div className="space-y-1">
                  {vehicleState.activeStages.map((stage: string) => (
                    <Badge key={stage} className="mr-1">
                      {stage}
                    </Badge>
                  ))}
                  {vehicleState.activeStages.length === 0 && (
                    <Badge variant="secondary">Coast Phase</Badge>
                  )}
                </div>
              </div>

              {/* Stage Details */}
              <div>
                <div className="text-gray-300 mb-2">Stage Status</div>
                <div className="space-y-2 text-xs">
                  {vehicleState.stages.map((stage: { name: string; active: boolean; propRemaining: number }) => (
                    <div key={stage.name} className="flex justify-between">
                      <span className={stage.active ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        {stage.name}
                      </span>
                      <span className="font-mono">
                        {stage.active ? `${(stage.propRemaining / 1000).toFixed(0)}t` : 'JETTISONED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mission Info */}
          {selectedMission && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Mission Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-300 font-medium">{selectedMission.name}</div>
                  <div className="text-gray-500 text-xs">{selectedMission.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Destination: {selectedMission.destination}</div>
                  <div>Duration: {selectedMission.duration} days</div>
                  <div>Crew: {selectedMission.crew === 0 ? 'Uncrewed' : `${selectedMission.crew} crew`}</div>
                  <div>Vehicle: {selectedMission.vehicle}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimpleSLSDemo
