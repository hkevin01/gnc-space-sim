/**
 * Planetary Position Service
 * Integrates NASA JPL Horizons real-time data with existing orbital mechanics
 * Provides fallback to calculated positions when NASA data is unavailable
 */

import { NasaHorizonsApiService, ParsedEphemerisData, PlanetName } from './nasaHorizonsApi';

export interface PlanetaryPositionConfig {
  useNasaData: boolean;
  fallbackToCalculated: boolean;
  scaleFactorAU: number;
  cacheTimeout: number; // milliseconds
}

export interface PlanetPosition {
  name: string;
  position: [number, number, number]; // Scene coordinates
  velocity?: [number, number, number]; // km/s
  dataSource: 'nasa' | 'calculated' | 'fallback';
  timestamp: Date;
  julianDate?: number;
}

/**
 * Default configuration for planetary position service
 */
const DEFAULT_CONFIG: PlanetaryPositionConfig = {
  useNasaData: true,
  fallbackToCalculated: true,
  scaleFactorAU: 1, // Scale factor: 1 scene unit = 1 million km (matches our new distance scale)
  cacheTimeout: 1000 * 60 * 60, // 1 hour
};

/**
 * Planetary Position Service Class
 */
export class PlanetaryPositionService {
  private static config: PlanetaryPositionConfig = DEFAULT_CONFIG;
  private static nasaDataCache: Map<string, ParsedEphemerisData[]> = new Map();
  private static lastFetchTime = 0;

  /**
   * Configure the service
   */
  static configure(config: Partial<PlanetaryPositionConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('🔧 Planetary Position Service configured:', this.config);
  }

