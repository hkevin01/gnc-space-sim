#!/bin/bash

# GNC Space Simulation - Fresh Start
# ==================================

cd /workspaces/gnc-space-sim

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[GNC-SIM]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

print_status "Starting GNC Space Simulation - Fresh Setup"
echo ""

# Step 1: Stop any running servers
print_status "Stopping any existing development servers..."
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "pnpm.*dev" 2>/dev/null || true
sleep 2

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Step 3: Check TypeScript compilation
print_status "Running TypeScript check..."
pnpm typecheck
if [ $? -ne 0 ]; then
    print_error "TypeScript compilation failed"
    exit 1
fi

# Step 4: Start development server
print_status "Starting development server..."
echo ""
print_success "🚀 Starting GNC Space Simulation!"
echo ""
echo "📍 The application will be available at one of these ports:"
echo "   http://localhost:5173/ (preferred)"
echo "   http://localhost:5174/ (fallback)"
echo "   http://localhost:5175/ (fallback)"
echo ""
echo "🌙 Features to try:"
echo "   • SLS Artemis Mission Demo"
echo "   • Orbital Mechanics Simulation"
echo "   • Trajectory Planning"
echo ""
echo "🛑 To stop: Ctrl+C"
echo ""

# Start the development server
exec pnpm dev
