#!/bin/bash

echo "🧪 Testing GNC Space Simulation Application..."
echo

# Check if the dev server is running
if curl -s http://localhost:5176 > /dev/null; then
    echo "✅ Development server is responding on http://localhost:5176"
else
    echo "❌ Development server is not responding"
    exit 1
fi

# Check if the main application loads (look for React root)
if curl -s http://localhost:5176 | grep -q "root"; then
    echo "✅ Application HTML is loading correctly"
else
    echo "❌ Application HTML is not loading correctly"
    exit 1
fi

echo
echo "🚀 GNC Space Simulation is ready!"
echo "📍 Access: http://localhost:5176"
echo "🌙 SLS Demo: Click 'SLS Artemis' mode in the interface"
echo
echo "Your development environment is now fully operational!"
