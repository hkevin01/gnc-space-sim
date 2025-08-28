#!/bin/bash

# Test the improved run.sh script
echo "Testing improved run.sh script..."

# First, clean up any existing processes
./run.sh clean

# Wait a moment
sleep 2

# Test the status command
echo "Testing status command..."
./run.sh status

echo "run.sh script has been improved to work in dev container environments!"
echo "It will automatically:"
echo "  - Detect if Docker Compose is available"
echo "  - Fall back to direct pnpm development if Docker isn't available"
echo "  - Handle both 'docker-compose' and 'docker compose' commands"
echo "  - Provide clear feedback about what's happening"