  /**
   * Get current positions for all planets
   */
  static async getAllPlanetaryPositions(): Promise<PlanetPosition[]> {
    const positions: PlanetPosition[] = [];

    // Try to get NASA data if enabled
    let nasaData: ParsedEphemerisData[] = [];

    if (this.config.useNasaData) {
      try {
        nasaData = await this.getNasaData();
        console.log(`📡 Retrieved NASA data for ${nasaData.length} planets`);
      } catch (error) {
        console.error('❌ Failed to get NASA data:', error);
        if (!this.config.fallbackToCalculated) {
          throw error;
        }
      }
    }

    // Process each planet
    const planetNames: PlanetName[] = ['SUN', 'MERCURY', 'VENUS', 'EARTH', 'MOON', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE'];

    for (const planetName of planetNames) {
      try {
        const position = await this.getPlanetPosition(planetName, nasaData);
        positions.push(position);
      } catch (error) {
        console.error(`❌ Failed to get position for ${planetName}:`, error);

        // Add fallback position if enabled
        if (this.config.fallbackToCalculated) {
          positions.push({
            name: planetName,
            position: [0, 0, 0], // Will be replaced by calculated position
            dataSource: 'fallback',
            timestamp: new Date()
          });
        }
      }
    }

    console.log(`✅ Generated positions for ${positions.length} planets`);
    return positions;
  }

  /**
   * Get position for a specific planet
   */
  static async getPlanetPosition(
    planetName: PlanetName,
    nasaData?: ParsedEphemerisData[]
  ): Promise<PlanetPosition> {
    // Special case for Sun - always at origin
    if (planetName === 'SUN') {
      return {
        name: planetName,
        position: [0, 0, 0],
        dataSource: 'calculated',
        timestamp: new Date()
      };
    }

    // Try to find NASA data for this planet
    let nasaEntry: ParsedEphemerisData | undefined;

    if (nasaData) {
      nasaEntry = nasaData.find(entry => entry.planet === planetName);
    } else if (this.config.useNasaData) {
      try {
        const allNasaData = await this.getNasaData();
        nasaEntry = allNasaData.find(entry => entry.planet === planetName);
      } catch (error) {
        console.warn(`⚠️  Could not fetch NASA data for ${planetName}:`, error);
      }
    }

    // Use NASA data if available
    if (nasaEntry) {
      const scenePosition = NasaHorizonsApiService.nasaToSceneCoordinates(
        nasaEntry.position,
        this.config.scaleFactorAU
      );

      return {
        name: planetName,
        position: scenePosition,
        velocity: nasaEntry.velocity,
        dataSource: 'nasa',
        timestamp: nasaEntry.timestamp,
        julianDate: nasaEntry.julianDate
      };
    }

    // Fallback to calculated position if enabled
    if (this.config.fallbackToCalculated) {
      const calculatedPosition = this.getCalculatedPosition(planetName);
      return {
        name: planetName,
        position: calculatedPosition,
        dataSource: 'calculated',
        timestamp: new Date()
      };
    }

    // No fallback - throw error
    throw new Error(`No position data available for ${planetName}`);
  }

  /**
   * Get cached NASA data or fetch fresh data
   */
  private static async getNasaData(): Promise<ParsedEphemerisData[]> {
    const now = Date.now();
    const cacheKey = 'current_nasa_data';

    // Check if cache is still valid
    if (
      this.nasaDataCache.has(cacheKey) &&
      now - this.lastFetchTime < this.config.cacheTimeout
    ) {
      console.log('📋 Using cached NASA data');
      return this.nasaDataCache.get(cacheKey)!;
    }

    // Fetch fresh data
    console.log('🌍 Fetching fresh NASA planetary data...');
    const freshData = await NasaHorizonsApiService.getCurrentPlanetaryPositions();

    // Update cache
    this.nasaDataCache.set(cacheKey, freshData);
    this.lastFetchTime = now;

    return freshData;
  }

  /**
   * Calculate position using existing orbital mechanics (fallback)
   */
  private static getCalculatedPosition(planetName: PlanetName): [number, number, number] {
    console.log(`🧮 Using calculated position for ${planetName}`);

    if (planetName === 'SUN') return [0, 0, 0];

    // Use realistic orbital mechanics with current time for proper distribution
    const currentTime = Date.now() / 1000; // Current time in seconds
    const timeInDays = currentTime * 0.01; // Scale factor for visualization

    // Orbital parameters (simplified but realistic)
    const orbitalData: Record<PlanetName, { distance: number; period: number; inclination: number; initialPhase: number }> = {
      SUN: { distance: 0, period: 0, inclination: 0, initialPhase: 0 },
      MERCURY: { distance: 7.7, period: 88, inclination: 7.0, initialPhase: 0.5 },
      VENUS: { distance: 14.4, period: 225, inclination: 3.4, initialPhase: 1.8 },
      EARTH: { distance: 20, period: 365, inclination: 0.0, initialPhase: 0.0 },
      MOON: { distance: 2.57, period: 27, inclination: 5.1, initialPhase: 2.1 },
      MARS: { distance: 30.4, period: 687, inclination: 1.8, initialPhase: 3.8 },
      JUPITER: { distance: 104, period: 4333, inclination: 1.3, initialPhase: 2.3 },
      SATURN: { distance: 190, period: 10759, inclination: 2.5, initialPhase: 4.7 },
      URANUS: { distance: 384, period: 30687, inclination: 0.8, initialPhase: 1.2 },
      NEPTUNE: { distance: 600, period: 60190, inclination: 1.8, initialPhase: 5.5 },
    };

    const planetOrbit = orbitalData[planetName];
    if (!planetOrbit) return [0, 0, 0];

    // Special handling for Moon - it should orbit around Earth
    if (planetName === 'MOON') {
      // Get Earth's position first
      const earthPosition = this.getCalculatedPosition('EARTH');

      // Calculate Moon's orbital position relative to Earth
      const moonMeanAnomaly = ((2 * Math.PI * timeInDays) / planetOrbit.period) + planetOrbit.initialPhase;
      const moonTrueAnomaly = moonMeanAnomaly;

      // Moon's orbital inclination relative to Earth's orbit
      const moonInclinationRad = (planetOrbit.inclination * Math.PI) / 180;

      // Moon's position relative to Earth
      const moonX = Math.cos(moonTrueAnomaly) * planetOrbit.distance;
      const moonY = Math.sin(moonTrueAnomaly) * planetOrbit.distance * Math.sin(moonInclinationRad);
      const moonZ = Math.sin(moonTrueAnomaly) * planetOrbit.distance * Math.cos(moonInclinationRad);

      // Add Earth's position to get Moon's absolute position
      return [
        earthPosition[0] + moonX,
        earthPosition[1] + moonY,
        earthPosition[2] + moonZ
      ];
    }

    // Calculate orbital position using mean anomaly for other planets
    const meanAnomaly = ((2 * Math.PI * timeInDays) / planetOrbit.period) + planetOrbit.initialPhase;
    const trueAnomaly = meanAnomaly; // Simplified - in reality would account for eccentricity

    // Calculate 3D position with orbital inclination
    const inclinationRad = (planetOrbit.inclination * Math.PI) / 180;

    const x = Math.cos(trueAnomaly) * planetOrbit.distance;
    const y = Math.sin(trueAnomaly) * planetOrbit.distance * Math.sin(inclinationRad);
    const z = Math.sin(trueAnomaly) * planetOrbit.distance * Math.cos(inclinationRad);

    return [x, y, z];
  }  /**
   * Get service status and statistics
   */
  static getServiceStatus(): {
    config: PlanetaryPositionConfig;
    cacheStatus: {
      size: number;
      lastFetch: Date | null;
      nextRefresh: Date | null;
    };
    nasaServiceStatus: {
      size: number;
      keys: string[];
    };
  } {
    const nextRefresh = this.lastFetchTime
      ? new Date(this.lastFetchTime + this.config.cacheTimeout)
      : null;

    return {
      config: this.config,
      cacheStatus: {
        size: this.nasaDataCache.size,
        lastFetch: this.lastFetchTime ? new Date(this.lastFetchTime) : null,
        nextRefresh
      },
      nasaServiceStatus: NasaHorizonsApiService.getCacheStatus()
    };
  }

  /**
   * Clear all caches
   */
  static clearCaches(): void {
    this.nasaDataCache.clear();
    this.lastFetchTime = 0;
    NasaHorizonsApiService.clearCache();
    console.log('🗑️  All planetary position caches cleared');
  }

  /**
   * Force refresh of NASA data
   */
  static async forceRefresh(): Promise<ParsedEphemerisData[]> {
    this.clearCaches();
    return await this.getNasaData();
  }

  /**
   * Test NASA API connectivity
   */
  static async testNasaConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing NASA API connectivity...');
      const testData = await NasaHorizonsApiService.fetchPlanetPosition(
        'EARTH',
        new Date(),
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      const success = testData !== null;
      console.log(success ? '✅ NASA API test successful' : '❌ NASA API test failed');
      return success;
    } catch (error) {
      console.error('❌ NASA API test failed:', error);
      return false;
    }
  }
}

export default PlanetaryPositionService;
