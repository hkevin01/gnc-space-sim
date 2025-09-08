import { FAIRING_JETTISON_ALT, KARMAN_LINE, LAUNCH_LAT, MAX_Q_ALT, SCALE_HEIGHT, SEA_LEVEL_PRESSURE, STAGE1_BURN_TIME } from '../math/physics';
/**
 * Launch Mission Phases - Enhanced for SLS
 */
export var LaunchPhase;
(function (LaunchPhase) {
    LaunchPhase["PRELAUNCH"] = "prelaunch";
    LaunchPhase["LIFTOFF"] = "liftoff";
    LaunchPhase["BOOSTER_BURN"] = "booster_burn";
    LaunchPhase["STAGE1_BURN"] = "stage1_burn";
    LaunchPhase["MAX_Q"] = "max_q";
    LaunchPhase["BOOSTER_SEPARATION"] = "booster_separation";
    LaunchPhase["STAGE1_SEPARATION"] = "stage1_separation";
    LaunchPhase["CORE_STAGE_BURN"] = "core_stage_burn";
    LaunchPhase["LAS_JETTISON"] = "las_jettison";
    LaunchPhase["CORE_STAGE_MECO"] = "core_stage_meco";
    LaunchPhase["CORE_SEPARATION"] = "core_separation";
    LaunchPhase["UPPER_STAGE_IGNITION"] = "upper_stage_ignition";
    LaunchPhase["STAGE2_IGNITION"] = "stage2_ignition";
    LaunchPhase["FAIRING_JETTISON"] = "fairing_jettison";
    LaunchPhase["UPPER_STAGE_BURN"] = "upper_stage_burn";
    LaunchPhase["STAGE2_BURN"] = "stage2_burn";
    LaunchPhase["ORBITAL_INSERTION"] = "orbital_insertion";
    LaunchPhase["ORBIT_CIRCULARIZATION"] = "orbit_circularization";
    LaunchPhase["TLI_PREP"] = "tli_prep";
    LaunchPhase["TLI_BURN"] = "tli_burn";
})(LaunchPhase || (LaunchPhase = {}));
/**
 * Gravity Turn Launch Guidance Algorithm
 */
export class GravityTurnGuidance {
    target_orbit_altitude;
    target_inclination;
    pitch_start_velocity = 100;
    pitch_end_velocity = 2000;
    constructor(target_altitude, inclination) {
        this.target_orbit_altitude = target_altitude;
        this.target_inclination = inclination;
    }
    computeGuidance(state) {
        const velocity = state.velocity_magnitude;
        const altitude = state.altitude;
        let pitch;
        if (velocity < this.pitch_start_velocity) {
            pitch = Math.PI / 2;
        }
        else if (velocity < this.pitch_end_velocity) {
            const progress = (velocity - this.pitch_start_velocity) / (this.pitch_end_velocity - this.pitch_start_velocity);
            pitch = Math.PI / 2 * (1 - progress * 0.7); // Pitch from 90° to ~27°
        }
        else {
            // Shallow ascent for orbital insertion
            const target_pitch = Math.atan2(this.target_orbit_altitude - altitude, velocity * 60 // Look ahead 60 seconds
            );
            pitch = Math.max(target_pitch, 0.1); // Minimum 5.7° pitch
        }
        // Yaw Program: Launch Azimuth for Target Inclination
        const yaw = this.computeLaunchAzimuth(this.target_inclination);
        // Throttle Program: Manage Dynamic Pressure and Acceleration
        let throttle = 1.0;
        if (altitude > MAX_Q_ALT && altitude < KARMAN_LINE) {
            // Reduce throttle during max-Q phase
            throttle = 0.65;
        }
        return { pitch, yaw, throttle };
    }
    /**
     * Launch Azimuth Calculation
     *
     * β = arcsin(cos(i) / cos(φ))
     * where:
     * β = launch azimuth
     * i = target inclination
     * φ = launch site latitude
     */
    computeLaunchAzimuth(target_inclination) {
        const cos_inclination = Math.cos(target_inclination);
        const cos_latitude = Math.cos(LAUNCH_LAT);
        if (Math.abs(cos_inclination) > Math.abs(cos_latitude)) {
            // Direct launch possible
            return Math.asin(cos_inclination / cos_latitude);
        }
        else {
            // Dogleg maneuver required - simplified eastward launch
            return 0; // Due east
        }
    }
}
/**
 * Enhanced SLS-Specific Guidance Algorithm
 *
 * Supports high thrust-to-weight ratio vehicles like SLS with:
 * 1. Initial pitch kick maneuver
 * 2. Programmable pitch schedule
 * 3. SRB + Core Stage configuration
 * 4. Multiple staging events
 */
