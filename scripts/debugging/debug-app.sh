#!/bin/bash

# Debug GNC Application Loading
# =============================

echo "=== GNC SPACE SIM DEBUG ==="
echo ""

# Check if server is responding
echo "1. Testing server response..."
curl -s -I http://localhost:5177/ | head -5
echo ""

# Check if main files exist
echo "2. Checking main application files..."
if [ -f "/workspaces/gnc-space-sim/apps/web/src/main.tsx" ]; then
    echo "✅ main.tsx exists"
else
    echo "❌ main.tsx missing"
fi

if [ -f "/workspaces/gnc-space-sim/apps/web/src/App.tsx" ]; then
    echo "✅ App.tsx exists"
else
    echo "❌ App.tsx missing"
fi

if [ -f "/workspaces/gnc-space-sim/apps/web/index.html" ]; then
    echo "✅ index.html exists"
else
    echo "❌ index.html missing"
fi

# Check if dependencies are installed
echo ""
echo "3. Checking dependencies..."
if [ -d "/workspaces/gnc-space-sim/node_modules" ]; then
    echo "✅ Root node_modules exists"
else
    echo "❌ Root node_modules missing"
fi

if [ -d "/workspaces/gnc-space-sim/apps/web/node_modules" ]; then
    echo "✅ Web app node_modules exists"
else
    echo "❌ Web app node_modules missing"
fi

# Check TypeScript compilation
echo ""
echo "4. Quick TypeScript check..."
cd /workspaces/gnc-space-sim
pnpm typecheck 2>&1 | tail -5

echo ""
echo "5. Server process check..."
ps aux | grep -E "(vite|pnpm)" | grep -v grep

echo ""
echo "=== END DEBUG ==="
