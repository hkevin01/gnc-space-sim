// @vitest-environment jsdom

import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

let lastCanvasProps: Record<string, unknown> | null = null

vi.mock('@react-three/fiber', () => ({
  Canvas: (props: Record<string, unknown>) => {
    lastCanvasProps = props
    return <div data-testid="canvas" />
  },
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
    lastCanvasProps = null
  })

  it('opens with a tight solar overview rather than a body-close camera', async () => {
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

    const camera = lastCanvasProps?.camera as { position?: [number, number, number] } | undefined
    expect(camera?.position).toBeDefined()
    expect(camera?.position?.[0]).toBeGreaterThan(45)
    expect(camera?.position?.[1]).toBeGreaterThan(10)
    expect(camera?.position?.[2]).toBeGreaterThan(40)

    const solarViewButton = Array.from(container.querySelectorAll('button')).find((element) => {
      return element.textContent?.trim() === 'Solar View'
    }) as HTMLButtonElement | undefined

    expect(solarViewButton?.className).toContain('btn-info')

    root.unmount()
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

  it('shows the outer planet legend in the launch controls', async () => {
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

    const legendText = container.textContent || ''
    expect(legendText).toContain('Outer planet index')
    expect(legendText).toContain('Mars')
    expect(legendText).toContain('Jupiter')
    expect(legendText).toContain('Saturn')
    expect(legendText).toContain('Uranus')
    expect(legendText).toContain('Neptune')

    root.unmount()
  })

  it('renders the launch shell within a small performance budget', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const start = performance.now()
    await act(async () => {
      root.render(
        <LaunchSimulation
          selectedMission="earthOrbit"
          currentPhase={null}
        />
      )
    })
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(60)

    root.unmount()
  })
})
