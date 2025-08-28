#!/bin/bash

echo "🔍 Checking for processes using ports 5173-5177..."

# Check what's running on these ports
for port in 5173 5174 5175 5176 5177; do
    echo "Port $port:"
    lsof -ti:$port 2>/dev/null | while read pid; do
        if [ ! -z "$pid" ]; then
            echo "  PID $pid: $(ps -p $pid -o comm= 2>/dev/null || echo 'unknown')"
        fi
    done
done

echo
echo "🧹 Cleaning up all Vite/Node processes..."

# Kill all node processes that might be Vite servers
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true

# Kill specific ports
for port in 5173 5174 5175 5176 5177; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

echo "✅ Cleanup complete!"

# Wait a moment for ports to be released
sleep 2

echo "🚀 Starting fresh development server..."
cd /workspaces/gnc-space-sim
pnpm dev
