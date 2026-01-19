# Project Structure

This document explains the organization and purpose of each directory in the GNC Space Simulation project.

## Root Directory

```
gnc-space-sim/
├── 📄 Core Files
│   ├── README.md              # Project overview and documentation
│   ├── package.json           # Root package configuration
│   ├── pnpm-workspace.yaml    # Monorepo workspace definition
│   ├── pnpm-lock.yaml         # Dependency lock file
│   ├── eslint.config.mjs      # ESLint configuration entry point
│   ├── LICENSE                # MIT license
│   ├── CONTRIBUTING.md        # Contribution guidelines
│   ├── SECURITY.md            # Security policy
│   └── PROJECT_STRUCTURE.md   # This file
├── 🔧 Development Environment
│   ├── .devcontainer/         # VS Code development container config
│   ├── .vscode/               # VS Code workspace settings
│   ├── .github/               # GitHub workflows and templates
│   ├── .env.example           # Environment variables template
│   └── .editorconfig          # Editor configuration
├── 🏗️ Build System
│   └── build-tools/           # Build and linting configurations
│       ├── eslint.config.mjs  # ESLint rules and configuration
│       ├── tsconfig.base.json # Base TypeScript configuration
│       ├── .prettierrc        # Code formatting rules
│       ├── lighthouserc.json  # Performance testing config
│       └── ...                # Other build tool configs
├── 🔨 Development Tools
│   ├── tools/                 # Development and deployment utilities
│   │   ├── scripts/           # Automation scripts
│   │   ├── docker/            # Container configurations
│   │   ├── development/       # Development utilities
│   │   ├── testing/           # Testing utilities
│   │   └── deployment/        # Deployment scripts
│   └── dev-tools/             # Additional development tools
├── 🧪 Testing
│   ├── tests/                 # Integration and performance tests
│   │   ├── integration/       # Cross-package integration tests
│   │   └── performance/       # Performance benchmarks
├── 📚 Documentation
│   ├── documentation/         # Technical documentation
│   │   ├── guides/            # User and developer guides
│   │   ├── DOCKER_STRATEGY.md # Docker implementation guide
│   │   ├── PROJECT_GOALS.md   # Project objectives
│   │   └── ...                # Technical specifications
│   └── memory-bank/           # Project memory and decisions
│       ├── app-description.md
│       ├── architecture-decisions/
│       ├── implementation-plans/
│       └── change-log.md
├── 🏠 Applications
│   └── apps/                  # Frontend applications
│       └── web/               # React web application
├── 📦 Packages
│   └── packages/              # Shared libraries and modules
│       ├── gnc-core/          # Core GNC algorithms
│       ├── ui-components/     # Reusable UI components
│       ├── mission-scenarios/ # Mission definitions
│       └── gnc-rust/          # Rust WASM modules (planned)
└── 🗂️ Data & Infrastructure
    ├── database/              # Database initialization scripts
    └── logs/                  # Application logs (development)
```

## Directory Purposes

### Core Files
- **README.md**: Main project documentation with setup instructions
- **package.json**: Root workspace configuration and scripts
- **pnpm-workspace.yaml**: Defines monorepo packages
- **eslint.config.mjs**: Entry point for ESLint configuration

### Development Environment
- **.devcontainer/**: VS Code development container for consistent environment
- **.vscode/**: Workspace-specific VS Code settings
- **.github/**: GitHub Actions workflows and issue templates
- **.env.example**: Template for required environment variables

### Build System (`build-tools/`)
Centralized location for all build and code quality tools:
- **eslint.config.mjs**: Complete ESLint configuration
- **tsconfig.base.json**: Shared TypeScript configuration
- **.prettierrc**: Code formatting rules
- **lighthouserc.json**: Performance testing configuration

### Development Tools (`tools/`)
Organized development utilities:
- **scripts/**: Entry point scripts (`run.sh`, `demo.sh`, etc.)
- **docker/**: All Docker-related files and configurations
- **development/**: Development utilities and helpers
- **testing/**: Testing utilities and scripts
- **deployment/**: Production deployment scripts

### Testing (`tests/`)
- **integration/**: Cross-package integration tests
- **performance/**: Performance benchmarks and stress tests

### Documentation (`documentation/`)
- **guides/**: User guides and tutorials
- Technical specifications and design documents
- **memory-bank/**: Project decisions and architectural history

### Applications (`apps/`)
- **web/**: React Three.js frontend application
- Future applications (mobile, desktop) would go here

### Packages (`packages/`)
- **gnc-core/**: Core physics and mathematics algorithms
- **ui-components/**: Reusable React components
- **mission-scenarios/**: Mission configurations and data
- **gnc-rust/**: High-performance Rust modules (planned)

### Data & Infrastructure
- **database/**: Database schemas and initialization scripts
- **logs/**: Development and runtime logs

## Design Principles

### 1. Separation of Concerns
- Build tools separated from source code
- Documentation organized by audience and purpose
- Development tools isolated from application code

### 2. Professional Organization
- No loose files in root directory
- Clear naming conventions
- Logical grouping by function

### 3. Scalability
- Room for additional applications
- Extensible package structure
- Modular tool organization

### 4. Developer Experience
- Easy to find what you're looking for
- Consistent organization patterns
- Clear entry points for different tasks

## Quick Navigation

| Task              | Location                 |
| ----------------- | ------------------------ |
| Start development | `./tools/scripts/run.sh` |
| Run tests         | `pnpm test`              |
| Build project     | `pnpm build`             |
| View docs         | `documentation/`         |
| Configure build   | `build-tools/`           |
| Add new app       | `apps/`                  |
| Add new package   | `packages/`              |
| Docker setup      | `tools/docker/`          |
| Scripts           | `tools/scripts/`         |

This structure supports both current development needs and future expansion while maintaining professional standards and developer productivity.
"