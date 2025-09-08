/**
 * NASA Space Launch System (SLS) Block 1 Configuration
 *
 * Vehicle specifications for the SLS Block 1 configuration consisting of:
 * - Core Stage with 4x RS-25 engines
 * - 2x 5-segment Solid Rocket Boosters (SRBs)
 * - Interim Cryogenic Propulsion Stage (ICPS) with RL10B-2
 * - Orion Multi-Purpose Crew Vehicle (MPCV) with Launch Abort System (LAS)
 *
 * Sources:
 * - NASA SLS Fact Sheet (Public Domain)
 * - NASA Launch Services Program User's Guide
 * - Artemis II Mission Overview (NASA, Public Domain)
 */
/**
 * SLS Block 1 Vehicle Configuration
 *
 * Total liftoff mass: ~2,600 metric tons
 * Total liftoff thrust: ~39.1 MN (8.8 million lbf)
 */
export const SLSBlock1 = {
    name: 'Space Launch System Block 1',
    stages: [
        // Solid Rocket Boosters (2x parallel)
        {
            name: 'SRB',
            dryMass: 98000, // kg each (includes structure, nozzle, recovery systems)
            propMass: 628000, // kg each (PBAN composite propellant)
            thrust: 16000000, // N vacuum thrust each (16 MN)
            thrustSL: 14700000, // N sea level thrust each (14.7 MN)
            isp: 269, // s vacuum specific impulse
            ispSL: 242, // s sea level specific impulse
            burnTime: 126, // s (burnout at T+126s)
            parallel: true,
            gimbalRange: 0 // SRBs are fixed, no gimbal
        },
        // Core Stage with 4x RS-25 engines
        {
            name: 'Core Stage',
            dryMass: 85000, // kg (includes engines, tanks, avionics)
            propMass: 1060000, // kg (LOX/LH2)
            thrust: 8800000, // N vacuum thrust total (4x 2.2 MN)
            thrustSL: 7440000, // N sea level thrust total (4x 1.86 MN)
            isp: 452, // s vacuum specific impulse (RS-25 engines)
            ispSL: 366, // s sea level specific impulse
            burnTime: 480, // s approximate (varies with throttling)
            gimbalRange: 8.5 // degrees (RS-25 gimbal range)
        },
        // Interim Cryogenic Propulsion Stage (ICPS)
        {
            name: 'ICPS',
            dryMass: 3500, // kg (modified Delta IV upper stage)
            propMass: 27000, // kg (LOX/LH2)
            thrust: 110000, // N (RL10B-2 engine)
            thrustSL: 0, // Not used at sea level
            isp: 465, // s vacuum specific impulse
            ispSL: 0,
            burnTime: 1125, // s (varies with mission requirements)
            gimbalRange: 4 // degrees
        }
    ],
    payload: {
        mass: 26520, // kg (Orion + ESM + LAS + adapters for Artemis II)
        name: 'Orion MPCV + LAS'
    },
    aerodynamics: {
        referenceArea: 33.18, // m² (based on 6.5m core diameter)
        dragCoefficient: 0.5 // approximate subsonic Cd
    },
    events: [
        {
            name: 'Liftoff',
            timeFromLiftoff: 0,
            description: 'SLS Block 1 lifts off from LC-39B'
        },
        {
            name: 'Max Q',
            timeFromLiftoff: 45,
            description: 'Maximum dynamic pressure'
        },
        {
            name: 'SRB Burnout',
            timeFromLiftoff: 126,
            condition: 'burnout',
            description: 'Solid Rocket Booster burnout'
        },
        {
            name: 'SRB Separation',
            timeFromLiftoff: 130,
            mass: 196000, // kg (2x SRB dry mass)
            description: 'Solid Rocket Booster separation'
        },
        {
            name: 'Launch Abort System Jettison',
            timeFromLiftoff: 205,
            mass: 8200, // kg (LAS tower mass)
            description: 'Launch Abort System tower jettison'
        },
        {
            name: 'Core Stage MECO',
            timeFromLiftoff: 480,
            condition: 'burnout',
            description: 'Core Stage Main Engine Cutoff'
        },
        {
            name: 'Core Stage Separation',
            timeFromLiftoff: 490,
            mass: 85000, // kg (Core Stage dry mass)
            description: 'Core Stage separation from ICPS'
        },
        {
            name: 'ICPS First Burn',
            timeFromLiftoff: 550,
            description: 'ICPS insertion burn to parking orbit'
        },
        {
            name: 'Orbital Insertion',
            timeFromLiftoff: 665,
            description: 'Insertion into 185km parking orbit'
        }
    ]
};
/**
 * Calculate mass flow rate from thrust and specific impulse
 * @param thrust Thrust in Newtons
 * @param isp Specific impulse in seconds
 * @returns Mass flow rate in kg/s
 */
export function calculateMassFlow(thrust, isp) {
    const g0 = 9.80665; // Standard gravity m/s²
    return thrust / (isp * g0);
}
/**
 * Get current vehicle mass including remaining propellant
 * @param config Vehicle configuration
 * @param timeFromLiftoff Current mission time in seconds
 * @returns Current vehicle mass in kg
 */
export function getCurrentVehicleMass(config, timeFromLiftoff) {
    let totalMass = config.payload.mass;
    for (const stage of config.stages) {
        let stageMass = stage.dryMass;
        // Calculate remaining propellant
        if (timeFromLiftoff < stage.burnTime) {
            const massFlow = calculateMassFlow(stage.thrust, stage.isp);
            const remainingProp = Math.max(0, stage.propMass - (massFlow * timeFromLiftoff));
            stageMass += remainingProp;
        }
        // Add mass for parallel stages (SRBs)
        if (stage.parallel) {
            totalMass += stageMass * 2;
        }
        else {
            totalMass += stageMass;
        }
    }
    // Subtract jettisoned masses
    for (const event of config.events) {
        if (event.mass && timeFromLiftoff > event.timeFromLiftoff) {
            totalMass -= event.mass;
        }
    }
    return totalMass;
}
/**
 * Get current thrust based on active stages
 * @param config Vehicle configuration
 * @param timeFromLiftoff Current mission time in seconds
 * @param altitude Current altitude in meters
 * @returns Current thrust in Newtons
 */
export function getCurrentThrust(config, timeFromLiftoff, altitude) {
    let totalThrust = 0;
    for (const stage of config.stages) {
        if (timeFromLiftoff < stage.burnTime) {
            // Use sea level thrust below 1000m, vacuum thrust above
            const thrust = altitude < 1000 ? stage.thrustSL : stage.thrust;
            if (stage.parallel) {
                totalThrust += thrust * 2; // Two SRBs
            }
            else {
                totalThrust += thrust;
            }
        }
    }
    return totalThrust;
}
/**
 * Export for use in mission scenarios
 */
export default SLSBlock1;
