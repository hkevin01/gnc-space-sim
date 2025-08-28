#!/bin/bash
# Quick start script for GNC Space Sim
cd /workspaces/gnc-space-sim

# Stop any existing servers first
echo "🛑 Stopping existing servers..."
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "pnpm.*dev" 2>/dev/null || true
sleep 2

# Start with Docker bypass
echo "🚀 Starting GNC Space Simulation..."
export ALLOW_NON_DOCKER=1
./run.sh
