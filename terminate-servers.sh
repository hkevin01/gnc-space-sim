#!/bin/bash

echo "Terminating all development servers..."

# Find and kill all pnpm dev processes
ps aux | grep "pnpm.*dev" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Find and kill all vite processes
ps aux | grep vite | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Kill processes on specific ports
for port in 5173 5174 5175 5176 5177; do
    fuser -k $port/tcp 2>/dev/null || true
done

echo "All processes terminated. Ports should now be free."
