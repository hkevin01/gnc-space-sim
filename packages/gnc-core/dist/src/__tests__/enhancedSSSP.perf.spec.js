import { describe, it } from 'vitest';
import { enhancedSSSP } from '../algorithms/shortestPath';
function buildRandomSparseGraph(n, avgDegree) {
    const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
    const edges = [];
    for (let u = 0; u < n; u++) {
        const deg = Math.max(1, Math.round((Math.random() * 2 + 0.5) * avgDegree));
        for (let k = 0; k < deg; k++) {
            const v = Math.floor(Math.random() * n);
            if (v === u)
                continue;
            edges.push({ from: u, to: v, weight: Math.random() * 10 + 0.1 });
        }
    }
    return { nodes, edges };
}
describe('enhancedSSSP perf', () => {
    it('runs on a medium sparse graph', () => {
        const n = 2000;
        const avgDegree = 4;
        const { nodes, edges } = buildRandomSparseGraph(n, avgDegree);
        const start = Date.now();
        const { dist } = enhancedSSSP(nodes, edges, 0);
        const dt = Date.now() - start;
        let reachable = 0;
        for (let i = 0; i < n; i++)
            if (isFinite(dist[i]))
                reachable++;
        if (reachable === 0)
            throw new Error('no reachable nodes');
        if (dt > 10000)
            throw new Error(`enhancedSSSP too slow: ${dt}ms`);
    }, 20000);
});
