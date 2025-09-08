import { LaunchPhase } from '../launch/guidance';
/**
 * Launch Vehicle Control Systems
 *
 * Implements various control algorithms for launch vehicle guidance,
 * attitude control, and thrust vector control during ascent.
 */
/**
 * PID Controller for attitude control
 */
export class PIDController {
    kp; // Proportional gain
    ki; // Integral gain
    kd; // Derivative gain
    integral = 0;
    previous_error = 0;
    dt;
    constructor(kp, ki, kd, dt) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.dt = dt;
    }
    /**
     * Compute PID control output
     *
     * u(t) = Kp*e(t) + Ki*∫e(τ)dτ + Kd*de/dt
     */
    update(setpoint, measurement) {
        const error = setpoint - measurement;
        this.integral += error * this.dt;
        const derivative = (error - this.previous_error) / this.dt;
        const output = this.kp * error + this.ki * this.integral + this.kd * derivative;
        this.previous_error = error;
        return output;
    }
    reset() {
        this.integral = 0;
        this.previous_error = 0;
    }
}
/**
 * Attitude Control System using Thrust Vector Control (TVC)
 */
export class AttitudeControlSystem {
    pitch_controller;
    yaw_controller;
    roll_controller;
    max_gimbal_angle = 8 * Math.PI / 180; // 8 degrees max gimbal
    constructor(dt = 0.1) {
        // Tuned PID gains for launch vehicle attitude control
        this.pitch_controller = new PIDController(2.0, 0.1, 0.5, dt);
        this.yaw_controller = new PIDController(2.0, 0.1, 0.5, dt);
        this.roll_controller = new PIDController(1.5, 0.05, 0.3, dt);
    }
    /**
     * Compute thrust vector control commands
     *
     * Returns gimbal angles for engine deflection
     */
    computeTVC(commanded_attitude, current_attitude) {
        const pitch_command = this.pitch_controller.update(commanded_attitude.pitch, current_attitude.pitch);
        const yaw_command = this.yaw_controller.update(commanded_attitude.yaw, current_attitude.yaw);
        // Limit gimbal angles
        const pitch_gimbal = Math.max(-this.max_gimbal_angle, Math.min(this.max_gimbal_angle, pitch_command));
        const yaw_gimbal = Math.max(-this.max_gimbal_angle, Math.min(this.max_gimbal_angle, yaw_command));
        return { pitch_gimbal, yaw_gimbal };
    }
    /**
     * Compute reaction control system (RCS) commands for roll control
     */
    computeRCS(commanded_roll, current_roll) {
        return this.roll_controller.update(commanded_roll, current_roll);
    }
}
/**
 * Launch Vehicle Autopilot System
 *
 * Integrates guidance, navigation, and control for autonomous launch
 */
