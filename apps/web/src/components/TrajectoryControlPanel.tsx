// apps/web/src/components/TrajectoryControlPanel.tsx
import React, { useState } from 'react'

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
  const [activeTab, setActiveTab] = useState<'control' | 'algorithms' | 'calculations' | 'formulas'>('control')

  const tabs = [
    { id: 'control' as const, label: '🎯 CONTROL', color: 'text-cyan-400' },
    { id: 'algorithms' as const, label: '⚡ ALGORITHMS', color: 'text-green-400' },
    { id: 'calculations' as const, label: '🧮 CALC', color: 'text-yellow-400' },
    { id: 'formulas' as const, label: '📐 FORMULAS', color: 'text-purple-400' }
  ]

  return (
    <div className="bg-black/95 backdrop-blur-sm border border-cyan-600 rounded-lg h-full flex flex-col w-80">
      {/* Header */}
      <div className="border-b border-zinc-600 p-4">
        <h2 className="text-xl font-bold text-white mb-2">Trajectory Planning & GNC</h2>
        <div className="text-sm text-zinc-400">Enhanced SSSP Algorithm Suite</div>
      </div>

      {/* Tab Headers */}
      <div className="flex border-b border-zinc-600">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-3 text-xs font-bold transition-colors ${
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
        {activeTab === 'control' && (
          <div className="space-y-4">
            <div className="text-cyan-400 font-bold text-sm mb-3">TRAJECTORY CONTROL</div>

            {/* Algorithm Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Algorithm</label>
              <select
                value={currentAlgorithm}
                onChange={(e) => onAlgorithmChange(e.target.value as 'enhanced-sssp' | 'dijkstra')}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                disabled={isRunning}
              >
                <option value="enhanced-sssp">Enhanced SSSP</option>
                <option value="dijkstra">Dijkstra</option>
              </select>
            </div>

            {/* Graph Size */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Graph Size</label>
              <select
                value={graphSize}
                onChange={(e) => onGraphSizeChange(e.target.value as 'small' | 'medium' | 'large')}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                disabled={isRunning}
              >
                <option value="small">Small (50 nodes)</option>
                <option value="medium">Medium (200 nodes)</option>
                <option value="large">Large (500 nodes)</option>
              </select>
            </div>

            {/* Mission Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Mission Type</label>
              <select
                value={currentMission}
                onChange={(e) => onMissionChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
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
            <div className="space-y-2 mt-6">
              <button
                onClick={onRunDemo}
                disabled={isRunning}
                className={`w-full py-3 px-4 rounded font-medium transition-colors ${
                  isRunning
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-700'
                }`}
              >
                {isRunning ? 'Running...' : '🚀 Run Demo'}
              </button>

              <button
                onClick={onRunComparison}
                disabled={isRunning}
                className={`w-full py-3 px-4 rounded font-medium transition-colors ${
                  isRunning
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                📊 Compare Algorithms
              </button>
            </div>
          </div>
        )}

        {activeTab === 'algorithms' && (
          <div className="space-y-4">
            <div className="text-green-400 font-bold text-sm mb-3">ALGORITHM STATUS</div>

            <div className="bg-green-900/30 p-3 rounded border border-green-600">
              <h4 className="text-green-300 font-bold mb-2">🎯 ENHANCED SSSP</h4>
              <div className="space-y-2 text-xs text-green-100">
                <div>• Hierarchical decomposition</div>
                <div>• Bidirectional search</div>
                <div>• Heuristic pruning</div>
                <div>• Parallel node processing</div>
              </div>
            </div>

            <div className="bg-blue-900/30 p-3 rounded border border-blue-600">
              <h4 className="text-blue-300 font-bold mb-2">📐 DIJKSTRA BASELINE</h4>
              <div className="space-y-2 text-xs text-blue-100">
                <div>• Classic shortest path</div>
                <div>• Priority queue</div>
                <div>• Guaranteed optimal</div>
                <div>• Single-source search</div>
              </div>
            </div>

            <div className="text-zinc-300 text-sm">
              <div className="font-bold text-green-400 mb-2">Current: {currentAlgorithm.toUpperCase()}</div>
              <div className="text-xs">
                {currentAlgorithm === 'enhanced-sssp'
                  ? 'Using advanced heuristics and parallel processing for optimal trajectory planning'
                  : 'Using classical Dijkstra algorithm for comparison baseline'
                }
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculations' && (
          <div className="space-y-4 font-mono">
            <div className="text-yellow-400 font-bold text-sm mb-3">REAL-TIME CALCULATIONS</div>

            <div className="bg-yellow-900/30 p-3 rounded border border-yellow-600">
              <h4 className="text-yellow-300 font-bold mb-2">📊 PERFORMANCE METRICS</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-yellow-200">Nodes Processed:</span>
                  <span className="text-white">{isRunning ? '...' : '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-200">Edges Relaxed:</span>
                  <span className="text-white">{isRunning ? '...' : '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-200">Search Time:</span>
                  <span className="text-white">{isRunning ? '...' : '0.0'} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-200">Path Length:</span>
                  <span className="text-white">{isRunning ? '...' : '0.0'}</span>
                </div>
              </div>
            </div>

            <div className="bg-cyan-900/30 p-3 rounded border border-cyan-600">
              <h4 className="text-cyan-300 font-bold mb-2">🚀 TRAJECTORY PARAMETERS</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-200">ΔV Total:</span>
                  <span className="text-white">0.0 km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200">Transfer Time:</span>
                  <span className="text-white">0.0 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200">Fuel Mass:</span>
                  <span className="text-white">0.0 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200">Efficiency:</span>
                  <span className="text-white">0.0%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="space-y-4 font-mono">
            <div className="text-purple-400 font-bold text-sm mb-3">MATHEMATICAL FORMULAS</div>

            <div className="bg-purple-900/30 p-3 rounded border border-purple-600">
              <h4 className="text-purple-300 font-bold mb-2">🔗 GRAPH THEORY</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-purple-200 font-semibold">Shortest Path:</div>
                  <div className="ml-2">d[v] = min(d[u] + w(u,v))</div>
                </div>
                <div>
                  <div className="text-purple-200 font-semibold">Relaxation:</div>
                  <div className="ml-2">if d[u] + w(u,v) &lt; d[v]</div>
                  <div className="ml-4">then d[v] = d[u] + w(u,v)</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/30 p-3 rounded border border-blue-600">
              <h4 className="text-blue-300 font-bold mb-2">🚀 ORBITAL MECHANICS</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-blue-200 font-semibold">Vis-Viva Equation:</div>
                  <div className="ml-2">v² = μ(2/r - 1/a)</div>
                </div>
                <div>
                  <div className="text-blue-200 font-semibold">Hohmann Transfer:</div>
                  <div className="ml-2">ΔV = √(μ/r₁) × (√(2r₂/(r₁+r₂)) - 1)</div>
                </div>
                <div>
                  <div className="text-blue-200 font-semibold">Lambert's Problem:</div>
                  <div className="ml-2">TOF = √(a³/μ) × (E - e×sin(E))</div>
                </div>
              </div>
            </div>

            <div className="bg-green-900/30 p-3 rounded border border-green-600">
              <h4 className="text-green-300 font-bold mb-2">⚡ OPTIMIZATION</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-green-200 font-semibold">Cost Function:</div>
                  <div className="ml-2">J = ∫ L(x, u, t) dt</div>
                </div>
                <div>
                  <div className="text-green-200 font-semibold">Bellman Equation:</div>
                  <div className="ml-2">V(x) = min[L(x,u) + V(f(x,u))]</div>
                </div>
                <div>
                  <div className="text-green-200 font-semibold">A* Heuristic:</div>
                  <div className="ml-2">f(n) = g(n) + h(n)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
