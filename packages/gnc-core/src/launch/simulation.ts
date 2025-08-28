import { MU_EARTH } from '../math/constants'
import { EARTH_RADIUS, STANDARD_GRAVITY } from '../math/physics'
import { State6, Vec3 } from '../orbits/twobody'
import {
    computeAtmosphere,
    computeDrag,
    determineLaunchPhase,
    GravityTurnGuidance,
    LaunchPhase,
    LaunchState,
    LaunchVehicle
} from './guidance'

function add(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] }
function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function scale(v: Vec3, s: number): Vec3 { return [v[0] * s, v[1] * s, v[2] * s] }
function norm(v: Vec3): number { return Math.hypot(v[0], v[1], v[2]) }
function unit(v: Vec3): Vec3 { const n = norm(v) || 1; return [v[0]/n, v[1]/n, v[2]/n] }

function gravityAccel(r: Vec3): Vec3 {
  const rmag = norm(r)
  const factor = -MU_EARTH / (rmag * rmag * rmag)
  return scale(r, factor)
}

function thrustVector(thrustMag: number, pitch: number, yaw: number): Vec3 {
  // Body-frame: pitch from +Z toward +X, yaw about Z toward +Y
  const cx = Math.cos(pitch)
  const sx = Math.sin(pitch)
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  // Forward along +X when pitch=0; upward along +Z when pitch=90deg
  const dir: Vec3 = [cx * cy, cx * sy, sx]
  return scale(unit(dir), thrustMag)
}

function getActiveStage(vehicle: LaunchVehicle, t: number): {
  thrustVac: number,
  isp: number,
  massPropellant: number,
  which: 1|2
} {
  if (t < vehicle.stage1.burn_time) {
    return { thrustVac: vehicle.stage1.thrust, isp: vehicle.stage1.isp, massPropellant: vehicle.stage1.mass_propellant, which: 1 }
  }
  return { thrustVac: vehicle.stage2.thrust, isp: vehicle.stage2.isp, massPropellant: vehicle.stage2.mass_propellant, which: 2 }
}

export function integrateLaunchTrajectory(
  prev: LaunchState,
  vehicle: LaunchVehicle,
  guidance: GravityTurnGuidance,
  dt: number
): LaunchState {
  const t = prev.mission_time + dt

  // Geometry and kinematics
  const rmag = norm(prev.r)
  const altitude = Math.max(0, rmag - EARTH_RADIUS)
  const vmag = norm(prev.v)

  // Atmosphere and drag
  const atmosphere = computeAtmosphere(altitude)

  // Guidance
  const { pitch, yaw, throttle } = guidance.computeGuidance(prev)

  // Stage selection and thrust
  const { thrustVac, isp, which } = getActiveStage(vehicle, prev.mission_time)
  const thrustMag = throttle * thrustVac

  // Simple thrust direction based on guidance (pitch up from local horizontal)
  const thrust = thrustVector(thrustMag, pitch, yaw)

  // Drag opposes velocity
  const drag = computeDrag(prev.v, atmosphere)

  // Mass flow (only when burning)
  let mass = prev.mass
  if ((which === 1 && prev.mission_time < vehicle.stage1.burn_time) ||
      (which === 2 && prev.mission_time >= vehicle.stage1.burn_time && prev.mission_time < vehicle.stage1.burn_time + vehicle.stage2.burn_time)) {
    const mdot = thrustMag / (isp * STANDARD_GRAVITY)
    mass = Math.max(1, mass - mdot * dt)
  }

  // Acceleration
  const a_grav = gravityAccel(prev.r)
  const a_thrust = scale(thrust, 1 / Math.max(mass, 1))
  const a_drag = scale(drag, 1 / Math.max(mass, 1))
  const accel = add(add(a_grav, a_thrust), a_drag)

  // Integrate (semi-implicit Euler)
  const v: Vec3 = add(prev.v, scale(accel, dt))
  const r: Vec3 = add(prev.r, scale(v, dt))

  // Recompute scalars
  const newRmag = norm(r)
  const newAlt = Math.max(0, newRmag - EARTH_RADIUS)
  const newVmag = norm(v)

  // Flight path angle relative to local horizontal
  const radialUnit = unit(r)
  const vRadial = (v[0]*radialUnit[0] + v[1]*radialUnit[1] + v[2]*radialUnit[2])
  const gamma = Math.asin(Math.max(-1, Math.min(1, vRadial / (newVmag || 1))))

  const phase = determineLaunchPhase(t, newAlt, newVmag)

  const next: LaunchState = {
    r,
    v,
    phase,
    mission_time: t,
    altitude: newAlt,
    velocity_magnitude: newVmag,
    flight_path_angle: gamma,
    heading: prev.heading, // unchanged in this simple model
    mass,
    thrust,
    drag,
    atmosphere,
    guidance: {
      pitch_program: pitch,
      yaw_program: yaw,
      throttle
    }
  }

  return next
}

// Convenience to initialize a reasonable state from just position/velocity
export function initializeLaunchState(state: State6, vehicle: LaunchVehicle): LaunchState {
  const rmag = norm(state.r)
  const atmosphere = computeAtmosphere(Math.max(0, rmag - EARTH_RADIUS))
  const vmag = norm(state.v)
  return {
    r: state.r,
    v: state.v,
    phase: LaunchPhase.PRELAUNCH,
    mission_time: 0,
    altitude: Math.max(0, rmag - EARTH_RADIUS),
    velocity_magnitude: vmag,
    flight_path_angle: Math.PI/2,
    heading: 0,
    mass: vehicle.stage1.mass_dry + vehicle.stage1.mass_propellant + vehicle.stage2.mass_dry + vehicle.stage2.mass_propellant + vehicle.payload_mass + vehicle.fairing_mass,
    thrust: [0,0,0],
    drag: [0,0,0],
    atmosphere,
    guidance: { pitch_program: Math.PI/2, yaw_program: 0, throttle: 0 }
  }
}
