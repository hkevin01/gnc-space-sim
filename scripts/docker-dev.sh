#!/bin/bash

# ==========================================
# Universal Docker Development Helper Script
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Environment setup
setup_environment() {
    print_header "Setting up Docker environment"

    # Create necessary directories
    mkdir -p database/init
    mkdir -p logs

    # Copy environment template if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from template"
        else
            create_env_template
        fi
    fi

    print_success "Environment setup complete"
}

# Create environment template
create_env_template() {
    cat > .env << EOF
# Development Environment Variables
NODE_ENV=development
VITE_HOST=0.0.0.0

# Database Configuration
POSTGRES_DB=gnc_space_sim
POSTGRES_USER=gnc_dev
POSTGRES_PASSWORD=gnc_password_123

# Monitoring
GRAFANA_ADMIN_PASSWORD=gnc_admin_123

# Security (Change in production)
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
EOF
    print_success "Created .env template"
}

# Development commands
dev_start() {
    print_header "Starting development environment"
    setup_environment
    docker-compose up -d web
    print_success "Development server started at http://localhost:5173"
}

dev_stop() {
    print_header "Stopping development environment"
    docker-compose down
    print_success "Development environment stopped"
}

dev_restart() {
    print_header "Restarting development environment"
    docker-compose restart web
    print_success "Development server restarted"
}

dev_logs() {
    print_header "Showing development logs"
    docker-compose logs -f web
}

# Testing commands
test_run() {
    print_header "Running test suite"
    docker-compose --profile testing up --build test
    print_success "Tests completed"
}

test_watch() {
    print_header "Running tests in watch mode"
    docker-compose --profile testing run --rm test pnpm test:watch
}

# Quality assurance
qa_run() {
    print_header "Running quality assurance checks"
    docker-compose --profile quality up --build qa
    print_success "QA checks completed"
}

qa_lint() {
    print_header "Running linter"
    docker-compose --profile quality run --rm qa pnpm lint
}

qa_format() {
    print_header "Formatting code"
    docker-compose --profile quality run --rm qa pnpm format
}

qa_typecheck() {
    print_header "Running TypeScript checks"
    docker-compose --profile quality run --rm qa pnpm typecheck
}

# Build commands
build_dev() {
    print_header "Building development image"
    docker-compose build web
    print_success "Development image built"
}

build_prod() {
    print_header "Building for production"
    docker-compose --profile build up --build build
    print_success "Production build completed"
}

build_all() {
    print_header "Building all images"
    docker-compose build
    print_success "All images built"
}

# Production commands
prod_start() {
    print_header "Starting production environment"
    docker-compose --profile production up -d production
    print_success "Production server started at http://localhost:8080"
}

prod_stop() {
    print_header "Stopping production environment"
    docker-compose --profile production down
    print_success "Production environment stopped"
}

# Full stack commands
stack_start() {
    print_header "Starting full development stack"
    setup_environment
    docker-compose --profile database --profile cache up -d
    docker-compose up -d web
    print_success "Full stack started"
    echo -e "${BLUE}Services available:${NC}"
    echo -e "  - Web: http://localhost:5173"
    echo -e "  - Database: localhost:5432"
    echo -e "  - Cache: localhost:6379"
}

stack_stop() {
    print_header "Stopping full stack"
    docker-compose --profile database --profile cache down
    print_success "Full stack stopped"
}

# Monitoring commands
monitoring_start() {
    print_header "Starting monitoring stack"
    docker-compose --profile monitoring up -d
    print_success "Monitoring started"
    echo -e "${BLUE}Monitoring available:${NC}"
    echo -e "  - Prometheus: http://localhost:9090"
    echo -e "  - Grafana: http://localhost:3001 (admin/gnc_admin_123)"
}

monitoring_stop() {
    print_header "Stopping monitoring stack"
    docker-compose --profile monitoring down
    print_success "Monitoring stopped"
}

# CI/CD commands
ci_run() {
    print_header "Running CI/CD pipeline"
    docker-compose --profile ci up --build ci
    print_success "CI/CD pipeline completed"
}

# Utility commands
clean_all() {
    print_header "Cleaning up Docker resources"
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

logs_all() {
    print_header "Showing all container logs"
    docker-compose logs -f
}

status() {
    print_header "Container status"
    docker-compose ps
}

# Database utilities
db_shell() {
    print_header "Opening database shell"
    docker-compose --profile database exec database psql -U gnc_dev -d gnc_space_sim
}

db_backup() {
    print_header "Creating database backup"
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker-compose --profile database exec database pg_dump -U gnc_dev gnc_space_sim > "backup_${timestamp}.sql"
    print_success "Database backup created: backup_${timestamp}.sql"
}

# Help function
show_help() {
    cat << EOF
🚀 GNC Space Simulation - Universal Docker Development Helper

DEVELOPMENT COMMANDS:
  dev:start       Start development environment
  dev:stop        Stop development environment
  dev:restart     Restart development server
  dev:logs        Show development logs

TESTING COMMANDS:
  test:run        Run test suite
  test:watch      Run tests in watch mode

QUALITY ASSURANCE:
  qa:run          Run all QA checks
  qa:lint         Run linter
  qa:format       Format code
  qa:typecheck    Run TypeScript checks

BUILD COMMANDS:
  build:dev       Build development image
  build:prod      Build for production
  build:all       Build all images

PRODUCTION COMMANDS:
  prod:start      Start production environment
  prod:stop       Stop production environment

FULL STACK COMMANDS:
  stack:start     Start full development stack (web + db + cache)
  stack:stop      Stop full development stack

MONITORING COMMANDS:
  monitoring:start Start monitoring stack (Prometheus + Grafana)
  monitoring:stop  Stop monitoring stack

CI/CD COMMANDS:
  ci:run          Run CI/CD pipeline

UTILITY COMMANDS:
  clean           Clean up all Docker resources
  logs            Show all container logs
  status          Show container status
  setup           Setup development environment

DATABASE COMMANDS:
  db:shell        Open database shell
  db:backup       Create database backup

EXAMPLES:
  ./scripts/docker-dev.sh dev:start
  ./scripts/docker-dev.sh test:run
  ./scripts/docker-dev.sh stack:start
  ./scripts/docker-dev.sh monitoring:start

EOF
}

# Main command dispatcher
case "${1:-help}" in
    "dev:start")    dev_start ;;
    "dev:stop")     dev_stop ;;
    "dev:restart")  dev_restart ;;
    "dev:logs")     dev_logs ;;
    "test:run")     test_run ;;
    "test:watch")   test_watch ;;
    "qa:run")       qa_run ;;
    "qa:lint")      qa_lint ;;
    "qa:format")    qa_format ;;
    "qa:typecheck") qa_typecheck ;;
    "build:dev")    build_dev ;;
    "build:prod")   build_prod ;;
    "build:all")    build_all ;;
    "prod:start")   prod_start ;;
    "prod:stop")    prod_stop ;;
    "stack:start")  stack_start ;;
    "stack:stop")   stack_stop ;;
    "monitoring:start") monitoring_start ;;
    "monitoring:stop")  monitoring_stop ;;
    "ci:run")       ci_run ;;
    "clean")        clean_all ;;
    "logs")         logs_all ;;
    "status")       status ;;
    "setup")        setup_environment ;;
    "db:shell")     db_shell ;;
    "db:backup")    db_backup ;;
    "help"|*)       show_help ;;
esac
