import { rk4Step } from './rk4';
export function keplerianPropagateTwoBody(state0, dt, mu) {
    const s6 = [
        state0.r[0], state0.r[1], state0.r[2],
        state0.v[0], state0.v[1], state0.v[2],
    ];
    const out = rk4Step(s6, dt, mu);
    return { r: [out[0], out[1], out[2]], v: [out[3], out[4], out[5]] };
}
