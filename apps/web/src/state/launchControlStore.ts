import { LaunchPhase, LaunchState } from '@gnc/core'
import { create } from 'zustand'

// Initial state for launch simulation
const initialState: LaunchState = {
  r: [6371000, 0, 0], // Earth surface radius in meters
  v: [0, 0, 0],       // Initial velocity
  phase: LaunchPhase.PRELAUNCH,
  mission_time: -10,
  altitude: 0,
  velocity_magnitude: 0,
  flight_path_angle: 0,
  heading: 1.5708, // 90 degrees (East)
  mass: 549054,     // Falcon Heavy mass
  thrust: [0, 0, 0],
  drag: [0, 0, 0],
  atmosphere: {
    pressure: 101325,
    density: 1.225,
    temperature: 288.15
  },
  guidance: {
    pitch_program: 0,
    yaw_program: 1.5708,
    throttle: 0
  }
}

export interface LaunchControlState {
  isLaunched: boolean
  launchTime: number
  currentState: LaunchState | null
  setLaunchTime: (time: number | ((prev: number) => number)) => void
  setCurrentState: (state: LaunchState | null) => void
  initiateLaunch: () => void
  resetLaunch: () => void
}

export const useLaunchControl = create<LaunchControlState>((set) => ({
  isLaunched: false,
  launchTime: -10,
  currentState: initialState, // Initialize with initialState instead of null
  setLaunchTime: (time) => {
    if (typeof time === 'function') {
      set((state) => ({ launchTime: time(state.launchTime) }))
    } else {
      set({ launchTime: time })
    }
  },
  setCurrentState: (state) => set({ currentState: state }),
  initiateLaunch: () => {
    const launchState: LaunchState = {
      ...initialState,
      phase: LaunchPhase.PRELAUNCH,
      mission_time: -10 // Start with -10 second countdown
    }
    set({
      isLaunched: true,
      launchTime: -10, // Start countdown at -10 seconds
      currentState: launchState
    })

    // Auto-progress through countdown to actual launch
    const countdownInterval = setInterval(() => {
      set((state) => {
        const newTime = state.launchTime + 1
        if (newTime >= 0) {
          clearInterval(countdownInterval)
          return {
            ...state,
            launchTime: 0,
            currentState: {
              ...state.currentState!,
              phase: LaunchPhase.STAGE1_BURN,
              mission_time: 0
            }
          }
        }
        return {
          ...state,
          launchTime: newTime,
          currentState: {
            ...state.currentState!,
            mission_time: newTime
          }
        }
      })
    }, 100) // Update every 100ms for smooth countdown
  },
  resetLaunch: () => {

    set({
      isLaunched: false,
      launchTime: -10,
      currentState: initialState // Reset to initial state instead of null
    })
  },
}))
