/**
 * Enhanced Orbital Mechanics Demo
 *
 * Showcases realistic planetary rotation with axial tilts, retrograde rotation,
 * and accurate orbital mechanics for all planets in our solar system.
 */

import { OrbitControls, Stats } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useState, useRef } from 'react'
import { OrbitalSystem } from './OrbitalMechanics'
import { StarField } from './StarField'

interface EnhancedOrbitalDemoProps {
  className?: string
}

function TimeDisplay({ simulationTime }: { simulationTime: number }) {
  const earthDays = simulationTime / 86400
  const earthYears = earthDays / 365.25

  return (
    <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded-lg text-sm font-mono">
      <h3 className="font-bold mb-2">🌌 Enhanced Solar System</h3>
      <p>Time: {(simulationTime / 3600).toFixed(1)} hours</p>
      <p>Earth Days: {earthDays.toFixed(1)}</p>
      <p>Earth Years: {earthYears.toFixed(2)}</p>
      <div className="mt-2 text-xs text-green-400">
        <p>🔧 SCALE DEBUG:</p>
        <p>• Distance Scale: 1 AU ≈ 149.6 units (1 unit = 1e6 km)</p>
        <p>• Camera at: [400, 200, 400]</p>
        <p>• Max zoom: 5000 units</p>
      </div>
      <div className="mt-2 text-xs text-gray-300">
        <p>✨ Features Active:</p>
        <p>• Realistic orbital distances</p>
        <p>• Accurate axial tilts</p>
        <p>• Retrograde rotation (Venus, Uranus)</p>
        <p>• All 8 planets + Moon</p>
      </div>
    </div>
  )
} function ControlPanel({
  showOrbits,
  setShowOrbits,
  showLabels,
  setShowLabels,
  timeMultiplier,
  setTimeMultiplier
}: {
  showOrbits: boolean
  setShowOrbits: (show: boolean) => void
  showLabels: boolean
  setShowLabels: (show: boolean) => void
  timeMultiplier: number
  setTimeMultiplier: (multiplier: number) => void
}) {
  return (
    <div className="absolute top-4 right-4 z-10 bg-black/80 text-white p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-3">🎛️ Controls</h3>

      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(e) => setShowOrbits(e.target.checked)}
              className="rounded"
            />
            <span>Show Orbital Paths</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded"
            />
            <span>Planet Labels</span>
          </label>
        </div>

        <div>
          <label className="block mb-1">Time Speed: {timeMultiplier}x</label>
          <input
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={timeMultiplier}
            onChange={(e) => setTimeMultiplier(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.1x</span>
            <span>Real Time</span>
            <span>100x</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-300">
        <p><strong>Navigation:</strong></p>
        <p>• Left drag: Rotate view</p>
        <p>• Right drag: Pan camera</p>
        <p>• Scroll: Zoom in/out</p>
        <p><span className="text-yellow-400">💡 TIP: Zoom WAY out to see outer planets!</span></p>
        <p><span className="text-green-400">🎯 Try zooming to max distance (2000 units)</span></p>
      </div>
    </div>
  )
} function PlanetHighlights() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-black/80 text-white p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">🪐 Planet Distances</h3>
      <div className="text-xs space-y-1">
        <p><span className="text-yellow-400">☀️ Sun:</span> Center (0 AU) - ~149.6 units per AU</p>
        <p><span className="text-gray-500">☿ Mercury:</span> 0.39 AU (~58 units)</p>
        <p><span className="text-yellow-400">♀️ Venus:</span> 0.72 AU (~108 units), retrograde</p>
        <p><span className="text-blue-400">🌍 Earth:</span> 1.0 AU (~149.6 units), 23.4° tilt</p>
        <p><span className="text-red-400">♂️ Mars:</span> 1.52 AU (~227 units), 25.2° tilt</p>
        <p><span className="text-orange-400">♃ Jupiter:</span> 5.2 AU (~778 units), fast rotation</p>
        <p><span className="text-yellow-600">♄ Saturn:</span> 9.5 AU (~1434 units), rings</p>
        <p><span className="text-cyan-400">♅ Uranus:</span> 19.2 AU (~2872 units), sideways!</p>
        <p><span className="text-blue-600">♆ Neptune:</span> 30.1 AU (~4495 units)</p>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        <p>Zoom out to see outer planets! 🔍</p>
      </div>
    </div>
  )
}

export function EnhancedOrbitalDemo({ className }: EnhancedOrbitalDemoProps) {
  const [showOrbits, setShowOrbits] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [timeMultiplier, setTimeMultiplier] = useState(10)
  const [simulationTime, setSimulationTime] = useState(0)

  return (
    <div className={`relative w-full h-screen bg-black ${className}`}>
      <TimeDisplay simulationTime={simulationTime} />
      <ControlPanel
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        timeMultiplier={timeMultiplier}
        setTimeMultiplier={setTimeMultiplier}
      />
      <PlanetHighlights />

      <Canvas
        camera={{
          position: [400, 200, 400],
          fov: 60
        }}
        gl={{ antialias: true }}
        shadows
      >
        <color attach="background" args={['#000011']} />

        {/* StarField background */}
        <StarField count={6000} radius={3000} />

        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 0, 0]} intensity={12} decay={2} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[50, 50, 50]} intensity={0.6} />

        {/* Solar System with animated time */}
        <AnimatedTimeSystem
          timeMultiplier={timeMultiplier}
          showOrbits={showOrbits}
          showLabels={showLabels}
          onTimeUpdate={setSimulationTime}
        />

        {/* Asteroid Belt (disabled for debugging) */}
        {/* <AsteroidBeltVisual /> */}

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={5000}
          target={[0, 0, 0]}
        />

        {/* Development Stats */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>
    </div>
  )
}

function AnimatedTimeSystem({
  timeMultiplier,
  showOrbits,
  showLabels,
  onTimeUpdate
}: {
  timeMultiplier: number
  showOrbits: boolean
  showLabels: boolean
  onTimeUpdate: (time: number) => void
}) {
  const [simulationTime, setSimulationTime] = useState(0)
  const timeRef = useRef(0)

  useFrame((state, delta) => {
    timeRef.current += delta * timeMultiplier
    setSimulationTime(timeRef.current)
    onTimeUpdate(timeRef.current)
  })

  return (
    <OrbitalSystem
      simulationTime={simulationTime}
      showOrbits={showOrbits}
      showLabels={showLabels}
    />
  )
}

export default EnhancedOrbitalDemo
