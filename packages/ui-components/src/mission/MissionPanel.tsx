
export type Phase = 'leo' | 'escape' | 'cruise' | 'rendezvous' | 'proximity' | 'tag' | 'mars-transfer' | 'mars-arrival'

export type MissionPanelProps = {
  phase: Phase
  onChange?: (phase: Phase) => void
}

type PhaseItem = {
  key: Phase
  label: string
}

const phases: PhaseItem[] = [
  { key: 'leo', label: 'LEO' },
  { key: 'escape', label: 'Escape' },
  { key: 'cruise', label: 'Cruise' },
  { key: 'rendezvous', label: 'Rendezvous' },
  { key: 'proximity', label: 'Proximity Ops' },
  { key: 'tag', label: 'TAG' },
  { key: 'mars-transfer', label: 'Mars Transfer' },
  { key: 'mars-arrival', label: 'Mars Arrival' },
]

export function MissionPanel({ phase, onChange }: MissionPanelProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-300">Mission Phases</div>
      <ul className="text-sm space-y-1">
        {phases.map((p) => (
          <li key={p.key}>
            <button
              type="button"
              className={`w-full text-left px-2 py-1 rounded hover:bg-zinc-800 ${
                phase === p.key ? 'bg-zinc-800 text-white' : 'text-zinc-300'
              }`}
              onClick={() => onChange?.(p.key)}
            >
              {p.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
