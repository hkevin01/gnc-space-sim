import { create } from 'zustand'

export type Phase = string

export interface MissionState {
  phase: Phase
  setPhase: (p: Phase) => void
}

export const useMissionStore = create<MissionState>((set) => ({
  phase: 'leo',
  setPhase: (p) => set({ phase: p }),
}))
