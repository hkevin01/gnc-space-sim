#!/bin/bash

echo "🛑 Stopping development servers and fixing guidance.ts..."

# Kill all processes using development ports
echo "Stopping processes on ports 5173-5176..."
for port in 5173 5174 5175 5176; do
  pids=$(lsof -ti :$port 2>/dev/null)
  if [ ! -z "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    echo $pids | xargs kill -9 2>/dev/null
  else
    echo "Port $port is available"
  fi
done

# Kill any remaining development processes
echo "Killing any remaining development processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "pnpm.*dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Wait for processes to fully terminate
sleep 3

# Backup corrupted file and replace with clean version
echo "🔧 Replacing corrupted guidance.ts with clean version..."
if [ -f "packages/gnc-core/src/launch/guidance.ts" ]; then
  cp packages/gnc-core/src/launch/guidance.ts packages/gnc-core/src/launch/guidance-corrupted-$(date +%s).ts
  echo "✅ Backed up corrupted guidance.ts"
fi

cp packages/gnc-core/src/launch/guidance-clean-complete.ts packages/gnc-core/src/launch/guidance.ts
echo "✅ Replaced guidance.ts with clean version"

# Verify ports are available
echo "📊 Port verification:"
for port in 5173 5174 5175 5176; do
  if lsof -i :$port 2>/dev/null >/dev/null; then
    echo "❌ Port $port still in use"
  else
    echo "✅ Port $port available"
  fi
done

echo "🚀 Ready to start clean development server!"
