/**
 * NASA JPL Horizons API Service
 * Fetches real-time planetary ephemeris data from NASA JPL Horizons system
 * API Documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
 */

// NASA JPL Horizons API planetary body codes
export const NASA_BODY_CODES = {
  SUN: '10',      // Sun
  MERCURY: '199', // Mercury barycenter
  VENUS: '299',   // Venus barycenter
  EARTH: '399',   // Earth geocenter
  MOON: '301',    // Moon
  MARS: '499',    // Mars barycenter
  JUPITER: '599', // Jupiter barycenter
  SATURN: '699',  // Saturn barycenter
  URANUS: '799',  // Uranus barycenter
  NEPTUNE: '899', // Neptune barycenter
} as const;

export type PlanetName = keyof typeof NASA_BODY_CODES;

// Type definitions for NASA Horizons API response
export interface HorizonsEphemerisData {
  jd: number;           // Julian Date
  x: number;            // X position (km)
  y: number;            // Y position (km)
  z: number;            // Z position (km)
  vx: number;           // X velocity (km/s)
  vy: number;           // Y velocity (km/s)
  vz: number;           // Z velocity (km/s)
}

export interface HorizonsApiResponse {
  signature: {
    version: string;
    source: string;
  };
  result: string;
}

export interface ParsedEphemerisData {
  planet: PlanetName;
  position: [number, number, number]; // [x, y, z] in km
  velocity: [number, number, number]; // [vx, vy, vz] in km/s
  julianDate: number;
  timestamp: Date;
}

/**
 * NASA JPL Horizons API Service Class
 */
export class NasaHorizonsApiService {
  private static readonly DIRECT_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api';
  private static readonly BROWSER_PROXY_URL = '/api/horizons';
  private static readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
  private static cache = new Map<string, { data: ParsedEphemerisData[]; timestamp: number }>();
  private static browserProxyAvailable: boolean | null = null;
  private static hasWarnedBrowserFallback = false;

  /**
   * Get current planetary positions for all planets
   */
  static async getCurrentPlanetaryPositions(): Promise<ParsedEphemerisData[]> {
    const cacheKey = 'current_positions';
    const cached = this.cache.get(cacheKey);

    // Return cached data if it's still fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    if (this.isBrowserRuntime() && this.browserProxyAvailable === false) {
      return [];
    }

