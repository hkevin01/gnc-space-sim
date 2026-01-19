#!/bin/bash

# Git Configuration and Commit Helper
# This script configures Git user and commits the testing framework changes

set -e

echo "🔧 Configuring Git user..."

# Configure Git user locally for this repository
git config user.email "kevin.hildebrand@gmail.com"
git config user.name "hkevin01"

echo "✅ Git user configured"

# Check current status
echo "📋 Current Git status:"
git status --short

# Commit the staged changes
echo "💾 Committing testing framework implementation..."
git commit -m "feat: Add comprehensive testing framework with Playwright, Cypress, and Lighthouse

- Add Playwright E2E testing with cross-browser support
- Add Cypress testing with interactive development mode
- Add Lighthouse CI for performance, accessibility, and SEO audits
- Update GitHub Actions CI pipeline with testing stages
- Add comprehensive test suites for space simulation features
- Add utility scripts and documentation for testing workflow
- Configure TypeScript support for testing frameworks
- Add performance budgets and quality gates"

echo "✅ Testing framework implementation committed successfully!"

# Show the commit
git log --oneline -1

echo ""
echo "🎉 Ready to push changes!"
echo "Run: git push origin main"
