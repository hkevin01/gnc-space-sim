/**
 * ID: GNC-INTG-001
 * Requirement: Implement multi-stage vehicle mass-flow, staging-event, and
 *   thrust-aggregation logic for the SLS Block 1 (four-stage) configuration.
 * Purpose: Provide the propulsion and mass model that drives the physical
 *   simulation; accurate mass history is critical for T/W, drag, and
 *   trajectory integration.
 * Rationale: A discrete staging-event system (trigger on time or altitude)
 *   cleanly separates propulsion physics from navigation/guidance concerns and
 *   allows unit-testing of each staging event independently.
 * Inputs:
 *   stages [StageConfig[]] – dry mass, propellant mass, thrust (SL + vac),
 *     Isp (SL + vac), optional thrust profile, `parallel` flag for SRBs
 *   stagingEvents [StagingEvent[]] – jettison/ignition events with condition
 *     type ('time'|'altitude') and trigger value
 *   payloadMass [kg] – adapter + spacecraft mass
 * Outputs: VehicleState per update() call — mass [kg], thrust [N], stage
 *   propellant remaining [kg], activeStages []
 * Preconditions: All config values > 0; stagingEvents sorted by trigger value.
 * Postconditions: mass decreases monotonically; thrust = 0 after all burnouts.
 * Assumptions: Atmosphere is simplified (uses altitude < 1000 m for SL thrust);
 *   no TVC misalignment or cosine losses modelled here.
 * Failure Modes: Misconfigured staging event times → engine remains active after
 *   burnout → mass goes negative → simulation diverges. Propellant is clamped to 0.
 * Constraints: Each `update()` call must be forward in time (time ≥ prev time).
 * Verification: vehicleIntegrator.spec.ts TEST-VINT-001 to TEST-VINT-012.
 * References: SLS Block 1 user guide (NASA/TM-2019-220230);
 *   Sutton & Biblarz "Rocket Propulsion Elements" §10.
 */
/**
 * Launch Vehicle Integration and Staging for SLS
 *
 * Handles mass flow, thrust calculations, and staging events
 * for multi-stage vehicles with parallel boosters (SRBs).
 *
 * Key features:
 * - Parallel booster support (SRB + Core Stage)
 * - Mass tracking with jettison events
 * - Thrust aggregation across active stages
 * - Staging condition monitoring
 */
import { interpolateThrust } from '../engines/thrust_curves';
/**
 * Multi-Stage Vehicle Integration System
 *
 * Manages staging, mass flow, and thrust calculation for complex vehicles
 */
