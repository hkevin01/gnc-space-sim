# 🐋 Universal Docker Development Strategy

## Overview

This repository implements a **Universal Docker Development Strategy** that provides:

✅ **Consistent development environment** across all platforms
✅ **One-command setup** for new developers
✅ **Automated code quality and security validation**
✅ **Production-like development infrastructure**
✅ **Comprehensive documentation and support**
✅ **Enterprise-grade CI/CD integration**

## 🚀 Quick Start

### Prerequisites
- Docker Desktop or Docker Engine
- Docker Compose V2
- Git

### One-Command Setup
```bash
# Clone and start development environment
git clone <repository-url>
cd gnc-space-sim
./scripts/docker-dev.sh dev:start
```

Your development environment will be available at:
- **Web Application**: http://localhost:5173
- **API Documentation**: http://localhost:8081 (when docs profile is active)

## 🏗️ Architecture

### Multi-Stage Docker Strategy

Our Dockerfile implements multiple build targets for different use cases:

```dockerfile
base          # System dependencies and tools
dependencies  # Node.js dependencies (cached layer)
development   # Development environment with hot reload
testing       # Testing environment with browsers
quality       # Code quality and linting tools
builder       # Production build environment
production    # Optimized production runtime
ci            # CI/CD environment with additional tools
```

### Service Profiles

Docker Compose uses profiles to organize services by purpose:

| Profile | Services | Purpose |
|---------|----------|---------|
| `default` | web | Basic development |
| `testing` | test | Running test suites |
| `quality` | qa | Code quality checks |
| `build` | build | Production builds |
| `production` | production, nginx | Production deployment |
| `database` | postgres | Database services |
| `cache` | redis | Caching layer |
| `monitoring` | prometheus, grafana | Observability |
| `ci` | ci | CI/CD pipeline |

## 🛠️ Development Commands

### Core Development
```bash
# Start development environment
./scripts/docker-dev.sh dev:start

# Stop development environment
./scripts/docker-dev.sh dev:stop

# Restart development server
./scripts/docker-dev.sh dev:restart

# View development logs
./scripts/docker-dev.sh dev:logs
```

### Testing
```bash
# Run all tests
./scripts/docker-dev.sh test:run

# Run tests in watch mode
./scripts/docker-dev.sh test:watch

# Run specific test suite
docker-compose --profile testing run --rm test pnpm test:unit
```

### Code Quality
```bash
# Run all quality checks
./scripts/docker-dev.sh qa:run

# Run linter only
./scripts/docker-dev.sh qa:lint

# Format code
./scripts/docker-dev.sh qa:format

# Type checking
./scripts/docker-dev.sh qa:typecheck
```

### Building
```bash
# Build development image
./scripts/docker-dev.sh build:dev

# Build for production
./scripts/docker-dev.sh build:prod

# Build all images
./scripts/docker-dev.sh build:all
```

## 🌍 Environment Management

### Environment Variables

Copy the example environment file and customize:
```bash
cp .env.example .env
# Edit .env with your specific configuration
```

Key configurations:
- **NODE_ENV**: Environment mode (development/test/production)
- **Database**: PostgreSQL connection settings
- **Cache**: Redis configuration
- **Security**: JWT secrets and API keys
- **Monitoring**: Grafana and Prometheus settings

### Multi-Environment Support

| Environment | Command | Description |
|-------------|---------|-------------|
| Development | `docker-dev.sh dev:start` | Hot reload, debugging tools |
| Testing | `docker-dev.sh test:run` | Isolated test environment |
| Staging | `docker-compose --profile production` | Production-like testing |
| Production | Production deployment | Optimized, secure runtime |

## 🚀 Full Stack Development

### Start Complete Development Stack
```bash
# Web + Database + Cache + Monitoring
./scripts/docker-dev.sh stack:start
```

This provides:
- **Web Application**: http://localhost:5173
- **PostgreSQL Database**: localhost:5432
- **Redis Cache**: localhost:6379
- **Prometheus Metrics**: http://localhost:9090
- **Grafana Dashboards**: http://localhost:3001

### Database Operations
```bash
# Access database shell
./scripts/docker-dev.sh db:shell

# Create database backup
./scripts/docker-dev.sh db:backup

# Initialize with sample data
docker-compose --profile database exec database psql -U gnc_dev -d gnc_space_sim -f /docker-entrypoint-initdb.d/sample_data.sql
```

## 📊 Monitoring & Observability

### Start Monitoring Stack
```bash
./scripts/docker-dev.sh monitoring:start
```

**Available Dashboards:**
- **Prometheus**: http://localhost:9090 - Metrics collection
- **Grafana**: http://localhost:3001 - Visualization dashboards
  - Username: `admin`
  - Password: `gnc_admin_123`

### Metrics Collected
- Application performance metrics
- Container resource usage
- Database query performance
- API response times
- Error rates and logs

## 🔒 Security & Best Practices

### Security Features
- **Non-root containers**: All services run with minimal privileges
- **Secret management**: Environment-based configuration
- **Network isolation**: Custom Docker networks
- **Vulnerability scanning**: Integrated with CI/CD
- **Security headers**: Nginx with security configurations

### Best Practices Implemented
- **Multi-stage builds**: Optimized image sizes
- **Layer caching**: Faster builds with dependency caching
- **Health checks**: Container health monitoring
- **Resource limits**: Memory and CPU constraints
- **Clean shutdown**: Graceful container termination

## 🔄 CI/CD Integration

### GitHub Actions Pipeline

Our CI/CD pipeline includes:

1. **Quality Checks** - Linting, formatting, type checking
2. **Security Scanning** - Vulnerability assessment
3. **Testing Suite** - Unit, integration, E2E tests
4. **Multi-arch Builds** - AMD64 and ARM64 support
5. **Performance Testing** - Load testing and benchmarks
6. **Automated Deployment** - Staging and production deployments

### Pipeline Commands
```bash
# Run complete CI pipeline locally
./scripts/docker-dev.sh ci:run

# Individual pipeline steps
docker-compose --profile quality run --rm qa     # Quality checks
docker-compose --profile testing run --rm test   # Test suite
docker-compose --profile build run --rm build    # Production build
```

## 🧹 Maintenance & Cleanup

### Cleanup Commands
```bash
# Clean all Docker resources
./scripts/docker-dev.sh clean

# View container status
./scripts/docker-dev.sh status

# View all logs
./scripts/docker-dev.sh logs
```

### Volume Management
```bash
# List all volumes
docker volume ls

# Remove unused volumes
docker volume prune

# Backup important data
./scripts/docker-dev.sh db:backup
```

## 🎯 Production Deployment

### Production Build
```bash
# Build optimized production image
./scripts/docker-dev.sh build:prod

# Start production environment
./scripts/docker-dev.sh prod:start
```

### Production Features
- **Nginx reverse proxy** with security headers
- **Static asset optimization** with compression
- **Health checks** for monitoring
- **Multi-stage builds** for minimal image size
- **Non-root execution** for security

### Deployment Checklist
- [ ] Environment variables configured
- [ ] SSL certificates in place
- [ ] Database migrations applied
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented

## 📚 Development Workflow

### For New Developers
1. **Clone repository**
2. **Copy environment file**: `cp .env.example .env`
3. **Start development**: `./scripts/docker-dev.sh dev:start`
4. **Begin coding** - Hot reload is automatic
5. **Run tests**: `./scripts/docker-dev.sh test:run`
6. **Quality checks**: `./scripts/docker-dev.sh qa:run`

### Daily Development
```bash
# Morning setup
./scripts/docker-dev.sh dev:start

# During development
./scripts/docker-dev.sh dev:logs    # Check logs
./scripts/docker-dev.sh test:watch # Continuous testing

# Before committing
./scripts/docker-dev.sh qa:run     # Quality checks
./scripts/docker-dev.sh test:run   # Full test suite

# End of day
./scripts/docker-dev.sh dev:stop
```

## 🔧 Customization

### Adding New Services

1. **Add service to docker-compose.yml**
2. **Create appropriate profile**
3. **Update development script**
4. **Add to documentation**

### Environment Customization

Edit `.env` file or create environment-specific files:
- `.env.development`
- `.env.test`
- `.env.production`

### Custom Development Tools

Add tools to the appropriate Dockerfile stage:
```dockerfile
# In development stage
RUN pnpm install -g your-custom-tool
```

## 🆘 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using port 5173
sudo lsof -i :5173
# Change port in .env file
```

**Container startup issues:**
```bash
# Check container logs
docker-compose logs web
# Rebuild containers
docker-compose build --no-cache
```

**Permission issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

**Memory issues:**
```bash
# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory
```

### Getting Help

1. **Check logs**: `./scripts/docker-dev.sh logs`
2. **Container status**: `./scripts/docker-dev.sh status`
3. **Rebuild**: `./scripts/docker-dev.sh build:dev`
4. **Clean start**: `./scripts/docker-dev.sh clean && ./scripts/docker-dev.sh dev:start`

## 📈 Performance Optimization

### Development Performance
- **Volume mounts**: Use for hot reload
- **Build caching**: Multi-stage builds with layer caching
- **Resource limits**: Configure appropriate CPU/memory limits

### Production Performance
- **Asset optimization**: Minification and compression
- **Static serving**: Nginx for static assets
- **Health checks**: Monitoring and alerting
- **Auto-scaling**: Container orchestration ready

## 🎉 Summary

This Universal Docker Development Strategy provides:

- **🔧 Consistent Development**: Same environment for all developers
- **⚡ Fast Setup**: One command to start developing
- **🧪 Comprehensive Testing**: Automated quality assurance
- **🔒 Security First**: Built-in security best practices
- **📊 Full Observability**: Monitoring and logging
- **🚀 Production Ready**: Optimized deployment pipeline
- **📖 Complete Documentation**: Everything you need to know

Start developing with confidence knowing your environment is production-ready from day one! 🌟
