#!/bin/bash
# Quick cleanup and fix script

echo "=== PORT CLEANUP ==="
# Find processes on development ports
echo "Checking port 5173..."
PROC_5173=$(lsof -ti :5173 2>/dev/null)
if [ ! -z "$PROC_5173" ]; then
  echo "Killing process $PROC_5173 on port 5173"
  kill -9 $PROC_5173
fi

echo "Checking port 5174..."
PROC_5174=$(lsof -ti :5174 2>/dev/null)
if [ ! -z "$PROC_5174" ]; then
  echo "Killing process $PROC_5174 on port 5174"
  kill -9 $PROC_5174
fi

echo "Checking port 5175..."
PROC_5175=$(lsof -ti :5175 2>/dev/null)
if [ ! -z "$PROC_5175" ]; then
  echo "Killing process $PROC_5175 on port 5175"
  kill -9 $PROC_5175
fi

echo "Checking port 5176..."
PROC_5176=$(lsof -ti :5176 2>/dev/null)
if [ ! -z "$PROC_5176" ]; then
  echo "Killing process $PROC_5176 on port 5176"
  kill -9 $PROC_5176
fi

sleep 2

echo "=== FILE REPLACEMENT ==="
echo "Backing up corrupted guidance.ts..."
cp packages/gnc-core/src/launch/guidance.ts packages/gnc-core/src/launch/guidance-corrupted-backup.ts 2>/dev/null

echo "Replacing with clean version..."
cp guidance-replacement.ts packages/gnc-core/src/launch/guidance.ts

echo "=== VERIFICATION ==="
echo "Available ports:"
lsof -i :5173 2>/dev/null || echo "✅ Port 5173 available"
lsof -i :5174 2>/dev/null || echo "✅ Port 5174 available"
lsof -i :5175 2>/dev/null || echo "✅ Port 5175 available"
lsof -i :5176 2>/dev/null || echo "✅ Port 5176 available"

echo "✅ Cleanup complete!"
