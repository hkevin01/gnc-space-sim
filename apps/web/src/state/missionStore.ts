import { create } from 'zustand'

type Phase = 'leo' | 'escape' | 'cruise' | 'rendezvous' | 'proximity' | 'tag' | 'mars-transfer' | 'mars-arrival'

interface MissionState {
  phase: Phase
  setPhase: (p: Phase) => void
}

export const useMissionStore = create<MissionState>((set) => ({
  phase: 'leo',
  setPhase: (p) => set({ phase: p }),
}))
