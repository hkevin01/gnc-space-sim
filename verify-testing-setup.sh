#!/bin/bash

# Simple verification script to check if testing dependencies are installed

echo "🔍 Checking testing framework setup..."

# Check if required binaries exist
check_binary() {
    if command -v "$1" &> /dev/null; then
        echo "✅ $1 is available"
        return 0
    else
        echo "❌ $1 is not available"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

echo "✅ In project root directory"

# Check for test configuration files
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1 exists"
        return 0
    else
        echo "❌ $1 missing"
        return 1
    fi
}

echo ""
echo "📁 Checking configuration files..."
check_file "apps/web/playwright.config.ts"
check_file "apps/web/cypress.config.ts"
check_file "lighthouserc.json"
check_file ".github/workflows/ci.yml"

echo ""
echo "📂 Checking test directories..."
check_file "apps/web/tests/playwright/smoke.spec.ts"
check_file "apps/web/tests/cypress/e2e/smoke.cy.ts"

echo ""
echo "📦 Checking package.json scripts..."
if grep -q "test:playwright" package.json; then
    echo "✅ Playwright scripts configured"
else
    echo "❌ Playwright scripts missing"
fi

if grep -q "test:cypress" package.json; then
    echo "✅ Cypress scripts configured"
else
    echo "❌ Cypress scripts missing"
fi

if grep -q "lighthouse" package.json; then
    echo "✅ Lighthouse scripts configured"
else
    echo "❌ Lighthouse scripts missing"
fi

echo ""
echo "🎯 Testing framework setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm install' to install dependencies"
echo "2. Run 'npx playwright install' to install browsers"
echo "3. Run './test-runner.sh setup' to complete setup"
echo "4. Run './test-runner.sh all' to run full test suite"
