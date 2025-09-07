import { describe, it, expect } from 'vitest'

// Minimal Dijkstra implementation extracted for unit tests
function dijkstra(nodes: { id: number }[], edges: { from: number; to: number; weight: number }[], source: number) {
  const dist = new Array(nodes.length).fill(Infinity)
  const prev = new Array(nodes.length).fill(null as number | null)
  dist[source] = 0
  const pq: Array<{ id: number; dist: number }> = [{ id: source, dist: 0 }]

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist)
    const u = pq.shift()!.id
    for (const e of edges) {
      if (e.from === u) {
        const nd = dist[u] + e.weight
        if (nd < dist[e.to]) {
          dist[e.to] = nd
          prev[e.to] = u
          pq.push({ id: e.to, dist: nd })
        }
      }
    }
  }

  return { dist, prev }
}

describe('Dijkstra correctness', () => {
  it('finds shortest path on a small directed graph', () => {
    const nodes = [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]
    const edges = [
      { from: 0, to: 1, weight: 1 },
      { from: 1, to: 2, weight: 1 },
      { from: 0, to: 2, weight: 5 },
      { from: 2, to: 3, weight: 1 },
      { from: 1, to: 3, weight: 4 }
    ]

    const res = dijkstra(nodes, edges, 0)
    expect(res.dist[3]).toBeCloseTo(3)
    // path should be 0->1->2->3
    expect(res.prev[3]).toBe(2)
    expect(res.prev[2]).toBe(1)
  })
})
