/**
 * Extended GNC Mathematical Constants and Physical Parameters
 */

// Gravitational Parameters (μ = GM) [m³/s²] - Additional bodies
export const MU_MOON = 4.9048695e12
export const MU_JUPITER = 1.26686534e17
export const MU_VENUS = 3.24858592e14

// Physical Constants
export const G = 6.67430e-11 // Gravitational constant [m³/kg⋅s²]
export const C = 299792458 // Speed of light [m/s]
export const J2000_EPOCH = 2451545.0 // Julian Date for J2000.0

// Earth Physical Parameters
export const EARTH_RADIUS = 6371000 // Mean radius [m]
export const EARTH_MASS = 5.972e24 // Mass [kg]
export const EARTH_J2 = 1.08262668e-3 // J2 coefficient (oblateness)
export const EARTH_ROTATION_RATE = 7.2921159e-5 // Angular velocity [rad/s]
export const EARTH_FLATTENING = 1/298.257223563 // WGS84 flattening

// Mars Physical Parameters
export const MARS_RADIUS = 3389500 // Mean radius [m]
export const MARS_MASS = 6.39e23 // Mass [kg]
export const MARS_ROTATION_RATE = 7.088e-5 // Angular velocity [rad/s]

// Conversion Factors
export const DEG_TO_RAD = Math.PI / 180
export const RAD_TO_DEG = 180 / Math.PI
export const KM_TO_M = 1000
export const M_TO_KM = 1e-3

// Mission Design Constants
export const LAUNCH_SITE_ALT = 0 // Launch from sea level [m]
export const PARKING_ORBIT_ALT = 200000 // Standard parking orbit altitude [m]
export const GEO_ORBIT_ALT = 35786000 // Geostationary orbit altitude [m]
export const LEO_UPPER_LIMIT = 2000000 // Upper limit of LEO [m]

// Launch Vehicle Parameters
export const STAGE1_BURN_TIME = 150 // First stage burn duration [s]
export const STAGE2_BURN_TIME = 400 // Second stage burn duration [s]
export const FAIRING_JETTISON_ALT = 100000 // Fairing jettison altitude [m]
export const STAGE1_SEPARATION_ALT = 70000 // Stage 1 separation altitude [m]

// Atmosphere Parameters
export const SEA_LEVEL_PRESSURE = 101325 // Pa
export const SCALE_HEIGHT = 8400 // Atmospheric scale height [m]
export const KARMAN_LINE = 100000 // Space boundary [m]
export const MAX_Q_ALT = 12000 // Typical max dynamic pressure altitude [m]

// Launch Site Parameters (Cape Canaveral as reference)
export const LAUNCH_LAT = 28.608 * DEG_TO_RAD // Launch latitude [rad]
export const LAUNCH_LON = -80.604 * DEG_TO_RAD // Launch longitude [rad]
export const EARTH_SURFACE_VELOCITY = EARTH_ROTATION_RATE * EARTH_RADIUS * Math.cos(LAUNCH_LAT) // Surface velocity [m/s]

// Spacecraft Performance Parameters
export const TYPICAL_ISP = 300 // Specific impulse [s]
export const TYPICAL_THRUST = 1000 // Typical thruster force [N]
export const STANDARD_GRAVITY = 9.80665 // Standard gravitational acceleration [m/s²]
