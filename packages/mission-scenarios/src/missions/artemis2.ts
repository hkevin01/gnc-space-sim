/**
 * Artemis II Mission Profile
 *
 * Mission overview: Crewed lunar flyby mission launched on SLS Block 1
 * Launch Site: Kennedy Space Center Launch Complex 39B
 * Target: Trans-Lunar Injection after Earth parking orbit
 * Crew: 4 astronauts in Orion spacecraft
 *
 * Mission phases:
 * 1. Ascent to 185km x 185km parking orbit (28.5° inclination)
 * 2. Coast and systems checkout
 * 3. Trans-Lunar Injection (TLI) burn
 * 4. Cislunar coast and lunar flyby
 * 5. Return trajectory and Earth splashdown
 *
 * Sources:
 * - NASA Artemis II Mission Overview (Public Domain)
 * - Launch Services Program User's Guide
 * - Kennedy Space Center Launch Site Data
 */

import { SLSBlock1, SLSVehicleConfig } from '../vehicles/sls_block1';

export interface LaunchSite {
  name: string;
  latitude: number; // degrees
  longitude: number; // degrees
  altitude: number; // meters above sea level
  azimuthRange: [number, number]; // degrees [min, max]
}

export interface TargetOrbit {
  altitude: number; // km (circular orbit)
  inclination: number; // degrees
  argumentOfPeriapsis?: number; // degrees
  longitudeOfAscendingNode?: number; // degrees
}

export interface MissionPhase {
  name: string;
  startTime: number; // seconds from liftoff
  duration: number; // seconds
  description: string;
  guidance?: GuidanceParameters;
}

export interface GuidanceParameters {
  pitchKick?: number; // degrees
  pitchProgram?: Array<{ time: number; pitch: number }>; // time-pitch pairs
  throttleProfile?: Array<{ time: number; throttle: number }>; // 0-1 throttle
  targetApogee?: number; // km
  targetPerigee?: number; // km
}

export interface Artemis2Mission {
  name: string;
  vehicle: SLSVehicleConfig;
  launchSite: LaunchSite;
  targetOrbit: TargetOrbit;
  phases: MissionPhase[];
  objectives: string[];
}

/**
 * Kennedy Space Center Launch Complex 39B
 * Historic launch site for Apollo, Space Shuttle, and now Artemis
 */
export const LC39B: LaunchSite = {
  name: 'LC-39B Kennedy Space Center',
  latitude: 28.6272, // degrees North
  longitude: -80.6206, // degrees West
  altitude: 16, // meters above sea level
  azimuthRange: [35, 120] // degrees (typical range for KSC)
};

/**
 * Artemis II Target Orbit
 * Low Earth Orbit for systems checkout before TLI
 */
export const Artemis2TargetOrbit: TargetOrbit = {
  altitude: 185, // km circular orbit
  inclination: 28.5, // degrees (optimized for KSC launch)
  argumentOfPeriapsis: 0,
  longitudeOfAscendingNode: 0 // Will be determined by launch time
};

/**
 * SLS Block 1 Ascent Guidance Profile
 * Optimized for high thrust-to-weight ratio and efficient gravity turn
 */
export const SLSAscentGuidance: GuidanceParameters = {
  pitchKick: 5, // degrees initial pitch maneuver after liftoff
  pitchProgram: [
    { time: 0, pitch: 90 }, // Vertical liftoff
    { time: 10, pitch: 85 }, // Small pitch kick
    { time: 20, pitch: 80 }, // Begin gravity turn
    { time: 40, pitch: 70 }, // Aggressive turn due to high T/W
    { time: 60, pitch: 55 }, // Continue pitching over
    { time: 90, pitch: 40 }, // Post-SRB separation
    { time: 120, pitch: 25 }, // Approaching horizontal
    { time: 180, pitch: 15 }, // Nearly horizontal
    { time: 300, pitch: 5 }, // Final ascent phase
    { time: 480, pitch: 0 } // Core stage MECO
  ],
  throttleProfile: [
    { time: 0, throttle: 1.0 }, // Full thrust liftoff
    { time: 40, throttle: 0.67 }, // Throttle down for Max-Q
    { time: 70, throttle: 1.0 }, // Throttle back up
    { time: 126, throttle: 1.0 }, // SRB burnout
    { time: 400, throttle: 0.67 }, // Throttle down for MECO
    { time: 480, throttle: 0.0 } // Core stage cutoff
  ]
};

/**
 * Complete Artemis II Mission Definition
 */
