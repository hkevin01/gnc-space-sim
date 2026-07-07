// @vitest-environment jsdom

import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="canvas" />,
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
}))

vi.mock('../components/LaunchDemo', () => ({
  LaunchDemo: () => <div data-testid="launch-demo" />,
}))

vi.mock('../components/SolarSystem', () => ({
  getBodyPositionRelativeToCenter: vi.fn((body: string) => {
    switch (body) {
      case 'EARTH':
        return [0, 0, 0]
      case 'MARS':
        return [1, 2, 3]
      case 'SUN':
        return [4, 5, 6]
      case 'JUPITER':
        return [7, 8, 9]
      default:
        return [0, 0, 0]
    }
  }),
  getBodySceneRadius: vi.fn(() => 1),
  getMaxHeliocentricOrbitRadius: vi.fn(() => 100),
}))

import { LaunchSimulation } from '../components/LaunchSimulation'

describe('LaunchSimulation target selection', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('toggles the active highlight when snap target buttons are selected', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <LaunchSimulation
          selectedMission="earthOrbit"
          currentPhase={null}
        />
      )
    })

    const getButton = (label: string) => {
      const button = Array.from(container.querySelectorAll('button')).find((element) => {
        return element.textContent?.trim() === label
      })

      if (!button) {
        throw new Error(`Missing button: ${label}`)
      }

      return button as HTMLButtonElement
    }

    const solarViewButton = getButton('Solar View')
    const marsButton = getButton('Mars')

    expect(solarViewButton.className).toContain('btn-info')
    expect(marsButton.className).toContain('btn-outline-danger')

    await act(async () => {
      marsButton.click()
    })

    expect(marsButton.className).toContain('btn-danger')
    expect(solarViewButton.className).toContain('btn-outline-info')

    root.unmount()
  })
})
