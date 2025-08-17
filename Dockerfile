# ==========================================
# Universal Docker Development Strategy
# Multi-stage build for consistent environments
# ==========================================

# ==========================================
# Base Node.js Image with Dependencies
# ==========================================
FROM node:22-bullseye-slim as base

# Install system dependencies for development
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    nano \
    htop \
    procps \
    build-essential \
    python3 \
    python3-pip \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI for Docker-in-Docker scenarios
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update && apt-get install -y docker-ce-cli && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /workspace

# Enable and configure pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Create non-root user for security
RUN groupadd --gid 1000 developer && \
    useradd --uid 1000 --gid developer --shell /bin/bash --create-home developer

# ==========================================
# Dependencies Layer (Cached when unchanged)
# ==========================================
FROM base as dependencies

# Copy package management files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ==========================================
# Development Environment
# ==========================================
FROM dependencies as development

# Copy development configuration
COPY .eslintrc* .prettierrc* tsconfig*.json ./
COPY configs/ ./configs/
COPY tools/ ./tools/

# Copy source code
COPY . .

# Set permissions for non-root user
RUN chown -R developer:developer /workspace

# Switch to non-root user
USER developer

# Install development tools globally
RUN pnpm install -g @types/node typescript tsx nodemon

# Expose common development ports
EXPOSE 5173 5174 5175 5176 5177 5178 5179 3000 3001 8080 9000

# Default development command
CMD ["pnpm", "dev"]

# ==========================================
# Testing Environment
# ==========================================
FROM development as testing

USER root

# Install additional testing tools
RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install global testing utilities
RUN pnpm install -g \
    playwright \
    @playwright/test \
    jest \
    vitest \
    cypress

USER developer

# Run tests by default
CMD ["pnpm", "test"]

# ==========================================
# Quality Assurance (Linting, Type Checking)
# ==========================================
FROM development as quality

# Install quality tools
RUN pnpm install -g \
    eslint \
    prettier \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin

# Default QA command
CMD ["pnpm", "run", "qa"]

# ==========================================
# Build Environment
# ==========================================
FROM development as builder

# Build the application
RUN pnpm build

# ==========================================
# Production Environment
# ==========================================
FROM nginx:alpine as production

# Copy built assets
COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# CI/CD Environment
# ==========================================
FROM testing as ci

USER root

# Install additional CI tools
RUN apt-get update && apt-get install -y \
    jq \
    zip \
    unzip \
    awscli \
    && rm -rf /var/lib/apt/lists/*

# Install security scanning tools
RUN pnpm install -g \
    audit-ci \
    snyk \
    npm-audit-html

USER developer

# CI pipeline command
CMD ["pnpm", "run", "ci"]
