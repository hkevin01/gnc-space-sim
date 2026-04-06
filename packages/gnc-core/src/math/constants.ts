/**
 * ID: GNC-CONST-001
 * Requirement: Provide authoritative gravitational parameters and the AU for
 *   all celestial bodies used in the simulation.
 * Purpose: Single source-of-truth for gravitational constants so that every
 *   orbit propagator and trajectory optimiser draws from the same values.
 * Rationale: Centralising constants eliminates unit-conversion bugs. Values
 *   are taken directly from IAU 2012 / NASA JPL DE430 ephemeris where noted.
 * Assumptions: SI units throughout (m, m^3/s^2).
 * Failure Modes: Wrong μ causes incorrect orbital period / energy; has no
 *   run-time fallback. Must be caught at compile/test time.
 * Constraints: Values are immutable compile-time constants; no division-by-zero
 *   is possible at call sites since none of these is zero.
 * Verification: physics.spec.ts TEST-PHYS-001 to TEST-PHYS-004.
 * References: IAU Working Group on Numerical Standards (2012);
 *   NASA JPL Planetary Fact Sheets; NIST CODATA 2018.
 */
export const MU_SUN = 1.32712440018e20 // m^3/s^2
export const MU_EARTH = 3.986004418e14 // m^3/s^2
export const MU_MARS = 4.282837e13 // m^3/s^2
export const AU = 1.495978707e11 // m
