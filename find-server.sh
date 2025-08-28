#!/bin/bash

# Find the current GNC development server port
# ============================================

echo "🔍 Finding GNC Space Simulation server..."
echo ""

# Check common ports
for port in 5173 5174 5175 5176 5177; do
    if curl -s http://localhost:$port/ >/dev/null 2>&1; then
        echo "✅ Found server running on port $port"
        echo "🚀 Open: http://localhost:$port/"
        echo ""

        # Test if it's actually serving HTML
        response=$(curl -s http://localhost:$port/ | head -1)
        if [[ $response == *"<!doctype html"* ]]; then
            echo "✅ Server is responding with HTML content"
        else
            echo "⚠️  Server responding but content may not be ready"
        fi

        exit 0
    fi
done

echo "❌ No development server found on common ports"
echo ""
echo "To start the server:"
echo "  cd /workspaces/gnc-space-sim"
echo "  pnpm dev"
echo ""
echo "Or use the fresh start script:"
echo "  chmod +x fresh-start.sh && ./fresh-start.sh"
