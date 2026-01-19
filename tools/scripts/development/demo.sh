#!/bin/bash

# GNC Space Simulation - Visual Demo Script
# Demonstrates enhanced mission phase visuals

echo "🚀 GNC Space Simulation - Enhanced Mission Visuals Demo"
echo "========================================================"
echo ""
echo "This simulation features dynamic visual environments that change"
echo "based on mission phase and spacecraft altitude:"
echo ""
echo "📍 LAUNCH PHASES & VISUALS:"
echo "  • Pre-Launch     → Earth surface view with atmosphere"
echo "  • Liftoff        → Engine plume effects, trajectory start"
echo "  • Stage 1 Burn   → Dynamic engine visuals, ascending trajectory"
echo "  • Max Q          → Atmospheric pressure indicators"
echo "  • Stage 1 Sep    → Visual stage separation effects"
echo "  • Stage 2 Burn   → Second stage ignition and burns"
echo "  • Fairing Sep    → Payload fairing jettison animation"
echo "  • Orbital Insert → Orbit circularization with space view"
echo ""
echo "🌌 CELESTIAL BODIES (Altitude-Based):"
echo "  • Earth          → Always visible during launch (< 10,000 km)"
echo "  • Sun            → Appears after reaching space (> 500 km)"
echo "  • Moon           → Visible during orbital phases (> 1,000 km)"
echo "  • Mars           → Deep space/interplanetary phases"
echo "  • Asteroids      → High altitude encounters (> 2,000 km)"
echo ""
echo "🎯 ENHANCED FEATURES:"
echo "  • Phase-based trajectory colors"
echo "  • Real-time telemetry HUD with mission status"
echo "  • Engine plume and separation effects"
echo "  • Atmospheric layers and space environment"
echo "  • Starfield background with 1000+ stars"
echo ""
echo "Starting simulation..."
echo ""

# Check if we're in the right directory
if [ ! -f "run.sh" ]; then
    echo "❌ Please run this from the gnc-space-sim project root directory"
    exit 1
fi

# Start the simulation
./run.sh

echo ""
echo "🎮 SIMULATION CONTROLS:"
echo "  • Click 'INITIATE LAUNCH' to start the mission"
echo "  • Use mouse to rotate camera view"
echo "  • Scroll to zoom in/out"
echo "  • Watch the telemetry panel for real-time data"
echo "  • Observe how celestial bodies appear/disappear based on altitude"
echo ""
echo "💡 TIP: Watch for Mars to appear during orbital insertion phase!"
echo "💡 TIP: Asteroids become visible during high-altitude phases!"
