#!/bin/bash

echo "🛑 Stopping all running development servers..."

# Check what's running on these ports first
echo "📊 Current port usage:"
lsof -i :5173 2>/dev/null | head -3 || echo "Port 5173: Available"
lsof -i :5174 2>/dev/null | head -3 || echo "Port 5174: Available"
lsof -i :5175 2>/dev/null | head -3 || echo "Port 5175: Available"
lsof -i :5176 2>/dev/null | head -3 || echo "Port 5176: Available"

# Kill all processes using these ports
for port in 5173 5174 5175 5176; do
  echo "Killing processes on port $port..."
  lsof -ti :$port | xargs kill -9 2>/dev/null || echo "No processes on port $port"
done

# Kill any remaining Vite/dev processes
echo "Killing any remaining development processes..."
pkill -f "vite" 2>/dev/null
pkill -f "pnpm.*dev" 2>/dev/null
pkill -f "npm.*dev" 2>/dev/null

# Wait for cleanup
sleep 3

# Verify ports are free
echo "✅ Port verification:"
lsof -i :5173 2>/dev/null | head -3 || echo "Port 5173: ✅ Available"
lsof -i :5174 2>/dev/null | head -3 || echo "Port 5174: ✅ Available"
lsof -i :5175 2>/dev/null | head -3 || echo "Port 5175: ✅ Available"
lsof -i :5176 2>/dev/null | head -3 || echo "Port 5176: ✅ Available"

echo "🔧 Replacing corrupted guidance.ts with clean version..."
cp guidance-replacement.ts packages/gnc-core/src/launch/guidance.ts && echo "✅ guidance.ts replaced successfully"

echo "🚀 Ready to start clean development server!"
