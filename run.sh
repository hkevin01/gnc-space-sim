#!/bin/bash

# GNC Space Simulation - Development Runner
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

# Check if we're in a dev container or have Docker available
has_docker_compose() {
    command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1
}

cleanup_containers() {
    print_status "Cleaning up containers and processes..."
    if has_docker_compose; then
        docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
    fi
    docker ps -q --filter "ancestor=gnc-sim-simple" | xargs -r docker stop 2>/dev/null || true
    docker ps -q --filter "ancestor=gnc-sim-simple" | xargs -r docker rm 2>/dev/null || true
    pkill -f "5173|5174|5175" 2>/dev/null || true
    print_success "Cleanup completed"
}

start_simulation() {
    print_status "Starting GNC Space Simulation..."

    # Check if we can use Docker
    if has_docker_compose; then
        print_status "Using Docker Compose..."
        chmod +x scripts/docker-dev.sh
        ./scripts/docker-dev.sh dev:start
        if [ $? -eq 0 ]; then
            print_success "GNC Space Simulation is now running!"
            echo "🚀 Access: http://localhost:5173"
            echo "🛑 Stop: docker-compose down"
            echo "🧹 Clean: ./run.sh clean"
        fi
    else
        # Fallback to direct pnpm development
        print_status "Docker not available, using direct pnpm development..."

        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_status "Installing dependencies..."
            pnpm install
        fi

        # Start development server
        print_status "Starting development server..."
        print_success "GNC Space Simulation is starting!"
        echo "🚀 Starting at: http://localhost:5174"
        echo "🌙 SLS Demo: Select 'SLS Artemis' mode in the UI"
        echo "🛑 Stop: Ctrl+C"

        # Start the dev server
        pnpm dev
    fi
}

case "${1:-}" in
    "clean") cleanup_containers ;;
    "stop")
        if has_docker_compose; then
            docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
        else
            pkill -f "5173|5174|5175" 2>/dev/null || true
        fi
        echo "Stopped" ;;
    "restart") cleanup_containers && start_simulation ;;
    "logs")
        if has_docker_compose; then
            docker-compose logs -f 2>/dev/null || docker compose logs -f 2>/dev/null || true
        else
            echo "Logs only available in Docker mode"
        fi ;;
    "status")
        if has_docker_compose; then
            docker-compose ps 2>/dev/null || docker compose ps 2>/dev/null || true
        else
            echo "Status: Running in development mode"
            pgrep -f "vite.*dev" && echo "Development server is running" || echo "Development server is not running"
        fi ;;
    *) start_simulation ;;
esac