export class SLSGuidance extends GravityTurnGuidance {
    pitchKickDeg;
    pitchProgram;
    throttleProgram;
    constructor(target_altitude, inclination, pitchKickDeg = 5, pitchProgram, throttleProgram) {
        super(target_altitude, inclination);
        this.pitchKickDeg = pitchKickDeg;
        // Default SLS pitch program (optimized for high T/W)
        this.pitchProgram = pitchProgram || [
            { time: 0, pitch: 90 },
            { time: 10, pitch: 85 },
            { time: 20, pitch: 80 },
            { time: 40, pitch: 70 },
            { time: 60, pitch: 55 },
            { time: 90, pitch: 40 },
            { time: 120, pitch: 25 },
            { time: 180, pitch: 15 },
            { time: 300, pitch: 5 },
            { time: 480, pitch: 0 }
        ];
        // Default SLS throttle program
        this.throttleProgram = throttleProgram || [
            { time: 0, throttle: 1.0 },
            { time: 40, throttle: 0.67 }, // Max-Q throttle down
            { time: 70, throttle: 1.0 },
            { time: 126, throttle: 1.0 }, // SRB burnout
            { time: 400, throttle: 0.67 }, // MECO prep
            { time: 480, throttle: 0.0 }
        ];
    }
    /**
     * Compute SLS-specific guidance commands
     */
    computeGuidance(state) {
        const missionTime = state.mission_time;
        // Interpolate pitch from program
        const pitch = this.interpolatePitchProgram(missionTime) * Math.PI / 180;
        // Compute launch azimuth
        const yaw = this.computeLaunchAzimuth(this.target_inclination);
        // Interpolate throttle from program
        const throttle = this.interpolateThrottleProgram(missionTime);
        return { pitch, yaw, throttle };
    }
    /**
     * Interpolate pitch from time-based program
     */
    interpolatePitchProgram(time) {
        if (time <= this.pitchProgram[0].time) {
            return this.pitchProgram[0].pitch;
        }
        for (let i = 0; i < this.pitchProgram.length - 1; i++) {
            const t0 = this.pitchProgram[i].time;
            const t1 = this.pitchProgram[i + 1].time;
            if (time >= t0 && time <= t1) {
                const alpha = (time - t0) / (t1 - t0);
                return this.pitchProgram[i].pitch + alpha *
                    (this.pitchProgram[i + 1].pitch - this.pitchProgram[i].pitch);
            }
        }
        return this.pitchProgram[this.pitchProgram.length - 1].pitch;
    }
    /**
     * Interpolate throttle from time-based program
     */
    interpolateThrottleProgram(time) {
        if (time <= this.throttleProgram[0].time) {
            return this.throttleProgram[0].throttle;
        }
        for (let i = 0; i < this.throttleProgram.length - 1; i++) {
            const t0 = this.throttleProgram[i].time;
            const t1 = this.throttleProgram[i + 1].time;
            if (time >= t0 && time <= t1) {
                const alpha = (time - t0) / (t1 - t0);
                return this.throttleProgram[i].throttle + alpha *
                    (this.throttleProgram[i + 1].throttle - this.throttleProgram[i].throttle);
            }
        }
        return this.throttleProgram[this.throttleProgram.length - 1].throttle;
    }
}
/**
 * Atmospheric Model - Exponential Atmosphere
 *
 * ρ(h) = ρ₀ × e^(-h/H)
 * where:
 * ρ₀ = sea level density
 * H = scale height
 * h = altitude
 */
