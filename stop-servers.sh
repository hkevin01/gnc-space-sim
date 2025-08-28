#!/bin/bash

# Kill all development servers
echo "Stopping all development servers..."
pkill -f "vite.*dev" || true
pkill -f "pnpm.*dev" || true

# Wait a moment
sleep 2

# Check if ports are free
echo "Checking port availability..."
for port in 5173 5174 5175 5176 5177; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "Port $port is still in use"
        lsof -i :$port | head -2
    else
        echo "Port $port is free"
    fi
done

echo ""
echo "All servers stopped. You can now start fresh with:"
echo "cd /workspaces/gnc-space-sim && pnpm dev"