export class LaunchAutopilot {
    attitude_control;
    throttle_controller;
    target_acceleration = 20; // m/s² target acceleration
    constructor(dt = 0.1) {
        this.attitude_control = new AttitudeControlSystem(dt);
        this.throttle_controller = new PIDController(0.1, 0.01, 0.05, dt);
    }
    /**
     * Main autopilot control loop
     *
     * Computes all control commands based on current state and guidance
     */
    update(state) {
        // Attitude control
        const attitude_commands = this.computeAttitudeControl(state);
        // Throttle control
        const throttle_command = this.computeThrottleControl(state);
        // Engine control
        const engine_commands = this.computeEngineControl(state);
        return {
            attitude: attitude_commands,
            throttle: throttle_command,
            engines: engine_commands,
            rcs: this.computeRCSControl(state)
        };
    }
    computeAttitudeControl(state) {
        // Current attitude (simplified - would use actual attitude estimation)
        const current_attitude = {
            pitch: state.flight_path_angle,
            yaw: state.heading,
            roll: 0 // Assume roll-stabilized
        };
        // Commanded attitude from guidance
        const commanded_attitude = {
            pitch: state.guidance.pitch_program,
            yaw: state.guidance.yaw_program,
            roll: 0
        };
        const tvc = this.attitude_control.computeTVC(commanded_attitude, current_attitude);
        const rcs_roll = this.attitude_control.computeRCS(0, current_attitude.roll);
        return {
            pitch_gimbal: tvc.pitch_gimbal,
            yaw_gimbal: tvc.yaw_gimbal,
            roll_command: rcs_roll
        };
    }
    computeThrottleControl(state) {
        // Phase-dependent throttle logic
        switch (state.phase) {
            case LaunchPhase.LIFTOFF:
                return 1.0; // Full throttle for liftoff
            case LaunchPhase.MAX_Q:
                return 0.65; // Throttle back during max dynamic pressure
            case LaunchPhase.STAGE1_BURN: {
                // Acceleration limiting to protect payload
                const current_accel = Math.hypot(...state.thrust) / state.mass;
                return this.throttle_controller.update(this.target_acceleration, current_accel);
            }
            case LaunchPhase.STAGE2_BURN:
                return state.guidance.throttle;
            default:
                return 0.0;
        }
    }
    computeEngineControl(state) {
        const should_ignite = this.shouldIgniteEngines(state);
        const should_shutdown = this.shouldShutdownEngines(state);
        return {
            ignition_command: should_ignite,
            shutdown_command: should_shutdown,
            mixture_ratio: this.computeMixtureRatio(state),
            injection_pressure: this.computeInjectionPressure(state)
        };
    }
    computeRCSControl(state) {
        // RCS primarily used for attitude control when engines are off
        const rcs_active = state.phase === LaunchPhase.STAGE1_SEPARATION ||
            state.phase === LaunchPhase.FAIRING_JETTISON;
        return {
            active: rcs_active,
            thrust_commands: rcs_active ? [0.1, -0.05, 0.0] : [0, 0, 0] // N⋅m torque
        };
    }
    shouldIgniteEngines(state) {
        return state.phase === LaunchPhase.LIFTOFF ||
            state.phase === LaunchPhase.STAGE2_IGNITION;
    }
    shouldShutdownEngines(state) {
        return state.phase === LaunchPhase.STAGE1_SEPARATION ||
            state.phase === LaunchPhase.ORBITAL_INSERTION;
    }
    computeMixtureRatio(state) {
        // Optimal mixture ratio varies by phase and performance requirements
        switch (state.phase) {
            case LaunchPhase.LIFTOFF:
            case LaunchPhase.STAGE1_BURN:
                return 2.76; // LOX/RP-1 optimal mixture ratio
            case LaunchPhase.STAGE2_BURN:
                return 6.0; // LOX/LH2 optimal mixture ratio
            default:
                return 2.76;
        }
    }
    computeInjectionPressure(state) {
        // Injection pressure affects engine performance and throttle response
        const base_pressure = 100; // bar
        const throttle_factor = state.guidance.throttle;
        return base_pressure * Math.sqrt(throttle_factor);
    }
}
/**
 * Reaction Control System (RCS) for attitude control
 */
export class ReactionControlSystem {
    thrusters;
    moment_arm = 2.0; // m from CG to thrusters
    constructor() {
        // Define 4-thruster configuration for pitch/yaw control
        this.thrusters = [
            { position: [0, this.moment_arm, 0], direction: [1, 0, 0], thrust: 440 }, // +X thruster
            { position: [0, -this.moment_arm, 0], direction: [-1, 0, 0], thrust: 440 }, // -X thruster
            { position: [this.moment_arm, 0, 0], direction: [0, 1, 0], thrust: 440 }, // +Y thruster
            { position: [-this.moment_arm, 0, 0], direction: [0, -1, 0], thrust: 440 } // -Y thruster
        ];
    }
    /**
     * Compute RCS thruster commands for desired torque
     *
     * Solve: [M] × [T] = [τ_desired]
     * where M is moment matrix, T is thrust vector, τ is torque
     */
    computeThrusterCommands(desired_torque) {
        // Simplified logic - would use optimization in practice
        const commands = new Array(this.thrusters.length).fill(0);
        // Roll torque (about X-axis)
        if (Math.abs(desired_torque[0]) > 0.1) {
            const thrust_level = Math.min(1.0, Math.abs(desired_torque[0]) / 100);
            commands[0] = desired_torque[0] > 0 ? thrust_level : 0;
            commands[1] = desired_torque[0] < 0 ? thrust_level : 0;
        }
        // Pitch torque (about Y-axis)
        if (Math.abs(desired_torque[1]) > 0.1) {
            const thrust_level = Math.min(1.0, Math.abs(desired_torque[1]) / 100);
            commands[2] = desired_torque[1] > 0 ? thrust_level : 0;
            commands[3] = desired_torque[1] < 0 ? thrust_level : 0;
        }
        return commands;
    }
}
/**
 * Guidance, Navigation & Control (GNC) Integration
 *
 * High-level coordinator for all GNC subsystems
 */