    try {
      const currentDate = new Date();
      const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Next day

      const planets = Object.keys(NASA_BODY_CODES) as PlanetName[];
      const positions: ParsedEphemerisData[] = [];

      // Fetch positions until the local proxy proves unavailable; in that case
      // the app quietly falls back to calculated ephemerides.
      for (const planet of planets) {
        const position = await this.fetchPlanetPosition(
          planet,
          currentDate,
          nextDate
        );

        if (position) {
          positions.push(position);
        }

        if (this.isBrowserRuntime() && this.browserProxyAvailable === false) {
          break;
        }
      }

      if (positions.length > 0) {
        this.cache.set(cacheKey, { data: positions, timestamp: Date.now() });
      }

      return positions;

    } catch (error) {
      throw new Error(`NASA Horizons API error: ${error}`);
    }
  }

  /**
   * Fetch position for a specific planet
   */
  static async fetchPlanetPosition(
    planet: PlanetName,
    startDate: Date,
    stopDate: Date
  ): Promise<ParsedEphemerisData | null> {
    try {
      const bodyCode = NASA_BODY_CODES[planet];
      const url = this.buildApiUrl(bodyCode, startDate, stopDate);

      const response = await fetch(url);

      if (!response.ok) {
        if (this.isBrowserRuntime() && (response.status === 404 || response.status === 502 || response.status === 503)) {
          this.markBrowserProxyUnavailable(`HTTP ${response.status}`)
          return null
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HorizonsApiResponse = await response.json();

      if (!data.result) {
        throw new Error('No result data in API response');
      }

      const ephemerisData = this.parseEphemerisResult(data.result, planet);

      if (!ephemerisData) {
        return null;
      }

      if (this.isBrowserRuntime()) {
        this.browserProxyAvailable = true
      }

      return ephemerisData;

    } catch (error) {
      if (this.isBrowserRuntime()) {
        this.markBrowserProxyUnavailable(error instanceof Error ? error.message : 'Unknown fetch error')
        return null
      }

      return null;
    }
  }

  /**
   * Build NASA Horizons API URL for vector ephemeris
   */
  private static buildApiUrl(bodyCode: string, startDate: Date, stopDate: Date): string {
    const params = new URLSearchParams({
      format: 'json',
      COMMAND: `'${bodyCode}'`,
      OBJ_DATA: 'YES',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'VECTORS',
      CENTER: '500@10', // Heliocentric (Sun center)
      START_TIME: this.formatDate(startDate),
      STOP_TIME: this.formatDate(stopDate),
      STEP_SIZE: '1d',
      VEC_TABLE: '2', // Position and velocity
      REF_PLANE: 'ECLIPTIC',
      REF_SYSTEM: 'ICRF',
      OUT_UNITS: 'KM-S',
      VEC_CORR: 'NONE',
      CSV_FORMAT: 'NO'
    });

    return `${this.getBaseUrl()}?${params.toString()}`;
  }

  private static getBaseUrl(): string {
    return this.isBrowserRuntime() ? this.BROWSER_PROXY_URL : this.DIRECT_URL
  }

  private static isBrowserRuntime(): boolean {
    return typeof window !== 'undefined'
  }

  private static markBrowserProxyUnavailable(reason: string): void {
    this.browserProxyAvailable = false

    if (!this.hasWarnedBrowserFallback) {
      this.hasWarnedBrowserFallback = true
      console.warn(`[NASA] Horizons proxy unavailable (${reason}). Using calculated planetary positions instead.`)
    }
  }

  /**
   * Format date for NASA Horizons API
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `'${year}-${month}-${day}'`;
  }

  /**
   * Parse ephemeris result from NASA API response
   */
  private static parseEphemerisResult(
    result: string,
    planet: PlanetName
  ): ParsedEphemerisData | null {
    try {
      // Find the data section between $$SOE and $$EOE markers
      const startMarker = '$$SOE';
      const endMarker = '$$EOE';

      const startIndex = result.indexOf(startMarker);
      const endIndex = result.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        console.error('Could not find data markers in NASA response');
        return null;
      }

      const dataSection = result.substring(startIndex + startMarker.length, endIndex).trim();
      const lines = dataSection.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        console.error('Insufficient data lines in NASA response');
        return null;
      }

      // Parse the first data line (current position)
      // Format: JDTDB = julian_date
      // X = x_pos Y = y_pos Z = z_pos
      // VX= vx VY= vy VZ= vz

      let currentLine = 0;
      let julianDate = 0;
      let x = 0, y = 0, z = 0;
      let vx = 0, vy = 0, vz = 0;

      // Parse Julian Date line
      const jdLine = lines[currentLine++];
      const jdMatch = jdLine.match(/(\d+\.\d+)/);
      if (jdMatch) {
        julianDate = parseFloat(jdMatch[1]);
      }

      // Parse position line
      const posLine = lines[currentLine++];
      const posMatch = posLine.match(/X\s*=\s*([-+]?\d+\.?\d*[eE]?[-+]?\d*)\s+Y\s*=\s*([-+]?\d+\.?\d*[eE]?[-+]?\d*)\s+Z\s*=\s*([-+]?\d+\.?\d*[eE]?[-+]?\d*)/);
      if (posMatch) {
        x = parseFloat(posMatch[1]);
        y = parseFloat(posMatch[2]);
        z = parseFloat(posMatch[3]);
      }

      // Parse velocity line
      if (currentLine < lines.length) {
        const velLine = lines[currentLine++];
        const velMatch = velLine.match(/VX\s*=\s*([-+]?\d+\.?\d*[eE]?[-+]?\d*)\s+VY\s*=\s*([-+]?\d+\.?\d*[eE]?[-+]?\d*)\s+VZ\s*=\s*([-+]?\d+\.?\d*[eE]?[-+]?\d*)/);
        if (velMatch) {
          vx = parseFloat(velMatch[1]);
          vy = parseFloat(velMatch[2]);
          vz = parseFloat(velMatch[3]);
        }
      }

      // Convert Julian Date to JavaScript Date
      const timestamp = this.julianDateToJavaScriptDate(julianDate);

      console.log(`📊 ${planet} ephemeris parsed: X=${x.toExponential(2)} Y=${y.toExponential(2)} Z=${z.toExponential(2)} km`);

      return {
        planet,
        position: [x, y, z],
        velocity: [vx, vy, vz],
        julianDate,
        timestamp
      };

    } catch (error) {
      console.error('Error parsing NASA ephemeris data:', error);
      return null;
    }
  }

  /**
   * Convert Julian Date to JavaScript Date
   */
  private static julianDateToJavaScriptDate(julianDate: number): Date {
    // Julian Date to Unix timestamp conversion
    const unixTimestamp = (julianDate - 2440587.5) * 86400000;
    return new Date(unixTimestamp);
  }

  /**
   * Convert km to AU (Astronomical Units) for solar system scale
   */
  static kmToAU(km: number): number {
    return km / 149597870.7; // 1 AU = 149,597,870.7 km
  }

  /**
   * Convert NASA coordinates to scene coordinates for Three.js
   * NASA uses heliocentric ecliptic coordinates, we need to scale and convert
   */
  static nasaToSceneCoordinates(
    nasaPosition: [number, number, number],
    scaleFactorAU = 1
  ): [number, number, number] {
    // Convert km to AU first
    const [xKm, yKm, zKm] = nasaPosition;
    const xAU = this.kmToAU(xKm);
    const yAU = this.kmToAU(yKm);
    const zAU = this.kmToAU(zKm);

    // Apply scene scale factor
    return [
      xAU * scaleFactorAU,
      yAU * scaleFactorAU,
      zAU * scaleFactorAU
    ];
  }

  /**
   * Clear cache (useful for testing or forcing fresh data)
   */
  static clearCache(): void {
    this.cache.clear();
    this.browserProxyAvailable = null;
    this.hasWarnedBrowserFallback = false;
  }

  /**
   * Get cache status
   */
  static getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default NasaHorizonsApiService;
