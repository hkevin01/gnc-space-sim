import { createContext, ReactNode, useContext, useState } from 'react'

interface TerrainSettings {
  moonDisplacementScale: number
  marsDisplacementScale: number
  enableDisplacement: boolean
}

interface TerrainContextType {
  settings: TerrainSettings
  updateSetting: <K extends keyof TerrainSettings>(key: K, value: TerrainSettings[K]) => void
}

const defaultSettings: TerrainSettings = {
  moonDisplacementScale: 0.02,
  marsDisplacementScale: 0.05,
  enableDisplacement: true
}

const TerrainContext = createContext<TerrainContextType | undefined>(undefined)

export function TerrainControlsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TerrainSettings>(defaultSettings)

  const updateSetting = <K extends keyof TerrainSettings>(key: K, value: TerrainSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <TerrainContext.Provider value={{ settings, updateSetting }}>
      {children}
    </TerrainContext.Provider>
  )
}

export function useTerrain() {
  const context = useContext(TerrainContext)
  if (!context) {
    throw new Error('useTerrain must be used within a TerrainControlsProvider')
  }
  return context
}

export function TerrainControlsPanel() {
  const { settings, updateSetting } = useTerrain()

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      minWidth: '240px',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#fbbf24' }}>
        🏔️ Terrain Controls
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', color: '#d1d5db' }}>
          Enable Displacement
        </label>
        <input
          type="checkbox"
          checked={settings.enableDisplacement}
          onChange={(e) => updateSetting('enableDisplacement', e.target.checked)}
          style={{ marginRight: '8px' }}
        />
        <span>{settings.enableDisplacement ? 'Enabled' : 'Disabled'}</span>
      </div>

      {settings.enableDisplacement && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: '#d1d5db' }}>
              Moon Relief Scale: {settings.moonDisplacementScale.toFixed(3)}
            </label>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.001"
              value={settings.moonDisplacementScale}
              onChange={(e) => updateSetting('moonDisplacementScale', parseFloat(e.target.value))}
              style={{ width: '100%', marginBottom: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
              <span>0</span>
              <span>0.1</span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: '#d1d5db' }}>
              Mars Relief Scale: {settings.marsDisplacementScale.toFixed(3)}
            </label>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.001"
              value={settings.marsDisplacementScale}
              onChange={(e) => updateSetting('marsDisplacementScale', parseFloat(e.target.value))}
              style={{ width: '100%', marginBottom: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
              <span>0</span>
              <span>0.2</span>
            </div>
          </div>
        </>
      )}

      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', lineHeight: '1.4' }}>
        Note: Higher values exaggerate relief. Current displacement uses preview JPGs;
        use 16-bit PNGs for accurate elevation.
      </div>
    </div>
  )
}
