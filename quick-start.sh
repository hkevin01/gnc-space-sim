#!/bin/bash

# GNC Space Simulation - Simple Startup
# =====================================

cd /workspaces/gnc-space-sim

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[GNC-SIM]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

print_status "Starting GNC Space Simulation in Development Mode..."

# Check if we're already running
if pgrep -f "vite.*dev" > /dev/null; then
    print_warning "Development server is already running!"
    echo ""
    echo "🚀 Your GNC Space Simulation is available at:"

    # Find the actual port
    VITE_PROCESS=$(ps aux | grep "vite" | grep -v grep | head -1)
    if echo "$VITE_PROCESS" | grep -q "5177"; then
        echo "   http://localhost:5177/"
    elif echo "$VITE_PROCESS" | grep -q "5176"; then
        echo "   http://localhost:5176/"
    elif echo "$VITE_PROCESS" | grep -q "5175"; then
        echo "   http://localhost:5175/"
    elif echo "$VITE_PROCESS" | grep -q "5174"; then
        echo "   http://localhost:5174/"
    elif echo "$VITE_PROCESS" | grep -q "5173"; then
        echo "   http://localhost:5173/"
    else
        echo "   Check the running Vite server output for the correct port"
    fi

    echo ""
    echo "🌙 Try the SLS Artemis mission demo!"
    echo "🛑 To stop: pkill -f vite"
    echo "🔄 To restart: ./start-gnc.sh"
    exit 0
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
fi

# Start development server
print_status "Starting development server..."
print_success "GNC Space Simulation is starting!"
echo ""
echo "🚀 Starting at: http://localhost:5174 (or next available port)"
echo "🌙 SLS Demo: Select 'SLS Artemis' mode in the UI"
echo "🛑 Stop: Ctrl+C"
echo ""

# Run the development server
pnpm dev
