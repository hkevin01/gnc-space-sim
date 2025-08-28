# ==========================================
# Universal Docker Development Strategy
# Multi-stage build for consistent environments
# ==========================================

# ==========================================
# Base Node.js Image with Dependencies
# ==========================================
FROM node:22-bullseye-slim AS base

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
RUN groupadd --gid 1001 developer || true && \
  useradd --uid 1001 --gid 1001 --shell /bin/bash --create-home developer || true
# Dependencies Layer (Cached when unchanged)
# ==========================================
FROM base AS dependencies

# Copy package management files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# Copy workspace package manifests explicitly to preserve paths
COPY packages/gnc-core/package.json ./packages/gnc-core/package.json
COPY packages/mission-scenarios/package.json ./packages/mission-scenarios/package.json
COPY packages/ui-components/package.json ./packages/ui-components/package.json
COPY apps/web/package.json ./apps/web/package.json
# Include additional workspace package manifests to match pnpm-workspace.yaml
# Only copy additional workspace manifests if present in context
# tools/* may be empty in some repos; docs/* may not exist. Ignore if no match.
# We cannot conditionally COPY, so we'll just create dirs to keep layer structure consistent.
RUN mkdir -p tools docs

# Install all dependencies (non-frozen in dev container to avoid lockfile mismatch)
RUN pnpm install --no-frozen-lockfile

# ==========================================
# Development Environment
# ==========================================
FROM dependencies AS development

# Copy development configuration
COPY .eslintrc* .prettierrc* tsconfig*.json ./
COPY configs/ ./configs/
COPY tools/ ./tools/

# Copy source code
COPY . .

# Set permissions for non-root user

# Switch to non-root user
USER developer

# Install development tools globally
# Configure pnpm global directories for non-root user and install global tools
ENV PNPM_HOME=/home/developer/.local/share/pnpm
ENV PATH=$PNPM_HOME:/home/developer/.local/bin:$PATH
RUN pnpm config set global-bin-dir /home/developer/.local/bin \
  && pnpm config set global-dir $PNPM_HOME \
  && pnpm install -g @types/node typescript tsx nodemon


# Expose common development ports
EXPOSE 5173 5174 5175 5176 5177 5178 5179 3000 3001 8080 9000

# Default development command
CMD ["pnpm", "dev"]

# ==========================================
# Testing Environment
# ==========================================
FROM development AS testing

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
FROM development AS quality

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
FROM development AS builder

# Build the application
RUN pnpm build

# ==========================================
# Production Environment
# ==========================================
FROM nginx:alpine AS production

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
FROM testing AS ci

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