export class VehicleIntegrator {
    stages;
    stagingEvents;
    currentState;
    payloadMass; // kg
    constructor(stages, stagingEvents, payloadMass) {
        this.stages = new Map();
        stages.forEach(stage => this.stages.set(stage.name, stage));
        this.stagingEvents = stagingEvents.sort((a, b) => {
            // Sort by time/value for event processing
            if (a.condition === 'time' && b.condition === 'time') {
                return a.value - b.value;
            }
            return 0;
        });
        this.payloadMass = payloadMass;
        this.currentState = this.initializeState();
    }
    /**
     * Initialize vehicle state at liftoff
     */
    initializeState() {
        const stageStates = [];
        let totalMass = this.payloadMass;
        const activeStages = [];
        for (const [name, config] of this.stages) {
            const stageState = {
                name,
                active: true, // All stages start active (SRBs + Core)
                burnTime: 0,
                propRemaining: config.propMass,
                thrust: 0
            };
            stageStates.push(stageState);
            totalMass += config.dryMass + config.propMass;
            activeStages.push(name);
        }
        return {
            time: 0,
            altitude: 0,
            velocity: 0,
            mass: totalMass,
            thrust: 0,
            stages: stageStates,
            activeStages
        };
    }
    /**
     * Update vehicle state for given mission time
     */
    update(time, altitude, velocity) {
        const deltaTime = time - this.currentState.time;
        // Update stage burn times and propellant consumption
        this.updateStages(deltaTime, altitude);
        // Check for staging events
        this.processEvents(time, altitude, velocity);
        // Calculate current total mass and thrust
        this.calculateMassAndThrust();
        this.currentState.time = time;
        this.currentState.altitude = altitude;
        this.currentState.velocity = velocity;
        return { ...this.currentState };
    }
    /**
     * Update individual stage states
     */
    updateStages(deltaTime, altitude) {
        for (const stageState of this.currentState.stages) {
            if (!stageState.active)
                continue;
            const config = this.stages.get(stageState.name);
            // Update burn time
            stageState.burnTime += deltaTime;
            // Calculate current thrust (altitude-dependent)
            const currentThrust = this.getStageThrust(config, stageState.burnTime, altitude);
            stageState.thrust = currentThrust;
            // Calculate mass flow and update propellant
            if (currentThrust > 0) {
                const isp = altitude < 1000 ? config.ispSL : config.isp;
                const massFlow = currentThrust / (isp * 9.80665); // kg/s
                stageState.propRemaining = Math.max(0, stageState.propRemaining - massFlow * deltaTime);
                // Check for burnout
                if (stageState.propRemaining <= 0) {
                    stageState.active = false;
                    stageState.thrust = 0;
                }
            }
        }
    }
    /**
     * Get current thrust for a stage
     */
    getStageThrust(config, burnTime, altitude) {
        // Use thrust profile if available
        if (config.thrustProfile) {
            return interpolateThrust(burnTime, config.thrustProfile);
        }
        // Use constant thrust based on altitude
        const baseThrust = altitude < 1000 ? config.thrustSL : config.thrust;
        // Simple thrust curve: full thrust until burnout
        const totalBurnTime = config.propMass / this.calculateMassFlow(config.thrust, config.isp);
        if (burnTime < totalBurnTime) {
            return baseThrust;
        }
        return 0;
    }
    /**
     * Calculate mass flow rate
     */
    calculateMassFlow(thrust, isp) {
        return thrust / (isp * 9.80665);
    }
    /**
     * Process staging events
     */
    processEvents(time, altitude, velocity) {
        for (const event of this.stagingEvents) {
            if (this.isEventTriggered(event, time, altitude, velocity)) {
                this.executeEvent(event);
            }
        }
    }
    /**
     * Check if staging event is triggered
     */
    isEventTriggered(event, time, altitude, velocity) {
        switch (event.condition) {
            case 'time':
                return time >= event.value;
            case 'altitude':
                return altitude >= event.value;
            case 'velocity':
                return velocity >= event.value;
            case 'burnout': {
                // Check if specified stage has burned out
                const stage = this.currentState.stages.find(s => s.name === event.name);
                return stage ? stage.propRemaining <= 0 : false;
            }
            default:
                return false;
        }
    }
    /**
     * Execute staging event
     */
    executeEvent(event) {
        // Handle stage jettison
        if (event.jettison) {
            const stageIndex = this.currentState.stages.findIndex(s => s.name === event.jettison.stageName);
            if (stageIndex >= 0) {
                this.currentState.stages[stageIndex].active = false;
                this.currentState.activeStages = this.currentState.activeStages.filter(name => name !== event.jettison.stageName);
                // Remove jettisoned mass
                this.currentState.mass -= event.jettison.mass;
            }
        }
        // Handle stage ignition
        if (event.ignition) {
            const stageIndex = this.currentState.stages.findIndex(s => s.name === event.ignition.stageName);
            if (stageIndex >= 0) {
                this.currentState.stages[stageIndex].active = true;
                this.currentState.stages[stageIndex].burnTime = 0;
                if (!this.currentState.activeStages.includes(event.ignition.stageName)) {
                    this.currentState.activeStages.push(event.ignition.stageName);
                }
            }
        }
    }
    /**
     * Calculate total vehicle mass and thrust
     */
    calculateMassAndThrust() {
        let totalMass = this.payloadMass;
        let totalThrust = 0;
        for (const stageState of this.currentState.stages) {
            if (stageState.active) {
                const config = this.stages.get(stageState.name);
                // Add stage dry mass and remaining propellant
                totalMass += config.dryMass + stageState.propRemaining;
                // Add thrust (multiply by 2 for parallel boosters like SRBs)
                const multiplier = config.parallel ? 2 : 1;
                totalThrust += stageState.thrust * multiplier;
            }
        }
        this.currentState.mass = totalMass;
        this.currentState.thrust = totalThrust;
    }
    /**
     * Get current vehicle state
     */
    getState() {
        return { ...this.currentState };
    }
    /**
     * Get active stages
     */
    getActiveStages() {
        return [...this.currentState.activeStages];
    }
    /**
     * Check if stage is active
     */
    isStageActive(stageName) {
        return this.currentState.activeStages.includes(stageName);
    }
    /**
     * Get stage propellant remaining percentage
     */
    getStagePropellantRemaining(stageName) {
        const stageState = this.currentState.stages.find(s => s.name === stageName);
        const config = this.stages.get(stageName);
        if (!stageState || !config)
            return 0;
        return (stageState.propRemaining / config.propMass) * 100;
    }
    /**
     * Get total vehicle thrust-to-weight ratio
     */
    getThrustToWeight() {
        const weight = this.currentState.mass * 9.80665; // N
        return this.currentState.thrust / weight;
    }
}
export default VehicleIntegrator;
