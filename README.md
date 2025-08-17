# GNC Space Sim Monorepo

A modern, browser-first guidance, navigation, and control (GNC) simulation suite built with TypeScript, React Three Fiber, and WASM.

## Current Status

✅ **Monorepo scaffolding** with pnpm workspaces
✅ **3D visualization** with React Three Fiber and interactive orbit demo
✅ **Mission control UI** with phase selection and Tailwind styling
✅ **TypeScript core** with two-body propagation
✅ **Development environment** with VS Code, Docker, and CI/CD
🚧 **WASM integration** and Lambert solvers (planned)
🚧 **Navigation filters** and pork-chop plots (planned)

## Packages

- `apps/web` - Frontend React app with 3D visualization
- `packages/gnc-core` - Core GNC algorithms and utilities
- `packages/ui-components` - Reusable UI components
- `packages/mission-scenarios` - Mission scenario definitions
- `packages/gnc-rust` - Rust crate for WASM kernels (scaffolded)

## Quick Start

**Prerequisites:** Node.js 18+, pnpm 9+

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser to http://localhost:5173
```

## Available Commands

```bash
# Development
pnpm dev              # Start web app dev server
pnpm build            # Build all packages
pnpm test             # Run tests across all packages
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript checking

# Individual packages
pnpm --filter @gnc/web dev    # Web app only
pnpm --filter @gnc/core test  # Core package tests
```

## Development Status

✅ **Dependencies installed and working**
✅ **TypeScript compilation passing**
✅ **Core tests passing** (2 packages with unit tests)
✅ **Development server running** at <http://localhost:5173>
✅ **3D scene rendering** with interactive orbit simulation
✅ **Tailwind CSS styling** applied with dark theme

## Development Setup

The project is fully configured and ready for development. After running `pnpm install` and `pnpm dev`, you'll have:

- A live-reloading development server
- Real-time 3D orbit visualization using React Three Fiber
- Interactive mission phase selector panel
- TypeScript strict mode with full type checking
- Vitest unit tests for core algorithms
- ESLint and Prettier formatting

## Next Development Steps

This foundation supports the full roadmap:

1. **WASM Integration** - Rust package is scaffolded for high-performance integrators
2. **Lambert Solvers** - Core architecture ready for trajectory optimization
3. **Pork-chop Plots** - Plotly integration prepared for transfer planning
4. **Navigation Filters** - EKF/UKF scaffolding can be added to core package
5. **Proximity Operations** - 3D scene supports asteroid models and guidance overlays

## Repository Layout

- `apps/web` – Frontend React app with 3D scene
- `packages/gnc-core` – Core GNC algorithms and math utilities
- `packages/gnc-rust` – Rust WASM kernels (scaffolded)
- `packages/ui-components` – Reusable React components
- `packages/mission-scenarios` – Mission scenario data and types
- `docs/` – Architecture documentation and project plans
- `scripts/` – Development and deployment utilities

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT
