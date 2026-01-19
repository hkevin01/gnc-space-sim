#!/bin/bash

# Stop all development server processes
echo "🛑 Stopping all development server processes..."

# Kill all Vite dev servers
pkill -f "vite" 2>/dev/null
pkill -f "dev" 2>/dev/null
pkill -f "5173" 2>/dev/null
pkill -f "5174" 2>/dev/null
pkill -f "5175" 2>/dev/null
pkill -f "5176" 2>/dev/null

# Kill pnpm dev processes
pkill -f "pnpm.*dev" 2>/dev/null
pkill -f "npm.*dev" 2>/dev/null

# Wait for processes to terminate
sleep 2

# Show remaining processes on these ports
echo "📊 Checking for remaining processes on ports 5173-5176..."
netstat -tlnp 2>/dev/null | grep ":517[3-6]" || echo "✅ All ports cleared"

# Replace corrupted guidance.ts with clean version
echo "🔧 Replacing corrupted guidance.ts file..."
cp /workspaces/gnc-space-sim/guidance-replacement.ts /workspaces/gnc-space-sim/packages/gnc-core/src/launch/guidance.ts

echo "✅ Cleanup complete! Development servers stopped and guidance.ts replaced."
