# Testing Framework Setup for GNC Space Sim

This document outlines the comprehensive testing framework setup for the GNC Space Sim application.

## Overview

The testing framework includes:

- **Playwright**: End-to-end testing with cross-browser support
- **Cypress**: Alternative E2E testing with excellent developer experience
- **Lighthouse CI**: Automated performance, accessibility, and SEO audits

## Installation

```bash
# Install all dependencies
pnpm install

# Install Playwright browsers
npx playwright install

# Install Cypress (if not already installed)
npx cypress install
```

## Running Tests

### Playwright Tests

```bash
# Run all Playwright tests
pnpm test:playwright

# Run tests in headed mode (see browser)
pnpm test:playwright:headed

# Debug tests
pnpm test:playwright:debug

# Run E2E tests (builds app first)
pnpm test:e2e
```

### Cypress Tests

```bash
# Open Cypress UI
pnpm cypress:open

# Run Cypress tests headlessly
pnpm test:cypress

# Run with visible browser
pnpm test:cypress:headed

# Open Cypress against running dev server
pnpm test:cypress:open
```

### Lighthouse Audits

```bash
# Run Lighthouse CI
pnpm lighthouse

# Run local Lighthouse audit
pnpm lighthouse:local
```

## Test Structure

### Playwright Tests (`apps/web/tests/playwright/`)

- `smoke.spec.ts` - Basic application loading and functionality
- `orbital-mechanics.spec.ts` - Advanced orbital mechanics testing
- `fixtures.ts` - Custom test fixtures and utilities

### Cypress Tests (`apps/web/tests/cypress/`)

- `e2e/smoke.cy.ts` - Basic E2E smoke tests
- `e2e/orbital-mechanics.cy.ts` - Comprehensive orbital mechanics tests
- `support/e2e.ts` - E2E test configuration
- `support/component.ts` - Component testing setup

## Configuration Files

- `playwright.config.ts` - Playwright configuration
- `cypress.config.ts` - Cypress configuration
- `lighthouserc.json` - Lighthouse CI configuration

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. TypeScript type checking
2. ESLint code quality checks
3. Unit tests with Vitest
4. Application build
5. Playwright E2E tests
6. Cypress E2E tests
7. Lighthouse performance audits

## Test Coverage

The tests cover:

- ✅ Application loading and basic functionality
- ✅ 3D scene rendering and interactions
- ✅ Orbital mechanics telemetry
- ✅ Mission phase transitions
- ✅ Responsive design across devices
- ✅ Accessibility features
- ✅ Performance metrics
- ✅ Console error monitoring

## Development Workflow

1. **Local Development**: Use `pnpm test:playwright:headed` or `pnpm cypress:open` for interactive testing
2. **Pre-commit**: Run `pnpm test:e2e` to ensure changes don't break functionality
3. **CI Pipeline**: All tests run automatically on push/PR to main branch

## Performance Budgets

Lighthouse CI enforces:

- Performance: 80% minimum score
- Accessibility: 90% minimum score
- Best Practices: 85% minimum score
- SEO: 90% minimum score

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout values in config files
2. **3D scene not loading**: Check WebGL support and canvas element visibility
3. **Flaky tests**: Add proper wait conditions and retry logic
4. **CI failures**: Check browser installation and dependencies

### Debug Mode

```bash
# Playwright debug mode
pnpm test:playwright:debug

# Cypress debug mode
DEBUG=cypress:* pnpm cypress:run
```

## Adding New Tests

1. Create test files in appropriate directories
2. Follow existing naming conventions (`*.spec.ts` for Playwright, `*.cy.ts` for Cypress)
3. Use page object patterns for complex interactions
4. Add proper assertions and wait conditions
5. Test both happy path and error scenarios

## Best Practices

- Use data attributes (`data-testid`) for stable selectors
- Write tests that are independent and can run in any order
- Mock external dependencies when appropriate
- Keep tests focused and atomic
- Use meaningful test descriptions
- Add visual regression testing for critical UI components
