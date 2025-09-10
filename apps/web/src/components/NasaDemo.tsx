/**
 * NASA Demo Component
 * Demonstrates the NASA JPL Horizons API integration with real-time planetary positions
 */

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { NasaSolarSystem, SolarSystem } from './SolarSystem';

interface NasaDemoProps {
  className?: string;
}

export function NasaDemo({ className }: NasaDemoProps) {
  const [useNasaData, setUseNasaData] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [centerOn, setCenterOn] = useState<'SUN' | 'EARTH'>('EARTH');

  // Calculate camera target and distances based on centerOn
  const cameraConfig = useMemo(() => {
    if (centerOn === 'SUN') {
      return {
        target: [0, 0, 0] as [number, number, number],
        minDistance: 50,
        maxDistance: 2000
      };
    } else { // EARTH
      // Earth is approximately 150 million km from Sun, scaled to 1 unit = 1 million km = 150 units
      // We'll set the target to [0, 0, 0] since the SolarSystem component offsets the world
      return {
        target: [0, 0, 0] as [number, number, number],
        minDistance: 1, // Close enough to see Earth details
        maxDistance: 50 // Far enough to see Earth and Moon system, but not other planets
      };
    }
  }, [centerOn]);

  return (
    <div className={`relative w-full h-screen ${className || ''}`}>
      {/* Controls Panel */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 text-white p-4 rounded-lg space-y-3">
        <h3 className="text-lg font-bold">🌍 NASA Solar System Demo</h3>

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useNasaData}
              onChange={(e) => setUseNasaData(e.target.checked)}
              className="rounded"
            />
            <span>🛰️ Use NASA JPL Data</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(e) => setShowOrbits(e.target.checked)}
              className="rounded"
            />
            <span>🌌 Show Orbital Paths</span>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Camera Center:</p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCenterOn('SUN')}
              className={`px-2 py-1 rounded text-sm ${
                centerOn === 'SUN'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              ☀️ Sun
            </button>
            <button
              onClick={() => setCenterOn('EARTH')}
              className={`px-2 py-1 rounded text-sm ${
                centerOn === 'EARTH'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              🌍 Earth
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-300 border-t border-gray-600 pt-2">
          <p>• NASA data updates hourly</p>
          <p>• Fallback to calculated positions if NASA unavailable</p>
          <p>• Real astronomical positions and orbital mechanics</p>
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{
          position: [50, 30, 50],
          fov: 60
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000011']} />

        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" />

        {/* Solar System */}
        {useNasaData ? (
          <NasaSolarSystem
            showOrbits={showOrbits}
            centerOn={centerOn}
            useNasaData={true}
          />
        ) : (
          <SolarSystem
            showOrbits={showOrbits}
            missionTime={Date.now() / 1000}
            centerOn={centerOn}
          />
        )}

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={cameraConfig.minDistance}
          maxDistance={cameraConfig.maxDistance}
          target={cameraConfig.target}
        />

        {/* Performance Stats */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>

      {/* Data Status Panel */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white p-3 rounded-lg text-sm">
        <p className="font-semibold">Status:</p>
        <p>Mode: {useNasaData ? '🛰️ NASA JPL Horizons' : '🧮 Calculated Orbits'}</p>
        <p>Center: {centerOn === 'SUN' ? '☀️ Heliocentric' : '🌍 Geocentric'}</p>
        <p>Orbits: {showOrbits ? '✅ Visible' : '❌ Hidden'}</p>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/70 text-white p-3 rounded-lg text-xs">
        <p className="font-semibold mb-1">Controls:</p>
        <p>• Left click + drag: Rotate</p>
        <p>• Right click + drag: Pan</p>
        <p>• Scroll: Zoom in/out</p>
        <p>• Toggle NASA data to compare</p>
      </div>
    </div>
  );
}

export default NasaDemo;
