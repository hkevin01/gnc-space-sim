# Model Predictive Control (MPC) — Design Notes

MPC will be integrated with a QP solver (OSQP) compiled to WASM for browser use.

Initial state:

- TS interfaces in `@gnc/core/src/control/mpc.ts` define the model and problem.
- A placeholder LQR-like one-step controller exists to unblock UI integration.

Plan:

1. Integrate `osqp` via WebAssembly (or an equivalent JS/WASM QP) and wrap a `solveQP(H, f, A, l, u)` API.
2. Build canonical condensed QP from (A,B,Q,R,N,x0, constraints) for horizon N.
3. Expose `solveMPCQP(problem)` that returns u0, with warm-start between frames.
4. Add UI panel to show constraint activity and predicted horizon trajectory.

Alternatives:

- If OSQP WASM is hard to package, consider `quadprog` or a small convex QP via `wasm-bindgen` from Rust.
