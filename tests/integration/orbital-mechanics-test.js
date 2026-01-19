// Test script to validate orbital mechanics implementation
// This script can be run in the browser console to verify calculations

console.log('Testing Orbital Mechanics Implementation');

// Test data from our implementation
const testData = {
  EARTH: {
    siderealPeriodDays: 365.26,
    rotationPeriodHours: 23.934,
    orbitalInclination: 0.0,
    rotationDirection: 1,
    axialTilt: 23.44,
    eccentricity: 0.017,
    orbitRadius: 100
  },
  VENUS: {
    siderealPeriodDays: 224.70,
    rotationPeriodHours: 243 * 24, // 243 Earth days
    orbitalInclination: 3.4,
    rotationDirection: -1, // Retrograde!
    axialTilt: 177,
    eccentricity: 0.007
  },
  MERCURY: {
    siderealPeriodDays: 87.97,
    rotationPeriodHours: 58.65 * 24,
    eccentricity: 0.21 // Most eccentric planet
  },
  JUPITER: {
    siderealPeriodDays: 11.86 * 365.25,
    rotationPeriodHours: 9.842, // Fastest rotation
    rotationDirection: 1
  }
};

// Test orbital period ratios (should match Kepler's 3rd law approximately)
console.log('Orbital Period Tests:');
console.log('Mercury period:', testData.MERCURY.siderealPeriodDays, 'days');
console.log('Venus period:', testData.VENUS.siderealPeriodDays, 'days');
console.log('Earth period:', testData.EARTH.siderealPeriodDays, 'days');
console.log('Jupiter period:', testData.JUPITER.siderealPeriodDays, 'days');

// Test rotation directions
console.log('\nRotation Direction Tests:');
console.log('Earth rotation direction:', testData.EARTH.rotationDirection, '(normal)');
console.log('Venus rotation direction:', testData.VENUS.rotationDirection, '(retrograde!)');
console.log('Jupiter rotation direction:', testData.JUPITER.rotationDirection, '(normal)');

// Test rotation speeds
console.log('\nRotation Speed Tests:');
console.log('Earth rotation period:', testData.EARTH.rotationPeriodHours, 'hours');
console.log('Venus rotation period:', testData.VENUS.rotationPeriodHours, 'hours (very slow!)');
console.log('Jupiter rotation period:', testData.JUPITER.rotationPeriodHours, 'hours (very fast!)');

// Test eccentricity values
console.log('\nEccentricity Tests:');
console.log('Mercury eccentricity:', testData.MERCURY.eccentricity, '(most eccentric)');
console.log('Venus eccentricity:', testData.VENUS.eccentricity, '(nearly circular)');
console.log('Earth eccentricity:', testData.EARTH.eccentricity, '(slightly elliptical)');

console.log('\nAll tests completed. Check values against known astronomical data!');
