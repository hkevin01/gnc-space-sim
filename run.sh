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
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check Docker/Compose availability
has_docker() {
    command -v docker &> /dev/null && docker info &> /dev/null
}

has_docker_compose() {
    (command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1) && docker info &> /dev/null
}

cleanup_containers() {
    print_status "Cleaning up containers and processes..."

    # Only try Docker commands if Docker is available
    if has_docker; then
        if has_docker_compose; then
            docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
        fi
        docker ps -q --filter "ancestor=gnc-sim-simple" | xargs -r docker stop 2>/dev/null || true
        docker ps -q --filter "ancestor=gnc-sim-simple" | xargs -r docker rm 2>/dev/null || true
    fi

    # Kill any running dev servers
    print_status "Stopping development servers..."
    pkill -f "vite.*dev" 2>/dev/null || true
    pkill -f "pnpm.*dev" 2>/dev/null || true
    pkill -f "5173|5174|5175|5176|5177" 2>/dev/null || true

    # Wait for processes to terminate
    sleep 2
    print_success "Cleanup completed"
}

start_simulation() {
    print_status "Starting GNC Space Simulation..."

    # Check if we can use Docker
    if has_docker_compose; then
        print_status "Using Docker Compose (full stack)..."
        chmod +x scripts/docker-dev.sh
        # Start web + (optional) backing services
        ./scripts/docker-dev.sh stack:start
        if [ $? -eq 0 ]; then
            print_success "GNC Space Simulation is now running!"
            echo "🚀 Web UI:       http://localhost:5173"
            echo "🗄️  Database:     localhost:5432 (profile: database)"
            echo "🧠 Cache:        localhost:6379 (profile: cache)"
            echo "📈 Monitoring:   http://localhost:9090 (Prometheus) | http://localhost:3001 (Grafana)"
            echo "🛑 Stop:         ./scripts/docker-dev.sh stack:stop (or docker compose down)"
            echo "🧹 Clean:        ./run.sh clean"
        fi
    elif has_docker; then
        print_error "Docker is installed, but Docker Compose is missing. Please install the Docker Compose plugin."
        echo
        echo "On Linux (Docker Engine >= 20.10):"
        echo "  sudo apt-get install docker-compose-plugin"
        echo
        echo "Alternatively, install 'docker-compose' v1 binary or upgrade Docker Desktop."
        exit 1
    else
        if [ "${ALLOW_NON_DOCKER:-}" = "1" ]; then
            # Optional fallback to direct pnpm development
            print_status "Docker not available. Starting in local development mode..."

            # Stop any existing servers first
            print_status "Stopping existing development servers..."
            pkill -f "vite.*dev" 2>/dev/null || true
            pkill -f "pnpm.*dev" 2>/dev/null || true
            sleep 2

            # Install dependencies if needed
            if [ ! -d "node_modules" ]; then
                print_status "Installing dependencies..."
                pnpm install
            fi

            # Start development server
            print_status "Starting development server..."
            print_success "GNC Space Simulation is starting!"
            echo "🚀 Starting at: http://localhost:5173 (or next available port)"
            echo "🌙 SLS Demo: Select 'SLS Artemis' mode in the UI"
            echo "🛑 Stop: Ctrl+C"
            echo ""
            echo "💡 Tip: If the page appears blank, check these URLs:"
            echo "   http://localhost:5173/"
            echo "   http://localhost:5174/"
            echo "   http://localhost:5175/"
            echo "   http://localhost:5176/"
            echo "   http://localhost:5177/"

            pnpm dev
        else
            print_error "Docker is not available. Please install Docker and Docker Compose to run via run.sh."
            echo "To bypass Docker temporarily (not recommended), run: ALLOW_NON_DOCKER=1 ./run.sh"
            exit 1
        fi
    fi
}

case "${1:-}" in
    "clean") cleanup_containers ;;
    "stop")
        print_status "Stopping all development servers..."
        if has_docker && has_docker_compose; then
            docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
        fi
        pkill -f "vite.*dev" 2>/dev/null || true
        pkill -f "pnpm.*dev" 2>/dev/null || true
        pkill -f "5173|5174|5175|5176|5177" 2>/dev/null || true
        print_success "Stopped" ;;
    "restart")
        print_status "Restarting GNC Space Simulation..."
        cleanup_containers
        start_simulation ;;
    "status")
        if has_docker && has_docker_compose; then
            docker-compose ps 2>/dev/null || docker compose ps 2>/dev/null || true
        fi
        echo "Development server status:"
        if pgrep -f "vite.*dev" > /dev/null; then
            echo "✅ Development server is running"
            # Find which port
            for port in 5173 5174 5175 5176 5177; do
                if curl -s http://localhost:$port/ >/dev/null 2>&1; then
                    echo "🚀 Available at: http://localhost:$port/"
                    break
                fi
            done
        else
            echo "❌ Development server is not running"
        fi ;;
    *)
        # Default behavior - check if something is running and restart if needed
        if pgrep -f "vite.*dev" > /dev/null || pgrep -f "pnpm.*dev" > /dev/null; then
            print_status "Development server already running. Restarting..."
            cleanup_containers
        fi
        start_simulation ;;
esac
