#!/bin/bash

# GNC Space Sim - Test Runner Utility
# This script provides convenient commands for running different test suites

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Main commands
case "${1:-help}" in
    "setup")
        print_header "Setting up testing environment"
        pnpm install
        npx playwright install
        npx cypress install
        print_success "Testing environment setup complete"
        ;;

    "playwright")
        print_header "Running Playwright tests"
        cd apps/web
        pnpm test:playwright
        print_success "Playwright tests completed"
        ;;

    "playwright:headed")
        print_header "Running Playwright tests (headed)"
        cd apps/web
        pnpm test:playwright:headed
        ;;

    "cypress")
        print_header "Running Cypress tests"
        cd apps/web
        pnpm test:cypress
        print_success "Cypress tests completed"
        ;;

    "cypress:open")
        print_header "Opening Cypress UI"
        cd apps/web
        pnpm test:cypress:open
        ;;

    "lighthouse")
        print_header "Running Lighthouse audit"
        pnpm lighthouse:ci
        print_success "Lighthouse audit completed"
        ;;

    "all")
        print_header "Running full test suite"

        # Type checking
        print_header "TypeScript type checking"
        pnpm typecheck
        print_success "Type checking passed"

        # Linting
        print_header "Code quality checks"
        pnpm lint
        print_success "Linting passed"

        # Unit tests
        print_header "Unit tests"
        pnpm test
        print_success "Unit tests passed"

        # Build
        print_header "Building application"
        pnpm -C apps/web build
        print_success "Build completed"

        # E2E tests
        print_header "End-to-end tests"
        cd apps/web
        pnpm test:playwright
        print_success "E2E tests passed"

        # Performance audit
        print_header "Performance audit"
        cd ../..
        pnpm lighthouse:ci
        print_success "Performance audit completed"

        print_success "All tests passed! 🎉"
        ;;

    "ci")
        print_header "Running CI pipeline locally"

        # Install dependencies
        pnpm install

        # Run quality checks
        pnpm typecheck
        pnpm lint
        pnpm test

        # Build and test
        pnpm -C apps/web build
        cd apps/web
        npx playwright install --with-deps
        pnpm test:playwright

        print_success "CI pipeline completed successfully! 🚀"
        ;;

    "clean")
        print_header "Cleaning test artifacts"
        rm -rf apps/web/playwright-report
        rm -rf apps/web/cypress/videos
        rm -rf apps/web/cypress/screenshots
        rm -rf .lighthouseci
        print_success "Test artifacts cleaned"
        ;;

    "help"|*)
        echo -e "${BLUE}GNC Space Sim - Test Runner${NC}"
        echo ""
        echo "Usage: ./test-runner.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup              Setup testing environment"
        echo "  playwright         Run Playwright tests"
        echo "  playwright:headed  Run Playwright tests with visible browser"
        echo "  cypress            Run Cypress tests"
        echo "  cypress:open       Open Cypress UI"
        echo "  lighthouse         Run Lighthouse performance audit"
        echo "  all                Run complete test suite"
        echo "  ci                 Run CI pipeline locally"
        echo "  clean              Clean test artifacts"
        echo "  help               Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./test-runner.sh setup"
        echo "  ./test-runner.sh playwright"
        echo "  ./test-runner.sh all"
        ;;
esac
