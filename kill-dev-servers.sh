#!/bin/bash

echo "🛑 Stopping all development servers..."

# Kill all processes using the common development ports
for port in 5173 5174 5175 5176 5177; do
    echo "Checking port $port..."
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "  Killing process $pid on port $port"
        kill -9 $pid 2>/dev/null || true
    fi
done

# Kill any remaining vite processes
pkill -f "vite" 2>/dev/null || true
pkill -f "pnpm.*dev" 2>/dev/null || true

echo "✅ All processes stopped"

# Wait for ports to be released
sleep 3

echo "🔍 Verifying ports are free..."
for port in 5173 5174 5175 5176; do
    if ! lsof -ti:$port >/dev/null 2>&1; then
        echo "  Port $port is now free ✅"
    else
        echo "  Port $port is still in use ⚠️"
    fi
done

echo "Ready to start a fresh development server!"
