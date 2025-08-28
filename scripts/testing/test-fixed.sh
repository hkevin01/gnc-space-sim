#!/bin/bash

# Test the fixed run.sh script
echo "=== Testing Fixed GNC Run Script ==="
echo ""

cd /workspaces/gnc-space-sim

# Make executable
chmod +x run.sh

echo "1. Testing status command (should not try Docker)..."
./run.sh status

echo ""
echo "2. Testing stop command (should not try Docker)..."
./run.sh stop

echo ""
echo "3. Now testing the ALLOW_NON_DOCKER bypass..."
export ALLOW_NON_DOCKER=1
echo "ALLOW_NON_DOCKER=1 ./run.sh"
echo "This should start without Docker errors..."
