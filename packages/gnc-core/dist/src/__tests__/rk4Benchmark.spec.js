import { describe, expect, it } from 'vitest';
import { MU_EARTH } from '../math/constants';
import { eulerStep, orbitalEnergy, propagateTwoBody, rk4Step } from '../orbits/rk4';
function circularReference(r, t, mu) {
    const n = Math.sqrt(mu / (r * r * r));
    const c = Math.cos(n * t);
    const s = Math.sin(n * t);
    return [r * c, r * s, 0, -r * n * s, r * n * c, 0];
}
describe('RK4 vs Euler benchmark-style accuracy and energy tests', () => {
    it('RK4 has lower endpoint position error than Euler over one orbit', () => {
        const r = 7000e3;
        const v = Math.sqrt(MU_EARTH / r);
        const s0 = [r, 0, 0, 0, v, 0];
        const period = 2 * Math.PI * Math.sqrt((r ** 3) / MU_EARTH);
        const dt = 30;
        const steps = Math.round(period / dt);
        let sEuler = s0;
        let sRk4 = s0;
        for (let i = 0; i < steps; i++) {
            sEuler = eulerStep(sEuler, dt, MU_EARTH);
            sRk4 = rk4Step(sRk4, dt, MU_EARTH);
        }
        const tref = steps * dt;
        const sRef = circularReference(r, tref, MU_EARTH);
        const errEuler = Math.hypot(sEuler[0] - sRef[0], sEuler[1] - sRef[1], sEuler[2] - sRef[2]);
        const errRk4 = Math.hypot(sRk4[0] - sRef[0], sRk4[1] - sRef[1], sRk4[2] - sRef[2]);
        expect(errRk4).toBeLessThan(errEuler);
    });
    it('RK4 has lower specific-energy drift than Euler', () => {
        const r = 7000e3;
        const v = Math.sqrt(MU_EARTH / r);
        const s0 = [r, 0, 0, 0, v, 0];
        const dt = 20;
        const steps = 400;
        let sEuler = s0;
        let sRk4 = s0;
        for (let i = 0; i < steps; i++) {
            sEuler = eulerStep(sEuler, dt, MU_EARTH);
            sRk4 = rk4Step(sRk4, dt, MU_EARTH);
        }
        const e0 = orbitalEnergy(s0, MU_EARTH);
        const driftEuler = Math.abs(orbitalEnergy(sEuler, MU_EARTH) - e0);
        const driftRk4 = Math.abs(orbitalEnergy(sRk4, MU_EARTH) - e0);
        expect(driftRk4).toBeLessThan(driftEuler);
    });
    it('high-fidelity default propagation path uses RK4 mode', () => {
        const r = 7000e3;
        const v = Math.sqrt(MU_EARTH / r);
        const s0 = [r, 0, 0, 0, v, 0];
        const outDefault = propagateTwoBody(s0, 10, 50, MU_EARTH);
        const outExplicit = propagateTwoBody(s0, 10, 50, MU_EARTH, 'rk4');
        expect(outDefault[0]).toBeCloseTo(outExplicit[0], 12);
        expect(outDefault[1]).toBeCloseTo(outExplicit[1], 12);
        expect(outDefault[3]).toBeCloseTo(outExplicit[3], 12);
    });
});
