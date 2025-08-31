/**
 * SLS Artemis II Demo Component
 *
 * Demonstrates the integrated SLS + Artemis II simulation
 * with 3D visualization and real-time telemetry.
 */

import { SLSGuidance, VehicleIntegrator, type VehicleState } from '@gnc/core'
import { Artemis2Mission, SLSBlock1 as SLSConfig } from '@gnc/scenarios'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React, { useEffect, useRef, useState } from 'react'
import { MissionSelector, type MissionConfig } from './MissionSelector'
import { LaunchPad, SLSBlock1 } from './SLSVisualization'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Clock, Globe, Rocket, Target } from './ui/Icons'

interface SLSDemoProps {
  className?: string
}

export const SLSDemo: React.FC<SLSDemoProps> = ({ className = '' }) => {
  const [selectedMission, setSelectedMission] = useState<MissionConfig | undefined>()
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [vehicleState, setVehicleState] = useState<VehicleState | null>(null)
  const [showMissionSelector, setShowMissionSelector] = useState(true)

  const integrator = useRef<VehicleIntegrator | null>(null)
  const guidance = useRef<SLSGuidance | null>(null)
  const animationFrame = useRef<number>()

  // Initialize simulation when mission is selected
  useEffect(() => {
    if (!selectedMission) return

    // Create SLS vehicle integrator
    const stages = SLSConfig.stages.map(s => ({
      name: s.name,
      dryMass: s.dryMass,
      propMass: s.propMass,
      thrust: s.thrust,
      thrustSL: s.thrustSL,
      isp: s.isp,
      ispSL: s.ispSL,
      parallel: !!s.parallel,
      gimbalRange: s.gimbalRange
    }))

    const stagingEvents = [
      {
        name: 'SRB Separation',
        condition: 'time' as const,
        value: 126, // 2:06 SRB burnout
        jettison: {
          stageName: 'SRB',
          mass: 98000 * 2 // both SRBs dry mass jettisoned
        }
      },
      {
        name: 'Core Stage MECO',
        condition: 'time' as const,
        value: 480, // ~8 minutes
        jettison: {
          stageName: 'Core Stage',
          mass: 85000
        }
      },
      {
        name: 'ICPS Ignition',
        condition: 'time' as const,
        value: 485,
        ignition: {
          stageName: 'ICPS'
        }
      }
    ]

    const payloadMass = SLSConfig.payload.mass

    integrator.current = new VehicleIntegrator(stages, stagingEvents, payloadMass)
    guidance.current = new SLSGuidance(
      Artemis2Mission.targetOrbit.altitude * 1000,
      Artemis2Mission.targetOrbit.inclination * Math.PI / 180
    )

    // Initialize state
    setVehicleState(integrator.current.getState())
    setCurrentTime(0)

  }, [selectedMission])

  // Simulation loop
  const runSimulation = () => {
    if (!integrator.current || !isSimulating) return

    const deltaTime = 0.1 // 100ms time steps
    const newTime = currentTime + deltaTime

    // Simple altitude and velocity approximation for demo
    const altitude = Math.max(0, newTime * 150 - 0.5 * 9.81 * newTime * newTime)
    const velocity = Math.max(0, 150 * newTime - 9.81 * newTime)

    // Update vehicle state
    const newState = integrator.current.update(newTime, altitude, velocity)
    setVehicleState(newState)
    setCurrentTime(newTime)

    // Continue simulation if vehicle is still active
    if (newTime < 600 && newState.thrust > 0) { // 10 minute simulation
      animationFrame.current = requestAnimationFrame(runSimulation)
    } else {
      setIsSimulating(false)
    }
  }

  // Start/stop simulation
  const toggleSimulation = () => {
    if (!vehicleState) return

    if (isSimulating) {
      setIsSimulating(false)
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    } else {
      setIsSimulating(true)
      runSimulation()
    }
  }

  // Reset simulation
  const resetSimulation = () => {
    setIsSimulating(false)
    setCurrentTime(0)
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }
    if (integrator.current) {
      setVehicleState(integrator.current.getState())
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">
              SLS Artemis II Simulation
            </h1>
            <p className="text-gray-600">
              NASA Space Launch System • {selectedMission?.name}
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
              <div className="h-96 bg-black rounded-b-lg overflow-hidden">
                <Canvas>
                  <PerspectiveCamera makeDefault position={[100, 50, 100]} />
                  <OrbitControls enablePan enableZoom enableRotate />

                  {/* Lighting */}
                  <ambientLight intensity={0.6} />
                  <pointLight position={[100, 100, 100]} intensity={1} />
                  <pointLight position={[-100, -100, -100]} intensity={0.5} />

                  {/* Launch Pad */}
                  <LaunchPad scale={0.5} />

                  {/* SLS Vehicle */}
                  {vehicleState && (
                    <SLSBlock1
                      position={[0, vehicleState.altitude / 1000, 0]} // Scale altitude
                      vehicleState={vehicleState}
                      scale={0.3}
                      showExhaust={isSimulating}
                      showSeparation={!integrator.current?.isStageActive('SRB')}
                    />
                  )}

                  {/* Stars */}
                  <mesh position={[0, 0, -500]}>
                    <sphereGeometry args={[1000, 32, 32]} />
                    <meshBasicMaterial color="#000011" side={2} />
                  </mesh>
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
                  onClick={toggleSimulation}
                  className="flex-1"
                  disabled={!vehicleState}
                >
                  {isSimulating ? 'Pause' : 'Start'} Launch
                </Button>
                <Button
                  variant="outline"
                  onClick={resetSimulation}
                  disabled={!vehicleState}
                >
                  Reset
                </Button>
              </div>

              <div className="text-center">
                <div className="text-2xl font-mono font-bold">
                  T+{formatTime(currentTime)}
                </div>
                <div className="text-sm text-gray-600">Mission Elapsed Time</div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Telemetry */}
          {vehicleState && (
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Telemetry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Altitude</div>
                    <div className="font-mono font-bold">
                      {(vehicleState.altitude / 1000).toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Velocity</div>
                    <div className="font-mono font-bold">
                      {vehicleState.velocity.toFixed(0)} m/s
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Mass</div>
                    <div className="font-mono font-bold">
                      {(vehicleState.mass / 1000).toFixed(0)} t
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Thrust</div>
                    <div className="font-mono font-bold">
                      {(vehicleState.thrust / 1000000).toFixed(1)} MN
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-600 mb-2">T/W Ratio</div>
                  <div className="font-mono font-bold text-lg">
                    {integrator.current?.getThrustToWeight().toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-gray-600 mb-2">Active Stages</div>
                  <div className="space-y-1">
                    {vehicleState.activeStages.map(stage => (
                      <Badge key={stage} className="mr-1">
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-200">Destination: {selectedMission.destination}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-200">Duration: {selectedMission.duration} days</span>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Key Milestones</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {selectedMission.keyMilestones.slice(0, 4).map((milestone, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SLSDemo
