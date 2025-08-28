/**
 * Thrust Curve Utilities for Rocket Engines
 *
 * Provides interpolation and modeling for engine thrust profiles,
 * particularly for solid rocket motors with complex burn characteristics.
 *
 * Sources:
 * - Rocket Propulsion Elements (Sutton & Biblarz)
 * - NASA Solid Rocket Motor Performance Data
 * - SLS Booster Performance Characteristics (Public Domain)
 */

export interface ThrustPoint {
  time: number; // seconds from ignition
  thrust: number; // fraction of maximum thrust (0-1)
}

export interface ThrustProfile {
  name: string;
  duration: number; // seconds
  maxThrust: number; // Newtons
  points: ThrustPoint[];
}

/**
 * Interpolate thrust value at given time using linear interpolation
 * @param time Time from ignition in seconds
 * @param profile Thrust profile to interpolate
 * @returns Thrust value in Newtons
 */
export function interpolateThrust(time: number, profile: ThrustProfile): number {
  // Clamp time to profile duration
  if (time <= 0) return profile.points[0]?.thrust * profile.maxThrust || 0;
  if (time >= profile.duration) return 0;

  const points = profile.points;

  // Find surrounding points
  let i = 0;
  while (i < points.length - 1 && points[i + 1].time <= time) {
    i++;
  }

  // If exact match or at end
  if (i === points.length - 1 || points[i].time === time) {
    return points[i].thrust * profile.maxThrust;
  }

  // Linear interpolation
  const t0 = points[i].time;
  const t1 = points[i + 1].time;
  const thrust0 = points[i].thrust;
  const thrust1 = points[i + 1].thrust;

  const alpha = (time - t0) / (t1 - t0);
  const thrustFraction = thrust0 + alpha * (thrust1 - thrust0);

  return thrustFraction * profile.maxThrust;
}

/**
 * SLS 5-Segment Solid Rocket Booster Thrust Profile
 *
 * Based on NASA performance data showing:
 * - High initial thrust for liftoff
 * - Slight reduction during burn
 * - Tail-off at burnout
 *
 * Source: NASA SLS Booster Performance (Public Domain)
 */
export const SLSSRBThrustProfile: ThrustProfile = {
  name: 'SLS 5-Segment SRB',
  duration: 126, // seconds
  maxThrust: 16000000, // 16 MN peak thrust
  points: [
    { time: 0, thrust: 0.95 }, // Initial ignition
    { time: 2, thrust: 1.0 }, // Peak thrust
    { time: 10, thrust: 0.98 }, // Slight reduction
    { time: 30, thrust: 0.96 }, // Steady burn
    { time: 60, thrust: 0.94 }, // Gradual decrease
    { time: 90, thrust: 0.90 }, // Continued burn
    { time: 110, thrust: 0.85 }, // Tail-off begins
    { time: 120, thrust: 0.50 }, // Rapid tail-off
    { time: 125, thrust: 0.10 }, // Burnout approach
    { time: 126, thrust: 0.0 } // Complete burnout
  ]
};

/**
 * Generic Liquid Rocket Engine Thrust Profile
 * Represents steady-state liquid engines like RS-25
 */
export const LiquidEngineProfile: ThrustProfile = {
  name: 'Generic Liquid Engine',
  duration: 480, // seconds (typical for SLS Core Stage)
  maxThrust: 2200000, // 2.2 MN per RS-25 engine
  points: [
    { time: 0, thrust: 0.0 }, // Engine start
    { time: 3, thrust: 0.7 }, // Startup transient
    { time: 6, thrust: 1.0 }, // Full thrust
    { time: 470, thrust: 1.0 }, // Steady operation
    { time: 475, thrust: 0.8 }, // Throttle down for MECO
    { time: 480, thrust: 0.0 } // Engine cutoff
  ]
};

/**
 * Upper Stage Engine Profile (RL10 class)
 * Multiple restart capability with consistent performance
 */
export const UpperStageProfile: ThrustProfile = {
  name: 'RL10 Upper Stage Engine',
  duration: 1200, // seconds (multiple burns possible)
  maxThrust: 110000, // 110 kN
  points: [
    { time: 0, thrust: 0.0 }, // Engine start
    { time: 5, thrust: 0.5 }, // Startup transient
    { time: 10, thrust: 1.0 }, // Full thrust
    { time: 1190, thrust: 1.0 }, // Steady operation
    { time: 1200, thrust: 0.0 } // Engine cutoff
  ]
};

