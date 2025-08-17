# GNC Space Sim Monorepo

Packages:
- apps/web: Frontend React + R3F scene
- packages/gnc-core: TypeScript GNC utilities
- packages/gnc-rust: Rust->WASM kernels (placeholder)
- packages/ui-components: Shared UI components
- packages/mission-scenarios: Scenario definitions

Use pnpm workspaces.

## Quick start

```bash
pnpm i
pnpm dev
```

Open <https://localhost:5173>

## Features
- Real-time 3D visualization with react-three-fiber
- Orbit propagation: two-body now, n-body planned
- Guidance (Lambert, pork-chop), Navigation (EKF), Control (att/rcs)
- Tailwind UI, Plotly charts, time controls

## Repository layout
- apps/web – UI/scene
- packages/gnc-core – Core TS + worker bindings
- packages/gnc-rust – Rust WASM kernels
- packages/ui-components – Reusable components
- packages/mission-scenarios – Scenario data
- docs – Architecture and plans
- scripts – Utility scripts

## Contributing
See CONTRIBUTING.md

## License
MIT
