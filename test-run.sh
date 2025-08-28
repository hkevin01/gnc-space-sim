#!/bin/bash

echo "=== Testing Updated GNC Run Script ==="
echo ""

cd /workspaces/gnc-space-sim

# Make scripts executable
chmod +x run.sh start-gnc.sh find-server.sh

echo "1. Testing status command..."
./run.sh status

echo ""
echo "2. Testing restart capability..."
echo "   Current process status:"
ps aux | grep -E "(vite|pnpm)" | grep -v grep | head -3

echo ""
echo "=== Ready to test restart ==="
echo "Now you can run:"
echo "  ./run.sh          # Should restart if something is running"
echo "  ./run.sh restart  # Force restart"
echo "  ./start-gnc.sh    # Quick start with cleanup"
echo ""
