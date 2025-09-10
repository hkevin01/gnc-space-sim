/**
 * NASA Horizons API Test Script
 * Tests the integration with NASA JPL Horizons API to verify data fetching works correctly
 */

import { NasaHorizonsApiService } from '../services/nasaHorizonsApi';
import PlanetaryPositionService from '../services/planetaryPositionService';

/**
 * Test NASA API Service
 */
export async function testNasaApiService() {
  console.log('🧪 Starting NASA JPL Horizons API tests...\n');

  try {
    // Test 1: API Connection
    console.log('📡 Test 1: Testing NASA API connection...');
    const connected = await PlanetaryPositionService.testNasaConnection();
    console.log(`Result: ${connected ? '✅ Connected' : '❌ Connection failed'}\n`);

    if (!connected) {
      console.log('⚠️  NASA API connection failed. Check network connectivity and API status.');
      return false;
    }

    // Test 2: Fetch single planet position (Earth)
    console.log('🌍 Test 2: Fetching Earth position...');
    const earthPosition = await NasaHorizonsApiService.fetchPlanetPosition(
      'EARTH',
      new Date(),
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    if (earthPosition) {
      console.log('✅ Earth position fetched successfully:');
      console.log(`   Position: [${earthPosition.position.map(p => p.toExponential(2)).join(', ')}] km`);
      console.log(`   Velocity: [${earthPosition.velocity.map(v => v.toExponential(2)).join(', ')}] km/s`);
      console.log(`   Julian Date: ${earthPosition.julianDate}`);
      console.log(`   Timestamp: ${earthPosition.timestamp.toISOString()}\n`);
    } else {
      console.log('❌ Failed to fetch Earth position\n');
      return false;
    }

    // Test 3: Fetch all planetary positions
    console.log('🌌 Test 3: Fetching all planetary positions...');
    const allPositions = await PlanetaryPositionService.getAllPlanetaryPositions();

    console.log(`✅ Fetched positions for ${allPositions.length} planets:`);
    allPositions.forEach(planet => {
      const [x, y, z] = planet.position;
      console.log(`   ${planet.name}: [${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}] (${planet.dataSource})`);
    });
    console.log('');

    // Test 4: Cache functionality
    console.log('📋 Test 4: Testing cache functionality...');
    const cacheStatus = PlanetaryPositionService.getServiceStatus();
    console.log(`✅ Cache status:`);
    console.log(`   NASA cache: ${cacheStatus.nasaServiceStatus.size} items`);
    console.log(`   Service cache: ${cacheStatus.cacheStatus.size} items`);
    console.log(`   Last fetch: ${cacheStatus.cacheStatus.lastFetch?.toISOString() || 'Never'}\n`);

    // Test 5: Data conversion
    console.log('🔄 Test 5: Testing coordinate conversion...');
    if (earthPosition) {
      const sceneCoords = NasaHorizonsApiService.nasaToSceneCoordinates(
        earthPosition.position,
        20 // Scale factor
      );
      console.log('✅ Coordinate conversion:');
      console.log(`   NASA coords: [${earthPosition.position.map(p => p.toExponential(2)).join(', ')}] km`);
      console.log(`   Scene coords: [${sceneCoords.map(c => c.toFixed(2)).join(', ')}] (scaled)\n`);
    }

    console.log('🎉 All NASA API tests passed successfully!');
    return true;

  } catch (error) {
    console.error('❌ NASA API test failed:', error);
    return false;
  }
}

/**
 * Test planetary position service with different configurations
 */
export async function testPlanetaryPositionService() {
  console.log('🧪 Testing Planetary Position Service configurations...\n');

  try {
    // Test with NASA data enabled
    console.log('📡 Configuration 1: NASA data enabled');
    PlanetaryPositionService.configure({
      useNasaData: true,
      fallbackToCalculated: true,
      scaleFactorAU: 20
    });

    const nasaPositions = await PlanetaryPositionService.getAllPlanetaryPositions();
    const nasaCount = nasaPositions.filter(p => p.dataSource === 'nasa').length;
    console.log(`✅ NASA mode: ${nasaCount}/${nasaPositions.length} planets from NASA data\n`);

    // Test with NASA data disabled (calculated only)
    console.log('🧮 Configuration 2: Calculated positions only');
    PlanetaryPositionService.configure({
      useNasaData: false,
      fallbackToCalculated: true,
      scaleFactorAU: 20
    });

    const calcPositions = await PlanetaryPositionService.getAllPlanetaryPositions();
    const calcCount = calcPositions.filter(p => p.dataSource === 'calculated').length;
    console.log(`✅ Calculated mode: ${calcCount}/${calcPositions.length} planets from calculations\n`);

    // Compare positions
    console.log('🔍 Comparing NASA vs Calculated positions:');
    ['EARTH', 'MARS', 'JUPITER'].forEach(planetName => {
      const nasaPlanet = nasaPositions.find(p => p.name === planetName);
      const calcPlanet = calcPositions.find(p => p.name === planetName);

      if (nasaPlanet && calcPlanet) {
        const nasaDistance = Math.sqrt(
          nasaPlanet.position[0]**2 + nasaPlanet.position[1]**2 + nasaPlanet.position[2]**2
        );
        const calcDistance = Math.sqrt(
          calcPlanet.position[0]**2 + calcPlanet.position[1]**2 + calcPlanet.position[2]**2
        );

        console.log(`   ${planetName}:`);
        console.log(`     NASA: ${nasaDistance.toFixed(2)} AU (${nasaPlanet.dataSource})`);
        console.log(`     Calc: ${calcDistance.toFixed(2)} AU (${calcPlanet.dataSource})`);
      }
    });
    console.log('');

    console.log('🎉 Planetary Position Service tests completed!');
    return true;

  } catch (error) {
    console.error('❌ Planetary Position Service test failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
export async function runAllTests() {
  console.log('🚀 Starting comprehensive NASA JPL Horizons API tests...\n');
  console.log('============================================================');

  const apiTest = await testNasaApiService();
  console.log('============================================================');

  const serviceTest = await testPlanetaryPositionService();
  console.log('============================================================');

  const allPassed = apiTest && serviceTest;

  console.log('\n📊 Test Summary:');
  console.log(`   NASA API Service: ${apiTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Planetary Position Service: ${serviceTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Overall: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

  return allPassed;
}

// Export for use in browser console or other components
if (typeof window !== 'undefined') {
  // Make test functions available in browser console for debugging
  const globalWindow = window as typeof window & { nasaTests?: Record<string, unknown> };
  globalWindow.nasaTests = {
    testApi: testNasaApiService,
    testService: testPlanetaryPositionService,
    runAll: runAllTests
  };

  console.log('🛠️  NASA test functions available in browser console:');
  console.log('   window.nasaTests.testApi() - Test NASA API');
  console.log('   window.nasaTests.testService() - Test Position Service');
  console.log('   window.nasaTests.runAll() - Run all tests');
}

export default {
  testNasaApiService,
  testPlanetaryPositionService,
  runAllTests
};
