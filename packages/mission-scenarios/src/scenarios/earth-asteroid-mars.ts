import { LAUNCH_VEHICLES, LaunchPhase, LaunchVehicle } from '@gnc/core';

export interface MissionScenario {
  name: string
  seed: number
  launchWindow: { start: string; end: string }
  launch: {
    site: 'KSC' | 'Vandenberg' | 'Baikonur' | 'Kourou'
    vehicle: LaunchVehicle
    target_orbit: {
      altitude_km: number
      inclination_deg: number
      orbit_type: 'LEO' | 'GTO' | 'polar' | 'sun_sync'
    }
    phases: LaunchPhase[]
  }
  mission: {
    spacecraft_mass_kg: number
    propellant_mass_kg: number
    target: {
      name: string
      arrival_altitude_km: number
    }
  }
}

export const EARTH_ASTEROID_MARS: MissionScenario = {
  name: 'Earth→Asteroid→Mars Deep Space Mission',
  seed: 42,
  launchWindow: { start: '2031-04-01', end: '2031-06-15' },
  launch: {
    site: 'KSC',
    vehicle: LAUNCH_VEHICLES.FALCON_9,
    target_orbit: {
      altitude_km: 400,
      inclination_deg: 28.5,
      orbit_type: 'LEO'
    },
    phases: [
      LaunchPhase.PRELAUNCH,
      LaunchPhase.LIFTOFF,
      LaunchPhase.STAGE1_BURN,
      LaunchPhase.MAX_Q,
      LaunchPhase.STAGE1_SEPARATION,
      LaunchPhase.STAGE2_IGNITION,
      LaunchPhase.FAIRING_JETTISON,
      LaunchPhase.STAGE2_BURN,
      LaunchPhase.ORBITAL_INSERTION,
      LaunchPhase.ORBIT_CIRCULARIZATION
    ]
  },
  mission: {
    spacecraft_mass_kg: 1500,
    propellant_mass_kg: 800,
    target: {
      name: '1989 ML Near-Earth Asteroid',
      arrival_altitude_km: 5
    }
  }
}

export const LEO_DEPLOYMENT: MissionScenario = {
  name: 'LEO Satellite Deployment',
  seed: 123,
  launchWindow: { start: '2025-08-20', end: '2025-08-25' },
  launch: {
    site: 'KSC',
    vehicle: LAUNCH_VEHICLES.FALCON_9,
    target_orbit: {
      altitude_km: 550,
      inclination_deg: 53.0,
      orbit_type: 'LEO'
    },
    phases: [
      LaunchPhase.PRELAUNCH,
      LaunchPhase.LIFTOFF,
      LaunchPhase.STAGE1_BURN,
      LaunchPhase.MAX_Q,
      LaunchPhase.STAGE1_SEPARATION,
      LaunchPhase.STAGE2_IGNITION,
      LaunchPhase.FAIRING_JETTISON,
      LaunchPhase.STAGE2_BURN,
      LaunchPhase.ORBITAL_INSERTION
    ]
  },
  mission: {
    spacecraft_mass_kg: 500,
    propellant_mass_kg: 0,
    target: {
      name: 'Starlink Constellation',
      arrival_altitude_km: 550
    }
  }
}

export const POLAR_SCIENCE: MissionScenario = {
  name: 'Polar Earth Observation',
  seed: 456,
  launchWindow: { start: '2025-09-15', end: '2025-10-01' },
  launch: {
    site: 'Vandenberg',
    vehicle: LAUNCH_VEHICLES.ATLAS_V,
    target_orbit: {
      altitude_km: 700,
      inclination_deg: 98.2,
      orbit_type: 'sun_sync'
    },
    phases: [
      LaunchPhase.PRELAUNCH,
      LaunchPhase.LIFTOFF,
      LaunchPhase.STAGE1_BURN,
      LaunchPhase.MAX_Q,
      LaunchPhase.STAGE1_SEPARATION,
      LaunchPhase.STAGE2_IGNITION,
      LaunchPhase.FAIRING_JETTISON,
      LaunchPhase.STAGE2_BURN,
      LaunchPhase.ORBITAL_INSERTION,
      LaunchPhase.ORBIT_CIRCULARIZATION
    ]
  },
  mission: {
    spacecraft_mass_kg: 2500,
    propellant_mass_kg: 300,
    target: {
      name: 'Earth Climate Monitoring',
      arrival_altitude_km: 700
    }
  }
}
