import { describe, it, expect } from 'vitest';
import { enhancedSSSP } from '../algorithms/shortestPath';
describe('enhancedSSSP', () => {
    it('matches expected shortest paths on a small graph', () => {
        const nodes = [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];
        const edges = [
            { from: 0, to: 1, weight: 1 },
            { from: 1, to: 2, weight: 2 },
            { from: 0, to: 2, weight: 4 },
            { from: 2, to: 3, weight: 1 },
        ];
        const { dist, prev } = enhancedSSSP(nodes, edges, 0);
        expect(dist[0]).toBe(0);
        expect(dist[1]).toBe(1);
        expect(dist[2]).toBe(3);
        expect(dist[3]).toBe(4);
        const path = [];
        for (let v = 3; v !== -1; v = prev[v]) {
            path.push(v);
            if (v === 0)
                break;
        }
        expect(path.reverse()).toEqual([0, 1, 2, 3]);
    });
});
