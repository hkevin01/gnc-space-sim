#!/bin/bash

# Quick Git Fix and Commit
echo "🔧 Fixing Git configuration and committing changes..."

# Configure Git user
git config user.email "kevin.hildebrand@gmail.com"
git config user.name "hkevin01"

# Show status
echo "📋 Current status:"
git status --short

# Commit the changes
echo "💾 Committing testing framework..."
git commit -m "feat: Implement comprehensive testing framework

✨ Features:
- Playwright E2E testing with cross-browser support
- Cypress testing with interactive development mode
- Lighthouse CI for performance/accessibility audits
- Enhanced GitHub Actions CI pipeline
- Comprehensive test suites for orbital mechanics
- TypeScript support for all testing frameworks
- Performance budgets and quality gates

📁 Files added/modified:
- Playwright config and tests
- Cypress config and tests
- Lighthouse CI configuration
- GitHub Actions workflow updates
- Testing utilities and documentation
- Package.json script enhancements"

echo "✅ Commit successful!"
git log --oneline -1

echo ""
echo "🚀 Testing framework is ready!"
echo "📖 See TESTING_IMPLEMENTATION.md for documentation"
