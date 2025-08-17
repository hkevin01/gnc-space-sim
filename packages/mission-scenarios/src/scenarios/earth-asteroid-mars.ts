export interface MissionScenario {
  name: string
  seed: number
  launchWindow: { start: string; end: string }
  initialState: {
    orbit: 'LEO'
    altitudeKm: number
    massKg: number
  }
  target: {
    name: string
    arrivalAltitudeKm: number
  }
}

export const EARTH_ASTEROID_MARS: MissionScenario = {
  name: 'Earth→Asteroid→Mars',
  seed: 42,
  launchWindow: { start: '2031-04-01', end: '2031-06-15' },
  initialState: { orbit: 'LEO', altitudeKm: 400, massKg: 1500 },
  target: { name: '1989 ML', arrivalAltitudeKm: 5 },
}
