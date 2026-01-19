#!/bin/bash

# GNC Space Simulation - Status Check
# ===================================

cd /workspaces/gnc-space-sim

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}[GNC-SIM STATUS]${NC} Checking current state..."
echo ""

# Check if Vite development server is running
if pgrep -f "vite.*dev" > /dev/null; then
    echo -e "${GREEN}✅ Development server is RUNNING${NC}"

    # Find the port
    NETSTAT_OUTPUT=$(netstat -tulpn 2>/dev/null | grep :517 | head -1)
    if echo "$NETSTAT_OUTPUT" | grep -q ":5177"; then
        PORT="5177"
    elif echo "$NETSTAT_OUTPUT" | grep -q ":5176"; then
        PORT="5176"
    elif echo "$NETSTAT_OUTPUT" | grep -q ":5175"; then
        PORT="5175"
    elif echo "$NETSTAT_OUTPUT" | grep -q ":5174"; then
        PORT="5174"
    elif echo "$NETSTAT_OUTPUT" | grep -q ":5173"; then
        PORT="5173"
    else
        PORT="Unknown"
    fi

    echo "   🌐 URL: http://localhost:$PORT/"
    echo "   🚀 Ready for space simulation!"
    echo ""
    echo -e "${YELLOW}🌙 Try these features:${NC}"
    echo "   • SLS Artemis Mission Demo"
    echo "   • Orbital Mechanics Simulation"
    echo "   • Trajectory Planning"
    echo ""
    echo "🛑 To stop: pkill -f vite"

else
    echo -e "${YELLOW}⚠️  Development server is NOT running${NC}"
    echo ""
    echo "To start:"
    echo "  ./quick-start.sh"
    echo "  or"
    echo "  ALLOW_NON_DOCKER=1 ./run.sh"
fi

echo ""
echo "📂 Project structure:"
echo "   apps/web/     - React frontend"
echo "   packages/     - Core GNC libraries"
echo "   docs/         - Documentation"
