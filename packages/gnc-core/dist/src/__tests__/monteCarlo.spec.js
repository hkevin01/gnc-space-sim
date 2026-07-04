import { describe, expect, it } from 'vitest';
import { runMonteCarlo, runScalarDispersion } from '../analysis/monte_carlo';
describe('Deterministic Monte Carlo engine', () => {
    it('is deterministic for the same seed', () => {
        const a = runMonteCarlo({
            iterations: 128,
            seed: 42,
            sample: (rng) => rng.normal(0, 1),
            evaluate: (x) => x * x,
            metric: (y) => y,
        });
        const b = runMonteCarlo({
            iterations: 128,
            seed: 42,
            sample: (rng) => rng.normal(0, 1),
            evaluate: (x) => x * x,
            metric: (y) => y,
        });
        expect(a.metrics).toEqual(b.metrics);
        expect(a.summary).toEqual(b.summary);
    });
    it('changes output sequence for a different seed', () => {
        const a = runMonteCarlo({
            iterations: 64,
            seed: 11,
            sample: (rng) => rng.next(),
            evaluate: (x) => x,
            metric: (y) => y,
        });
        const b = runMonteCarlo({
            iterations: 64,
            seed: 12,
            sample: (rng) => rng.next(),
            evaluate: (x) => x,
            metric: (y) => y,
        });
        expect(a.metrics).not.toEqual(b.metrics);
    });
    it('produces plausible normal-distribution summary statistics', () => {
        const stats = runScalarDispersion({
            iterations: 4000,
            seed: 1234,
            sample: (rng) => rng.normal(0, 1),
        });
        expect(Math.abs(stats.mean)).toBeLessThan(0.1);
        expect(stats.std).toBeGreaterThan(0.85);
        expect(stats.std).toBeLessThan(1.15);
        expect(stats.p05).toBeLessThan(stats.p50);
        expect(stats.p50).toBeLessThan(stats.p95);
    });
});
