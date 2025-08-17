# GNC Space Sim – Project Plan

This plan tracks phases with actionable checklists. Check off items as they complete.

## Phase 1 – Monorepo & Frontend Scaffold

- [ ] Initialize pnpm monorepo with apps and packages
- [ ] Scaffold React + Vite + TS app with Tailwind and react-three-fiber
- [ ] Add ESLint/Prettier and VS Code workspace settings
- [ ] Set up CI (build, lint, typecheck) on GitHub Actions
- [ ] Dockerize dev environment (frontend service)

Details:

- Use pnpm workspaces and workspace:* protocol.
- Tailwind v4 via @tailwindcss/vite plugin and @import "tailwindcss".
- Add Vitest for unit tests and Playwright/Puppeteer for headless WebGL smoke tests.

## Phase 2 – Core Simulation Kernel (TS + WASM stubs)

- [ ] Create @gnc/core TypeScript package (interfaces for states, forces, propagator)
- [ ] Wire Worker + Comlink scaffolding for physics thread
- [ ] Add @gnc/rust crate for WASM integrators (stub lambert + RKF)
- [ ] Provide TypeScript bindings and tests
- [ ] Add minimal scenario loader and time controls

Details:

- Define propagate(state0, tSpan, forces) interface.
- Implement two-body analytic step for smoke test; plan for Cowell in WASM.

## Phase 3 – Guidance & Visualization

- [ ] Implement Lambert (Rust->WASM) and TS wrapper
- [ ] Pork-chop plot module and UI panel
- [ ] Render trajectory arcs and maneuver vectors
- [ ] Interactive node editor to tweak burns and re-solve
- [ ] Logging of delta-v budget

Details:

- Validate against poliastro or known examples.
- Cache pork-chop contours for responsiveness.

## Phase 4 – Navigation & Sensors

- [ ] Sensor models (IMU, star tracker, sun sensor, optical nav)
- [ ] EKF/UKF scaffold and covariance propagation
- [ ] Residual plots and covariance ellipsoids in 3D
- [ ] Fault injection toggles and logs
- [ ] Monte Carlo harness

Details:

- Provide NEES/NIS consistency tests and sample datasets.

## Phase 5 – Proximity Ops & Mars Arrival

- [ ] Asteroid model with polyhedral gravity option
- [ ] Glideslope guidance for TAG
- [ ] Attitude control and thrust allocation visualization
- [ ] Mars arrival corridor visual and dispersions
- [ ] Export recording (WebM) and scenario share links

Details:

- Switch gravity model fidelity by scenario.
- Add keep-out cones and thermal constraints overlays.
