// apps/web/src/components/TrajectoryControlPanel.tsx
import React from 'react'

interface TrajectoryControlPanelProps {
  onAlgorithmChange: (algorithm: 'enhanced-sssp' | 'dijkstra') => void
  onGraphSizeChange: (size: 'small' | 'medium' | 'large') => void
  onMissionChange: (mission: string) => void
  onRunDemo: () => void
  onRunComparison: () => void
  isRunning: boolean
  currentAlgorithm: 'enhanced-sssp' | 'dijkstra'
  graphSize: 'small' | 'medium' | 'large'
  currentMission: string
}

export function TrajectoryControlPanel({
  onAlgorithmChange,
  onGraphSizeChange,
  onMissionChange,
  onRunDemo,
  onRunComparison,
  isRunning,
  currentAlgorithm,
  graphSize,
  currentMission
}: TrajectoryControlPanelProps) {
  return (
    <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg border border-cyan-400 max-w-sm">
      <h2 className="text-xl font-bold mb-4">Trajectory Planning Control</h2>
      
      {/* Algorithm Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Algorithm</label>
        <select
          value={currentAlgorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as 'enhanced-sssp' | 'dijkstra')}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
          disabled={isRunning}
        >
          <option value="enhanced-sssp">Enhanced SSSP</option>
          <option value="dijkstra">Dijkstra</option>
        </select>
      </div>

      {/* Graph Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Graph Size</label>
        <select
          value={graphSize}
          onChange={(e) => onGraphSizeChange(e.target.value as 'small' | 'medium' | 'large')}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
          disabled={isRunning}
        >
          <option value="small">Small (50 nodes)</option>
          <option value="medium">Medium (200 nodes)</option>
          <option value="large">Large (500 nodes)</option>
        </select>
      </div>

      {/* Mission Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Mission Type</label>
        <select
          value={currentMission}
          onChange={(e) => onMissionChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
          disabled={isRunning}
        >
          <option value="earth-orbit-insertion">Earth Orbit Insertion</option>
          <option value="geostationary-transfer">Geostationary Transfer</option>
          <option value="interplanetary-transfer">Interplanetary Transfer</option>
          <option value="asteroid-rendezvous">Asteroid Rendezvous</option>
          <option value="lunar-mission">Lunar Mission</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onRunDemo}
          disabled={isRunning}
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            isRunning 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-cyan-600 hover:bg-cyan-700'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Demo'}
        </button>
        
        <button
          onClick={onRunComparison}
          disabled={isRunning}
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            isRunning 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          Compare Algorithms
        </button>
      </div>
    </div>
  )
}