export const Artemis2Mission: Artemis2Mission = {
  name: 'Artemis II - Lunar Flyby',
  vehicle: SLSBlock1,
  launchSite: LC39B,
  targetOrbit: Artemis2TargetOrbit,
  phases: [
    {
      name: 'Pre-Launch',
      startTime: -1800, // T-30 minutes
      duration: 1800,
      description: 'Final countdown and systems checks'
    },
    {
      name: 'Liftoff',
      startTime: 0,
      duration: 10,
      description: 'SLS Block 1 liftoff from LC-39B',
      guidance: {
        pitchKick: 5,
        pitchProgram: SLSAscentGuidance.pitchProgram?.slice(0, 2)
      }
    },
    {
      name: 'Ascent - Booster Phase',
      startTime: 10,
      duration: 116,
      description: 'Ascent with SRBs and Core Stage firing',
      guidance: {
        pitchProgram: SLSAscentGuidance.pitchProgram?.slice(2, 5),
        throttleProfile: SLSAscentGuidance.throttleProfile?.slice(0, 3)
      }
    },
    {
      name: 'SRB Separation',
      startTime: 126,
      duration: 10,
      description: 'Solid Rocket Booster burnout and separation'
    },
    {
      name: 'Ascent - Core Stage Only',
      startTime: 136,
      duration: 344,
      description: 'Continued ascent on Core Stage engines only',
      guidance: {
        pitchProgram: SLSAscentGuidance.pitchProgram?.slice(5),
        throttleProfile: SLSAscentGuidance.throttleProfile?.slice(3)
      }
    },
    {
      name: 'Core Stage MECO',
      startTime: 480,
      duration: 10,
      description: 'Core Stage Main Engine Cutoff'
    },
    {
      name: 'ICPS Orbital Insertion',
      startTime: 550,
      duration: 115,
      description: 'ICPS first burn to achieve parking orbit',
      guidance: {
        targetApogee: 185,
        targetPerigee: 185
      }
    },
    {
      name: 'Parking Orbit Coast',
      startTime: 665,
      duration: 5435, // ~90 minutes
      description: 'Systems checkout in 185km circular orbit'
    },
    {
      name: 'TLI Burn Setup',
      startTime: 6100,
      duration: 300,
      description: 'Preparation for Trans-Lunar Injection'
    },
    {
      name: 'Trans-Lunar Injection',
      startTime: 6400,
      duration: 1200, // ~20 minutes
      description: 'ICPS second burn for lunar trajectory',
      guidance: {
        targetApogee: 400000, // km (lunar distance approximation)
        targetPerigee: 185 // km (maintain perigee)
      }
    },
    {
      name: 'Cislunar Coast',
      startTime: 7600,
      duration: 259200, // 3 days
      description: 'Coast to lunar encounter'
    }
  ],
  objectives: [
    'Demonstrate SLS Block 1 vehicle performance',
    'Validate Orion spacecraft systems in deep space',
    'Perform lunar flyby trajectory',
    'Test life support systems with crew',
    'Validate heat shield performance on lunar return',
    'Demonstrate mission operations capabilities'
  ]
};

/**
 * Mission Event Timeline
 * Critical events with precise timing for simulation
 */
export const Artemis2Timeline = [
  { time: 0, event: 'Liftoff', description: 'SLS Block 1 lifts off from LC-39B' },
  { time: 10, event: 'Pitch Kick', description: 'Initial pitch maneuver' },
  { time: 45, event: 'Max-Q', description: 'Maximum dynamic pressure' },
  { time: 126, event: 'SRB Burnout', description: 'Solid Rocket Booster burnout' },
  { time: 130, event: 'SRB Sep', description: 'SRB separation' },
  { time: 205, event: 'LAS Jettison', description: 'Launch Abort System jettison' },
  { time: 480, event: 'MECO', description: 'Main Engine Cutoff' },
  { time: 490, event: 'Stage Sep', description: 'Core Stage separation' },
  { time: 550, event: 'ICPS Ignition', description: 'ICPS first burn start' },
  { time: 665, event: 'Orbit Insert', description: 'Insertion into parking orbit' },
  { time: 6400, event: 'TLI', description: 'Trans-Lunar Injection burn' },
  { time: 7600, event: 'TLI Complete', description: 'TLI burn complete, lunar coast' }
];

/**
 * Calculate launch azimuth for target inclination
 * @param targetInclination Target orbital inclination in degrees
 * @param launchLatitude Launch site latitude in degrees
 * @returns Launch azimuth in degrees
 */
export function calculateLaunchAzimuth(targetInclination: number, launchLatitude: number): number {
  const inclRad = targetInclination * Math.PI / 180;
  const latRad = launchLatitude * Math.PI / 180;

  // Simplified calculation for eastward launch
  const azimuthRad = Math.asin(Math.cos(inclRad) / Math.cos(latRad));
  return azimuthRad * 180 / Math.PI;
}

/**
 * Get mission phase at given time
 * @param time Time from liftoff in seconds
 * @returns Current mission phase
 */
export function getCurrentPhase(time: number): MissionPhase | null {
  for (const phase of Artemis2Mission.phases) {
    if (time >= phase.startTime && time < phase.startTime + phase.duration) {
      return phase;
    }
  }
  return null;
}

export default Artemis2Mission;
