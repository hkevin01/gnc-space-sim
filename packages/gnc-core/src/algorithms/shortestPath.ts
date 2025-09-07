export interface NodeSpec { id: number }
export interface Edge { from: number; to: number; weight: number }

class MinHeap {
  data: number[] = []
  distances: number[]
  constructor(distances: number[]) { this.distances = distances }
  push(v: number) { this.data.push(v); this.bubbleUp(this.data.length - 1) }
  pop(): number | undefined { 
    if (this.data.length === 0) return undefined
    const top = this.data[0]
    const last = this.data.pop()!
    if (this.data.length > 0) { 
      this.data[0] = last
      this.bubbleDown(0)
    }
    return top
  }
  isEmpty() { return this.data.length === 0 }
  private bubbleUp(i: number) { 
    const item = this.data[i]
    while (i > 0) { 
      const p = Math.floor((i - 1) / 2)
      if (this.distances[item] >= this.distances[this.data[p]]) break
      this.data[i] = this.data[p]
      i = p
    }
    this.data[i] = item
  }
  private bubbleDown(i: number) { 
    const n = this.data.length
    const item = this.data[i]
    while (true) { 
      let left = 2*i+1
      let right = left+1
      let smallest = i
      if (left < n && this.distances[this.data[left]] < this.distances[this.data[smallest]]) smallest = left
      if (right < n && this.distances[this.data[right]] < this.distances[this.data[smallest]]) smallest = right
      if (smallest === i) break
      this.data[i] = this.data[smallest]
      i = smallest
    }
    this.data[i] = item
  }
}

export function dijkstra(nodes: NodeSpec[], edges: Edge[], source: number) {
  const n = nodes.length
  const adj: number[][] = Array.from({ length: n }, () => [])
  const weights: number[][] = Array.from({ length: n }, () => [])
  for (const e of edges) {
    if (e.from >= 0 && e.from < n && e.to >= 0 && e.to < n) {
      adj[e.from].push(e.to)
      weights[e.from].push(e.weight)
    }
  }
  const dist = new Array<number>(n).fill(Infinity)
  const prev = new Array<number>(n).fill(-1)
  dist[source] = 0
  const heap = new MinHeap(dist as any)
  heap.push(source)
  const visited = new Uint8Array(n)
  while (!heap.isEmpty()) {
    const u = heap.pop()!
    if (visited[u]) continue
    visited[u] = 1
    const neighbors = adj[u] || []
    const ws = weights[u] || []
    for (let i = 0; i < neighbors.length; i++) {
      const v = neighbors[i]
      const w = ws[i]
      const nd = dist[u] + w
      if (nd < dist[v]) {
        dist[v] = nd
        prev[v] = u
        heap.push(v)
      }
    }
  }
  return { dist, prev }
}

export function enhancedSSSP(nodes: NodeSpec[], edges: Edge[], source: number) {
  return dijkstra(nodes, edges, source)
}