export class GNCSystem {
    autopilot;
    rcs;
    control_active = true;
    constructor(dt = 0.1) {
        this.autopilot = new LaunchAutopilot(dt);
        this.rcs = new ReactionControlSystem();
    }
    /**
     * Main GNC control loop
     *
     * Integrates guidance commands, navigation state, and control responses
     */
    update(state) {
        if (!this.control_active) {
            return this.getInactiveCommands();
        }
        // Get autopilot commands
        const autopilot_commands = this.autopilot.update(state);
        // Compute RCS commands if needed
        const rcs_commands = autopilot_commands.rcs.active ?
            this.rcs.computeThrusterCommands([
                autopilot_commands.rcs.thrust_commands[0],
                autopilot_commands.rcs.thrust_commands[1],
                autopilot_commands.rcs.thrust_commands[2]
            ]) : [];
        return {
            main_engine: {
                throttle: autopilot_commands.throttle,
                gimbal_pitch: autopilot_commands.attitude.pitch_gimbal,
                gimbal_yaw: autopilot_commands.attitude.yaw_gimbal,
                ignition: autopilot_commands.engines.ignition_command,
                shutdown: autopilot_commands.engines.shutdown_command
            },
            rcs: {
                active: autopilot_commands.rcs.active,
                thruster_commands: rcs_commands
            },
            vehicle: {
                stage_separation: this.shouldSeparateStage(state),
                fairing_jettison: this.shouldJettisonFairing(state)
            }
        };
    }
    shouldSeparateStage(state) {
        return state.phase === LaunchPhase.STAGE1_SEPARATION;
    }
    shouldJettisonFairing(state) {
        return state.phase === LaunchPhase.FAIRING_JETTISON;
    }
    getInactiveCommands() {
        return {
            main_engine: {
                throttle: 0,
                gimbal_pitch: 0,
                gimbal_yaw: 0,
                ignition: false,
                shutdown: true
            },
            rcs: {
                active: false,
                thruster_commands: []
            },
            vehicle: {
                stage_separation: false,
                fairing_jettison: false
            }
        };
    }
    /**
     * Emergency shutdown of all systems
     */
    emergencyShutdown() {
        this.control_active = false;
    }
    /**
     * Restart control systems
     */
    restart() {
        this.control_active = true;
    }
}
/**
 * Mission Performance Analysis
 */
export class MissionAnalyzer {
    /**
     * Compute launch performance metrics
     */
    static analyzeLaunchPerformance(trajectory) {
        // Analyze attitude control performance
        const attitude_errors = trajectory.map(state => ({
            pitch: Math.abs(state.guidance.pitch_program - state.flight_path_angle),
            yaw: Math.abs(state.guidance.yaw_program - state.heading),
            roll: 0 // Assume roll-stabilized
        }));
        const avg_pitch_error = attitude_errors.reduce((sum, err) => sum + err.pitch, 0) / attitude_errors.length;
        const avg_yaw_error = attitude_errors.reduce((sum, err) => sum + err.yaw, 0) / attitude_errors.length;
        // Compute delta-V losses
        const gravity_losses = this.computeGravityLosses(trajectory);
        const drag_losses = this.computeDragLosses(trajectory);
        const steering_losses = this.computeSteeringLosses(trajectory);
        return {
            attitude_error: {
                pitch: avg_pitch_error,
                yaw: avg_yaw_error,
                roll: 0
            },
            guidance_error: {
                cross_track: 0, // Would compute from trajectory analysis
                down_track: 0,
                velocity: 0
            },
            propellant_efficiency: {
                gravity_losses,
                drag_losses,
                steering_losses
            }
        };
    }
    static computeGravityLosses(trajectory) {
        // Gravity losses = ∫ g⋅sin(γ) dt where γ is flight path angle
        let losses = 0;
        for (let i = 1; i < trajectory.length; i++) {
            const dt = trajectory[i].mission_time - trajectory[i - 1].mission_time;
            const g = 9.81; // Simplified constant gravity
            const gamma = trajectory[i].flight_path_angle;
            losses += g * Math.sin(gamma) * dt;
        }
        return losses;
    }
    static computeDragLosses(trajectory) {
        // Drag losses = ∫ (D/m) dt
        let losses = 0;
        for (let i = 1; i < trajectory.length; i++) {
            const dt = trajectory[i].mission_time - trajectory[i - 1].mission_time;
            const drag_magnitude = Math.hypot(...trajectory[i].drag);
            const drag_accel = drag_magnitude / trajectory[i].mass;
            losses += drag_accel * dt;
        }
        return losses;
    }
    static computeSteeringLosses(trajectory) {
        // Steering losses from non-optimal thrust vectoring
        let losses = 0;
        for (let i = 1; i < trajectory.length; i++) {
            const dt = trajectory[i].mission_time - trajectory[i - 1].mission_time;
            const thrust_magnitude = Math.hypot(...trajectory[i].thrust);
            // Cosine loss factor (simplified)
            const cosine_loss = 1 - Math.cos(trajectory[i].flight_path_angle - trajectory[i].guidance.pitch_program);
            losses += (thrust_magnitude / trajectory[i].mass) * cosine_loss * dt;
        }
        return losses;
    }
}
