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

## Current Features

- **Real-time 3D orbit visualization** using React Three Fiber
- **Interactive mission panel** with phase selection (LEO → Escape → Cruise → etc.)
- **Two-body orbit propagation** with Keplerian elements
- **Modern TypeScript architecture** with strict typing
- **Responsive Tailwind UI** with dark theme
- **Containerized development** with VS Code devcontainer support

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
