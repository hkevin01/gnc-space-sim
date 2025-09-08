#!/bin/bash

# Docker Development Script for GNC Space Simulation
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[DOCKER-DEV]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Ensure script is executable
chmod +x "$0"

case "${1:-}" in
    "dev:start")
        print_status "Starting development environment..."
        docker-compose up -d web
        print_success "Development server starting at http://localhost:5173"
        ;;
    "dev:stop")
        print_status "Stopping development environment..."
        docker-compose down
        print_success "Development environment stopped"
        ;;
    "stack:start")
        print_status "Starting full stack..."
        docker-compose up -d
        print_success "Full stack started"
        ;;
    "test:run")
        print_status "Running tests in clean environment..."
        docker-compose run --rm test pnpm test
        print_success "Tests completed"
        ;;
    "qa:run")
        print_status "Running quality assurance pipeline..."
        docker-compose run --rm test pnpm qa
        print_success "QA pipeline completed"
        ;;
    "build:prod")
        print_status "Building production images..."
        docker-compose build --target production
        print_success "Production build completed"
        ;;
    "clean")
        print_status "Cleaning Docker resources..."
        docker-compose down -v
        docker system prune -f
        print_success "Docker resources cleaned"
        ;;
    "monitoring:start")
        print_status "Starting monitoring stack..."
        print_warning "Monitoring not yet implemented"
        ;;
    *)
        echo "Usage: $0 {dev:start|dev:stop|stack:start|test:run|qa:run|build:prod|clean|monitoring:start}"
        exit 1
        ;;
esac
