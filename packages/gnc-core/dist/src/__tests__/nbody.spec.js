import { describe, expect, it } from 'vitest';
import { MU_EARTH } from '../math/constants';
import { perturbationBreakdown, nbodyAcceleration, nbodyPropagate, BODIES_EARTH_MOON_SUN } from '../orbits/nbody';
import { rk4Step } from '../orbits/rk4';
describe('N-body propagator validation scenarios', () => {
    it('produces near-earth gravity magnitude around 9 m/s^2 at LEO radius', () => {
        const leo = [6771e3, 0, 0];
        const a = nbodyAcceleration(leo, [{ name: 'Earth', mu: MU_EARTH, position: [0, 0, 0] }]);
        const amag = Math.hypot(a[0], a[1], a[2]);
        expect(amag).toBeGreaterThan(8);
        expect(amag).toBeLessThan(10);
    });
    it('Earth-Moon-Sun perturbation is non-zero but small in LEO', () => {
        const leo = [6771e3, 0, 0];
        const breakdown = perturbationBreakdown(leo, BODIES_EARTH_MOON_SUN, 'Earth');
        expect(breakdown.perturbationMagnitude).toBeGreaterThan(0);
        expect(breakdown.perturbationRatio).toBeLessThan(0.01);
    });
    it('Moon perturbation becomes significant near lunar distance', () => {
        const nearMoon = [350000e3, 0, 0];
        const breakdown = perturbationBreakdown(nearMoon, BODIES_EARTH_MOON_SUN, 'Earth');
        expect(breakdown.perturbationRatio).toBeGreaterThan(0.3);
    });
    it('singularity guard returns finite acceleration at body center coincidence', () => {
        const a = nbodyAcceleration([0, 0, 0], [{ name: 'Earth', mu: MU_EARTH, position: [0, 0, 0] }]);
        expect(Number.isFinite(a[0])).toBe(true);
        expect(Number.isFinite(a[1])).toBe(true);
        expect(Number.isFinite(a[2])).toBe(true);
    });
    it('Earth-only n-body propagation is consistent with two-body RK4 step', () => {
        const sc = {
            position: [7000e3, 0, 0],
            velocity: [0, 7500, 0],
        };
        const dt = 10;
        const nbody = nbodyPropagate(sc, [{ name: 'Earth', mu: MU_EARTH, position: [0, 0, 0] }], dt, 1);
        const twoBody = rk4Step([sc.position[0], sc.position[1], sc.position[2], sc.velocity[0], sc.velocity[1], sc.velocity[2]], dt, MU_EARTH);
        expect(Math.abs(nbody.position[0] - twoBody[0])).toBeLessThan(1e-6);
        expect(Math.abs(nbody.position[1] - twoBody[1])).toBeLessThan(1e-6);
        expect(Math.abs(nbody.velocity[0] - twoBody[3])).toBeLessThan(1e-9);
        expect(Math.abs(nbody.velocity[1] - twoBody[4])).toBeLessThan(1e-9);
    });
});
