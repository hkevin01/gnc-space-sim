import { useState } from 'react'

interface TrajectoryControlPanelProps {
  onAlgorithmChange: (algorithm: 'enhanced-sssp' | 'dijkstra') => void
  onGraphSizeChange: (size: 'small' | 'medium' | 'large') => void
  onMissionChange: (mission: string) => void
  onRunDemo: () => void
  onRunComparison: () => void
  onReset: () => void
  isRunning: boolean
  currentAlgorithm: 'enhanced-sssp' | 'dijkstra'
}

export function TrajectoryControlPanel({
  onAlgorithmChange,
  onGraphSizeChange,
  onMissionChange,
  onRunDemo,
  onRunComparison,
  onReset,
  isRunning,
  currentAlgorithm
}: TrajectoryControlPanelProps) {
  const [selectedMission, setSelectedMission] = useState('earth-orbit-insertion')
  const [selectedGraphSize, setSelectedGraphSize] = useState<'small' | 'medium' | 'large'>('medium')

  const missions = [
    { id: 'earth-orbit-insertion', name: '🌍 Earth Orbit Insertion', description: 'LEO circularization maneuver' },
    { id: 'geostationary-transfer', name: '🛰️ GEO Transfer', description: 'Multi-burn GTO to GEO' },
    { id: 'interplanetary-transfer', name: '🚀 Mars Transfer', description: 'Hohmann transfer to Mars' },
    { id: 'asteroid-rendezvous', name: '☄️ Asteroid Mission', description: 'Proximity operations' },
    { id: 'lunar-mission', name: '🌙 Lunar Mission', description: 'Trans-lunar injection' }
  ]

  const handleMissionChange = (missionId: string) => {
    setSelectedMission(missionId)
    onMissionChange(missionId)
  }

  const handleGraphSizeChange = (size: 'small' | 'medium' | 'large') => {
    setSelectedGraphSize(size)
    onGraphSizeChange(size)
  }

  return (
    <div className="absolute top-4 right-4 bg-zinc-900/90 text-zinc-100 p-4 rounded-lg border border-zinc-700 shadow-lg w-80 max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-zinc-200">
        🎯 Trajectory Planning Demo
      </h2>

      {/* Algorithm Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-amber-300">Algorithm</h3>
        <div className="space-y-2">
          <button
            onClick={() => onAlgorithmChange('enhanced-sssp')}
            className={`w-full p-2 text-sm rounded transition-colors ${
              currentAlgorithm === 'enhanced-sssp'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            ⚡ Enhanced SSSP (2-4x faster)
          </button>
          <button
            onClick={() => onAlgorithmChange('dijkstra')}
            className={`w-full p-2 text-sm rounded transition-colors ${
              currentAlgorithm === 'dijkstra'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            🐌 Classical Dijkstra
          </button>
        </div>
      </div>

      {/* Mission Scenario Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-amber-300">Mission Scenario</h3>
        <select
          value={selectedMission}
          onChange={(e) => handleMissionChange(e.target.value)}
          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
        >
          {missions.map((mission) => (
            <option key={mission.id} value={mission.id}>
              {mission.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-400 mt-1">
          {missions.find(m => m.id === selectedMission)?.description}
        </p>
      </div>

      {/* Graph Size Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-amber-300">Graph Complexity</h3>
        <div className="grid grid-cols-3 gap-1">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => handleGraphSizeChange(size)}
              className={`p-2 text-xs rounded transition-colors ${
                selectedGraphSize === size
                  ? 'bg-sky-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {size === 'small' ? '50 nodes' : size === 'medium' ? '200 nodes' : '500 nodes'}
            </button>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
    <div className="space-y-2">
        <button
          onClick={onRunDemo}
          disabled={isRunning}
      className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {isRunning ? '🔄 Running...' : '▶️ Run Algorithm Demo'}
        </button>

        <button
          onClick={onRunComparison}
          disabled={isRunning}
      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          📊 Performance Comparison
        </button>

        <button
          onClick={onReset}
      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          🔄 Reset Demo
        </button>
      </div>

      {/* Help Section */}
      <div className="mt-4 p-3 bg-sky-900/20 rounded border border-sky-800">
        <h4 className="text-sm font-semibold mb-2 text-sky-300">How to Use</h4>
        <ul className="text-xs space-y-1 text-zinc-300">
          <li>• Select algorithm and mission scenario</li>
          <li>• Choose graph complexity level</li>
          <li>• Run algorithm demo to see search process</li>
          <li>• Compare performance between algorithms</li>
          <li>• Use mouse to rotate and zoom the 3D view</li>
        </ul>
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-violet-900/20 rounded border border-violet-800">
        <h4 className="text-sm font-semibold mb-2 text-violet-300">Visualization Legend</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Start Position</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Target Position</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Current Search Node</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Visited Nodes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Optimal Path</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-1 bg-yellow-500"></div>
            <span>Active Edges</span>
          </div>
        </div>
      </div>
    </div>
  )
}