export function computeAtmosphere(altitude) {
    const pressure = SEA_LEVEL_PRESSURE * Math.exp(-altitude / SCALE_HEIGHT);
    const temperature = 288.15 - 0.0065 * Math.min(altitude, 11000); // Troposphere model
    const density = pressure / (287 * temperature); // Ideal gas law
    return { pressure, density, temperature };
}
/**
 * Aerodynamic Drag Calculation
 *
 * F_drag = ½ × ρ × v² × C_d × A
 * where:
 * ρ = atmospheric density
 * v = velocity magnitude
 * C_d = drag coefficient
 * A = reference area
 */
export function computeDrag(velocity, atmosphere, drag_coefficient = 0.3, reference_area = 10 // m²
) {
    const v_mag = Math.hypot(velocity[0], velocity[1], velocity[2]);
    if (v_mag === 0)
        return [0, 0, 0];
    const drag_magnitude = 0.5 * atmosphere.density * v_mag * v_mag *
        drag_coefficient * reference_area;
    // Drag force opposes velocity
    const unit_velocity = [
        velocity[0] / v_mag,
        velocity[1] / v_mag,
        velocity[2] / v_mag
    ];
    return [
        -drag_magnitude * unit_velocity[0],
        -drag_magnitude * unit_velocity[1],
        -drag_magnitude * unit_velocity[2]
    ];
}
/**
 * Enhanced Mission Phase Determination
 */
export function determineLaunchPhase(mission_time, altitude, velocity_magnitude) {
    if (mission_time < 0.1)
        return LaunchPhase.PRELAUNCH;
    if (mission_time < 5)
        return LaunchPhase.LIFTOFF;
    // Stage burns
    if (mission_time < STAGE1_BURN_TIME) {
        if (altitude > MAX_Q_ALT && altitude < MAX_Q_ALT + 5000) {
            return LaunchPhase.MAX_Q;
        }
        return LaunchPhase.STAGE1_BURN;
    }
    if (mission_time < STAGE1_BURN_TIME + 10)
        return LaunchPhase.STAGE1_SEPARATION;
    if (mission_time < STAGE1_BURN_TIME + 15)
        return LaunchPhase.STAGE2_IGNITION;
    if (altitude < FAIRING_JETTISON_ALT)
        return LaunchPhase.STAGE2_BURN;
    // Fairing jettison
    if (altitude < FAIRING_JETTISON_ALT + 10000)
        return LaunchPhase.FAIRING_JETTISON;
    // Orbital insertion
    if (velocity_magnitude < 7800) {
        return LaunchPhase.STAGE2_BURN;
    }
    return LaunchPhase.ORBITAL_INSERTION;
}
/**
 * Standard Launch Vehicle Configurations
 */
export const LAUNCH_VEHICLES = {
    FALCON_9: {
        stage1: {
            mass_dry: 25600, // kg
            mass_propellant: 395700, // kg
            thrust: 7607000, // N (sea level)
            isp: 282, // s (sea level)
            burn_time: 162 // s
        },
        stage2: {
            mass_dry: 4000, // kg
            mass_propellant: 92670, // kg
            thrust: 934000, // N (vacuum)
            isp: 348, // s (vacuum)
            burn_time: 397 // s
        },
        payload_mass: 22800, // kg (LEO)
        fairing_mass: 1750 // kg
    },
    ATLAS_V: {
        stage1: {
            mass_dry: 21054, // kg
            mass_propellant: 284450, // kg
            thrust: 3827000, // N
            isp: 311, // s
            burn_time: 253 // s
        },
        stage2: {
            mass_dry: 2086, // kg
            mass_propellant: 20830, // kg
            thrust: 99200, // N
            isp: 450, // s
            burn_time: 842 // s
        },
        payload_mass: 18850, // kg (LEO)
        fairing_mass: 1361 // kg
    }
};
