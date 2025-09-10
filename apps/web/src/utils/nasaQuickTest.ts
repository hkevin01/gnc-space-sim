/**
 * Quick NASA API Integration Test
 * Simple test to verify the NASA integration is working
 */

import { NasaHorizonsApiService } from '../services/nasaHorizonsApi';

console.log('🚀 Testing NASA JPL Horizons API Integration...');
console.log('Current Date:', new Date().toISOString());

// Test a single planet position (Earth)
NasaHorizonsApiService.fetchPlanetPosition(
  'EARTH',
  new Date(),
  new Date(Date.now() + 24 * 60 * 60 * 1000)
).then(earthData => {
  if (earthData) {
    console.log('✅ Earth Position (NASA JPL):');
    console.log('  Position (km):', earthData.position.map(p => p.toExponential(2)));
    console.log('  Velocity (km/s):', earthData.velocity.map(v => v.toExponential(2)));
    console.log('  Julian Date:', earthData.julianDate);
    console.log('  Timestamp:', earthData.timestamp.toISOString());

    // Convert to scene coordinates
    const sceneCoords = NasaHorizonsApiService.nasaToSceneCoordinates(earthData.position, 20);
    console.log('  Scene Coordinates:', sceneCoords.map(c => c.toFixed(2)));
    console.log('  Distance from Sun (AU):',
      Math.sqrt(sceneCoords[0]**2 + sceneCoords[1]**2 + sceneCoords[2]**2).toFixed(3)
    );
  } else {
    console.log('❌ Failed to fetch Earth position');
  }
}).catch(error => {
  console.error('❌ Error testing NASA API:', error);
});

export {};
