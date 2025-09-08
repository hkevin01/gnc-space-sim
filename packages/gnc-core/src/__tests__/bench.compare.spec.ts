import { describe, it } from 'vitest'
import { dijkstra, enhancedSSSP } from '../algorithms/shortestPath'

function buildRandomSparseGraph(n: number, avgDegree: number) {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: i }))
  const edges: { from: number; to: number; weight: number }[] = []
  for (let u = 0; u < n; u++) {
    const actualDegree = Math.max(1, Math.min(n - 1, avgDegree + Math.floor((Math.random() - 0.5) * 2)))
    for (let k = 0; k < actualDegree; k++) {
      const v = Math.floor(Math.random() * n)
      if (v === u) continue
      edges.push({ from: u, to: v, weight: Math.random() * 10 + 0.1 })
    }
  }
  return { nodes, edges }
}

describe('bench: dijkstra vs enhancedSSSP', () => {
  it('compares runtimes (soft check)', () => {
    const n = 2500
    const avgDegree = 4
    const { nodes, edges } = buildRandomSparseGraph(n, avgDegree)

    const t0 = Date.now()
    const r1 = dijkstra(nodes as any, edges as any, 0)
    const dt1 = Date.now() - t0

    const t2 = Date.now()
    const r2 = enhancedSSSP(nodes as any, edges as any, 0)
    const dt2 = Date.now() - t2

    const t3 = Date.now()
    const r3 = enhancedSSSP(nodes as any, edges as any, 0)
    const dt3 = Date.now() - t3

    if (r1.dist.length !== n || r2.dist.length !== n || r3.dist.length !== n) throw new Error('invalid result')
    // Basic performance check: enhanced should be comparable to dijkstra
    if (dt2 > dt1 * 10) throw new Error(`enhancedSSSP too slow (${dt2}ms vs ${dt1}ms)`)
  }, 60000)
})