/**
 * Calculate total impulse from thrust profile
 * @param profile Thrust profile
 * @returns Total impulse in Newton-seconds
 */
export function calculateTotalImpulse(profile: ThrustProfile): number {
  let totalImpulse = 0;

  for (let i = 0; i < profile.points.length - 1; i++) {
    const dt = profile.points[i + 1].time - profile.points[i].time;
    const avgThrust = (profile.points[i].thrust + profile.points[i + 1].thrust) / 2;
    totalImpulse += avgThrust * profile.maxThrust * dt;
  }

  return totalImpulse;
}

/**
 * Calculate average specific impulse over burn duration
 * @param profile Thrust profile
 * @param propellantMass Total propellant mass in kg
 * @returns Average specific impulse in seconds
 */
export function calculateAverageIsp(profile: ThrustProfile, propellantMass: number): number {
  const totalImpulse = calculateTotalImpulse(profile);
  const g0 = 9.80665; // Standard gravity
  return totalImpulse / (propellantMass * g0);
}

/**
 * Create custom thrust profile from simplified parameters
 * @param maxThrust Maximum thrust in Newtons
 * @param burnTime Total burn duration in seconds
 * @param thrustProfile Simplified profile: 'steady', 'progressive', 'regressive'
 * @returns Complete thrust profile
 */
export function createThrustProfile(
  maxThrust: number,
  burnTime: number,
  thrustProfile: 'steady' | 'progressive' | 'regressive' = 'steady'
): ThrustProfile {
  const points: ThrustPoint[] = [
    { time: 0, thrust: 0.0 }
  ];

  switch (thrustProfile) {
    case 'steady':
      points.push(
        { time: burnTime * 0.05, thrust: 1.0 },
        { time: burnTime * 0.95, thrust: 1.0 },
        { time: burnTime, thrust: 0.0 }
      );
      break;

    case 'progressive':
      points.push(
        { time: burnTime * 0.1, thrust: 0.7 },
        { time: burnTime * 0.5, thrust: 0.9 },
        { time: burnTime * 0.9, thrust: 1.0 },
        { time: burnTime, thrust: 0.0 }
      );
      break;

    case 'regressive':
      points.push(
        { time: burnTime * 0.1, thrust: 1.0 },
        { time: burnTime * 0.5, thrust: 0.9 },
        { time: burnTime * 0.9, thrust: 0.7 },
        { time: burnTime, thrust: 0.0 }
      );
      break;
  }

  return {
    name: `Custom ${thrustProfile} profile`,
    duration: burnTime,
    maxThrust,
    points
  };
}

/**
 * Validate thrust profile for consistency
 * @param profile Thrust profile to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateThrustProfile(profile: ThrustProfile): string[] {
  const errors: string[] = [];

  if (profile.points.length < 2) {
    errors.push('Profile must have at least 2 points');
  }

  if (profile.duration <= 0) {
    errors.push('Duration must be positive');
  }

  if (profile.maxThrust <= 0) {
    errors.push('Maximum thrust must be positive');
  }

  // Check time ordering
  for (let i = 1; i < profile.points.length; i++) {
    if (profile.points[i].time <= profile.points[i - 1].time) {
      errors.push(`Time points must be increasing (point ${i})`);
    }
  }

  // Check thrust bounds
  for (let i = 0; i < profile.points.length; i++) {
    const thrust = profile.points[i].thrust;
    if (thrust < 0 || thrust > 1) {
      errors.push(`Thrust fraction must be 0-1 (point ${i}: ${thrust})`);
    }
  }

  // Check start and end
  if (profile.points[0].time !== 0) {
    errors.push('Profile must start at time 0');
  }

  if (Math.abs(profile.points[profile.points.length - 1].time - profile.duration) > 1e-6) {
    errors.push('Last point time must match duration');
  }

  return errors;
}

export default {
  interpolateThrust,
  SLSSRBThrustProfile,
  LiquidEngineProfile,
  UpperStageProfile,
  calculateTotalImpulse,
  calculateAverageIsp,
  createThrustProfile,
  validateThrustProfile
};
