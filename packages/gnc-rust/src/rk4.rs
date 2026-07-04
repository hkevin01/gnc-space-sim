//! ID: WASM-RK4-001
//! Requirement: Implement a 4th-order Runge-Kutta integrator for two-body and
//!   N-body gravitational dynamics, compiled to WebAssembly for 10× throughput.
//! Purpose: Replace the Euler integrator in twobody.ts with a numerically stable
//!   O(h⁴) method, critical for trajectory propagation over multi-orbit arcs.
//! Rationale: RK4 reduces truncation error from O(h) to O(h⁴), allowing larger
//!   time steps (dt = 60 s vs. dt = 1 s) with equivalent accuracy.
//! Inputs: state [rx,ry,rz,vx,vy,vz] [m, m/s], dt [s], steps [count], mu [m³/s²]
//! Outputs: final 6-element state vector; or all intermediate states for trajectory
//! References: Vallado §3.7; Burden & Faires "Numerical Analysis" §5.4 (RK4)

use wasm_bindgen::prelude::*;
use js_sys::Float64Array;

type State6 = [f64; 6];

/// Compute the two-body gravitational derivative of the state vector.
/// state = [x, y, z, vx, vy, vz], mu = GM [m³/s²]
/// returns  [vx, vy, vz, ax, ay, az]
#[inline]
fn two_body_deriv(s: &State6, mu: f64) -> State6 {
    let r2 = s[0] * s[0] + s[1] * s[1] + s[2] * s[2];
    let r  = r2.sqrt();
    let r3 = r * r2;
    let f  = -mu / r3;
    [s[3], s[4], s[5], f * s[0], f * s[1], f * s[2]]
}

/// Single RK4 step: propagates state by dt using two-body gravity.
#[inline]
fn rk4_step(s: &State6, dt: f64, mu: f64) -> State6 {
    let k1 = two_body_deriv(s, mu);

    let s2: State6 = core::array::from_fn(|i| s[i] + 0.5 * dt * k1[i]);
    let k2 = two_body_deriv(&s2, mu);

    let s3: State6 = core::array::from_fn(|i| s[i] + 0.5 * dt * k2[i]);
    let k3 = two_body_deriv(&s3, mu);

    let s4: State6 = core::array::from_fn(|i| s[i] + dt * k3[i]);
    let k4 = two_body_deriv(&s4, mu);

    core::array::from_fn(|i| {
        s[i] + (dt / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i])
    })
}

/// Propagate a two-body state forward by `steps` steps of size `dt`.
/// Returns a 6-element Float64Array [rx,ry,rz,vx,vy,vz] at t₀ + steps*dt.
/// state_js must have exactly 6 elements.
#[wasm_bindgen]
pub fn rk4_propagate(state_js: &Float64Array, dt: f64, steps: u32, mu: f64) -> Float64Array {
    let sv = state_js.to_vec();
    let mut state: State6 = [sv[0], sv[1], sv[2], sv[3], sv[4], sv[5]];
    for _ in 0..steps {
        state = rk4_step(&state, dt, mu);
    }
    Float64Array::from(state.as_slice())
}

/// Propagate and return every intermediate state.
/// Returns a flat Float64Array of length 6*(steps+1).
/// Index layout: [rx₀,ry₀,..., rx₁,ry₁,..., ...]
#[wasm_bindgen]
pub fn rk4_trajectory(state_js: &Float64Array, dt: f64, steps: u32, mu: f64) -> Float64Array {
    let sv = state_js.to_vec();
    let mut state: State6 = [sv[0], sv[1], sv[2], sv[3], sv[4], sv[5]];
    let mut buf: Vec<f64> = Vec::with_capacity(6 * (steps as usize + 1));
    buf.extend_from_slice(&state);
    for _ in 0..steps {
        state = rk4_step(&state, dt, mu);
        buf.extend_from_slice(&state);
    }
    Float64Array::from(buf.as_slice())
}

/// N-body RK4 step.
/// bodies_js: flat [x0,y0,z0,vx0,vy0,vz0, x1,...] for n bodies
/// masses_js: [m0, m1, ...] [kg]; G = 6.674e-11 m³/kg/s²
/// Returns updated flat body states.
#[wasm_bindgen]
pub fn nbody_rk4_step(bodies_js: &Float64Array, masses_js: &Float64Array, dt: f64) -> Float64Array {
    const G: f64 = 6.674e-11;
    let flat = bodies_js.to_vec();
    let masses = masses_js.to_vec();
    let n = masses.len();

    let accel = |states: &[f64]| -> Vec<f64> {
        let mut acc = vec![0.0f64; 6 * n];
        for i in 0..n {
            let xi = states[6*i]; let yi = states[6*i+1]; let zi = states[6*i+2];
            // copy velocity into first 3 slots
            acc[6*i]   = states[6*i+3];
            acc[6*i+1] = states[6*i+4];
            acc[6*i+2] = states[6*i+5];
            for j in 0..n {
                if i == j { continue; }
                let xj = states[6*j]; let yj = states[6*j+1]; let zj = states[6*j+2];
                let dx = xj - xi; let dy = yj - yi; let dz = zj - zi;
                let r2 = dx*dx + dy*dy + dz*dz;
                let r  = r2.sqrt();
                let f  = G * masses[j] / (r2 * r);
                acc[6*i+3] += f * dx;
                acc[6*i+4] += f * dy;
                acc[6*i+5] += f * dz;
            }
        }
        acc
    };

    let k1 = accel(&flat);
    let s2: Vec<f64> = flat.iter().zip(k1.iter()).map(|(s,k)| s + 0.5*dt*k).collect();
    let k2 = accel(&s2);
    let s3: Vec<f64> = flat.iter().zip(k2.iter()).map(|(s,k)| s + 0.5*dt*k).collect();
    let k3 = accel(&s3);
    let s4: Vec<f64> = flat.iter().zip(k3.iter()).map(|(s,k)| s + dt*k).collect();
    let k4 = accel(&s4);

    let result: Vec<f64> = (0..flat.len())
        .map(|i| flat[i] + (dt/6.0)*(k1[i]+2.0*k2[i]+2.0*k3[i]+k4[i]))
        .collect();

    Float64Array::from(result.as_slice())
}
