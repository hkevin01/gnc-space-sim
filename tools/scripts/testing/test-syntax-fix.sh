#!/bin/bash

echo "Testing run.sh syntax after fix..."

# Test syntax
if bash -n /workspaces/gnc-space-sim/run.sh; then
    echo "✅ Syntax is now correct!"
    echo ""
    echo "Now testing the start script..."
    cd /workspaces/gnc-space-sim
    chmod +x run.sh start-gnc.sh
    echo "Scripts are now executable"
    echo ""
    echo "You can now run:"
    echo "  ./start-gnc.sh"
    echo "  ALLOW_NON_DOCKER=1 ./run.sh"
else
    echo "❌ Still has syntax errors"
fi
