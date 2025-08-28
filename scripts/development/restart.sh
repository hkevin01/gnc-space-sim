#!/bin/bash

# Restart the development server with new port configuration
echo "🔄 Restarting GNC Space Simulation with updated port configuration..."

# Stop existing containers
docker-compose down

# Start development environment
./scripts/docker-dev.sh dev:start

if [ $? -eq 0 ]; then
    echo "✅ GNC Space Simulation restarted successfully!"
    echo ""
    echo "🚀 Access the application at: http://localhost:5173"
    echo "📊 Monitor logs with: docker-compose logs -f"
    echo "🛑 Stop with: docker-compose down"
else
    echo "❌ Failed to restart GNC Space Simulation"
    exit 1
fi
