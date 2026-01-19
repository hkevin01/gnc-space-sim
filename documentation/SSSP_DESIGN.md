# Deterministic SSSP Engine — Design Notes

This document explains the Rust/WebAssembly SSSP engine in `packages/gnc-rust/src/sssp.rs` and how it integrates with the monorepo.

Summary:

- Graph format: Compressed Sparse Row (CSR) with nonnegative weights.
- Two paths: optimized Dijkstra (binary heap) and an enhanced mode scaffolding hierarchical decomposition.
- WebAssembly: Exposed via wasm-bindgen, consumable from the web app or TypeScript packages.

Key exports:

- `SparseGraph`: CSR graph with validation.
- `EnhancedSSSpSolver`: `preprocess()` optional preprocessing, `solve(source)` for SSSP.
- `TrajectoryGraphBuilder::build_trajectory_graph(...)`: sample generator for state-time graphs.
- `benchmark_algorithms(...)`: quick benchmark utility.

Correctness and Bounds:

- Enforces nonnegative weights and finite values.
- Deterministic processing order using fixed structures (for optimized Dijkstra). Hierarchical path is scaffolding for future dial/bucket queues.

Integration Plan:

- TypeScript host builds problem-specific CSR arrays and calls into WASM.
- UI overlays can display node visit stats and selected path.

Next Steps:

- Add dial/radix buckets for bounded-key SSSP.
- Persist warm-start distances across cycles and implement dirty-region updates.
