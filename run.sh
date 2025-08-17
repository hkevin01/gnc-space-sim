#!/bin/bash

# GNC Space Simulation - Docker Runner
# Quick start script for containerized development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[GNC-SIM]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check if docker-compose is available
check_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi
}

# Main function
main() {
    print_status "Starting GNC Space Simulation..."

    # Check prerequisites
    check_docker
    check_compose

    # Check if scripts/docker-dev.sh exists
    if [ ! -f "scripts/docker-dev.sh" ]; then
        print_error "scripts/docker-dev.sh not found. Please ensure you're in the project root."
        exit 1
    fi

    # Make docker-dev.sh executable
    chmod +x scripts/docker-dev.sh

    print_status "Building and starting development environment..."

    # Start the development environment
    ./scripts/docker-dev.sh dev:start

    if [ $? -eq 0 ]; then
        print_success "GNC Space Simulation is now running!"
        echo ""
        echo "🚀 Access the application at: http://localhost:5173"
        echo "📊 Monitor logs with: docker-compose logs -f"
        echo "🛑 Stop with: docker-compose down"
        echo ""
        print_status "Available mission phases:"
        echo "  • Earth Launch - Rocket ascent with atmospheric effects"
        echo "  • Orbital Transfer - Hohmann and bi-elliptic transfers"
        echo "  • Deep Space - Asteroid encounters and Mars approach"
        echo "  • Landing - Powered descent and surface operations"
    else
        print_error "Failed to start GNC Space Simulation"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping GNC Space Simulation..."
        docker-compose down
        print_success "Stopped successfully"
        ;;
    "restart")
        print_status "Restarting GNC Space Simulation..."
        docker-compose down
        ./scripts/docker-dev.sh dev:start
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        main
        ;;
esac
