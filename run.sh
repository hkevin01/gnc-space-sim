#!/bin/bash

# GNC Space Simulation - Docker Runner
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

cleanup_containers() {
    print_status "Cleaning up all GNC containers and processes..."
    docker-compose down 2>/dev/null || true
    docker ps -q --filter "ancestor=gnc-sim-simple" | xargs -r docker stop 2>/dev/null || true
    docker ps -q --filter "ancestor=gnc-sim-simple" | xargs -r docker rm 2>/dev/null || true
    pkill -f "5173|5174" 2>/dev/null || true
    print_success "Cleanup completed"
}

start_simulation() {
    print_status "Starting GNC Space Simulation..."
    chmod +x scripts/docker-dev.sh
    ./scripts/docker-dev.sh dev:start
    if [ $? -eq 0 ]; then
        print_success "GNC Space Simulation is now running!"
        echo "🚀 Access: http://localhost:5173"
        echo "🛑 Stop: docker-compose down"
        echo "🧹 Clean: ./run.sh clean"
    fi
}

case "${1:-}" in
    "clean") cleanup_containers ;;
    "stop") docker-compose down && echo "Stopped" ;;
    "restart") cleanup_containers && start_simulation ;;
    "logs") docker-compose logs -f ;;
    "status") docker-compose ps ;;
    *) start_simulation ;;
esac
