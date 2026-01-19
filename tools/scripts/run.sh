#!/bin/bash

# GNC Space Simulation - Simplified Development Runner
set -e

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

# Check if port 5173 is available
check_port() {
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
        return 1
    else
        return 0
    fi
}

start_local_dev() {
    print_status "Starting GNC Space Simulation in local development mode..."
    
    # Stop any existing servers
    print_status "Stopping existing development servers..."
    pkill -f "vite.*dev" 2>/dev/null || true
    pkill -f "pnpm.*dev" 2>/dev/null || true
    sleep 2
    
    # Check if port is available
    if ! check_port; then
        print_warning "Port 5173 is in use. Attempting to free it..."
        pkill -f "5173" 2>/dev/null || true
        sleep 2
    fi
    
    # Install dependencies if needed
    if [ ! -d "apps/web/node_modules" ]; then
        print_status "Installing dependencies..."
        cd apps/web
        pnpm install
        cd ../..
    fi
    
    # Start development server
    print_status "Starting development server..."
    print_success "GNC Space Simulation is starting!"
    echo "🚀 Web UI: http://localhost:5173"
    echo "🌙 SLS Demo: Select 'SLS Artemis' mode in the UI"
    echo "🛑 Stop: Ctrl+C or ./run.sh stop"
    echo ""
    
    cd apps/web
    pnpm dev
}

stop_servers() {
    print_status "Stopping all development servers..."
    pkill -f "vite.*dev" 2>/dev/null || true
    pkill -f "pnpm.*dev" 2>/dev/null || true
    pkill -f "5173|5174|5175|5176|5177" 2>/dev/null || true
    print_success "Stopped"
}

case "${1:-}" in
    "stop")
        stop_servers ;;
    "status")
        if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_success "Development server is running at http://localhost:5173"
        else
            print_warning "Development server is not running"
        fi ;;
    *)
        # Default behavior - start local development
        if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_status "Development server already running. Restarting..."
            stop_servers
            sleep 2
        fi
        start_local_dev ;;
esac
