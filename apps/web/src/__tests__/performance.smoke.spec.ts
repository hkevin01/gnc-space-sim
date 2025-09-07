import { describe, it } from 'vitest'

// Simple smoke test to ensure Dijkstra runs under a threshold on a medium graph
function dijkstra(nodes: { id: number }[], edges: { from: number; to: number; weight: number }[], source: number) {
  const dist = new Array(nodes.length).fill(Infinity)
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
          pq.push({ id: e.to, dist: nd })
        }
      }
    }
  }
  return dist
}

describe('Performance smoke', () => {
  it('completes Dijkstra on 200-node graph within time budget', () => {
    const n = 200
    const nodes = new Array(n).fill(0).map((_, i) => ({ id: i }))
    const edges: { from: number; to: number; weight: number }[] = []
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < Math.min(n, i + 6); j++) {
        const w = Math.abs(i - j) + 1
        edges.push({ from: i, to: j, weight: w })
        edges.push({ from: j, to: i, weight: w + 0.5 })
      }
    }

    const start = Date.now()
    dijkstra(nodes, edges, 0)
    const elapsed = Date.now() - start
    // test threshold generous for CI: 1000ms
    if (elapsed > 1000) {
      throw new Error(`Dijkstra took too long: ${elapsed}ms`)
    }
  })
})
