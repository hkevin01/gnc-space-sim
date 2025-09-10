/**
 * React Hook for NASA Planetary Positions
 * Manages fetching and state for real-time planetary data from NASA JPL Horizons
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PlanetaryPositionService, { PlanetPosition, PlanetaryPositionConfig } from '../services/planetaryPositionService';

export interface UseNasaPositionsOptions {
  config?: Partial<PlanetaryPositionConfig>;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  enableTesting?: boolean;
}

export interface UseNasaPositionsReturn {
  // Data
  positions: PlanetPosition[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Status
  dataSource: 'nasa' | 'calculated' | 'mixed';
  nasaApiConnected: boolean | null;

  // Actions
  refresh: () => Promise<void>;
  clearCache: () => void;
  testConnection: () => Promise<boolean>;

  // Configuration
  updateConfig: (config: Partial<PlanetaryPositionConfig>) => void;
  getStatus: () => ReturnType<typeof PlanetaryPositionService.getServiceStatus>;
}

const DEFAULT_OPTIONS: Required<UseNasaPositionsOptions> = {
  config: {},
  autoRefresh: true,
  refreshInterval: 60 * 60 * 1000, // 1 hour
  enableTesting: false,
};

/**
 * React Hook for NASA Planetary Positions
 */
export function useNasaPositions(options: UseNasaPositionsOptions = {}): UseNasaPositionsReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [positions, setPositions] = useState<PlanetPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nasaApiConnected, setNasaApiConnected] = useState<boolean | null>(null);

  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Configure the service on mount
  useEffect(() => {
    if (opts.config) {
      PlanetaryPositionService.configure(opts.config);
    }
  }, [opts.config]);

  // Test NASA API connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🧪 Testing NASA API connection...');
      const connected = await PlanetaryPositionService.testNasaConnection();
      setNasaApiConnected(connected);
      return connected;
    } catch (err) {
      console.error('❌ NASA API connection test failed:', err);
      setNasaApiConnected(false);
      return false;
    }
  }, []);

  // Test NASA API connection on mount if testing is enabled
  useEffect(() => {
    if (opts.enableTesting) {
      testConnection();
    }
  }, [opts.enableTesting, testConnection]);

  // Fetch positions function
  const fetchPositions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Fetching planetary positions...');
      const newPositions = await PlanetaryPositionService.getAllPlanetaryPositions();

      if (isMountedRef.current) {
        setPositions(newPositions);
        setLastUpdate(new Date());
        console.log(`✅ Successfully loaded ${newPositions.length} planetary positions`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Failed to fetch planetary positions:', errorMessage);

      if (isMountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Set up auto-refresh
  useEffect(() => {
    if (opts.autoRefresh && opts.refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchPositions, opts.refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [opts.autoRefresh, opts.refreshInterval, fetchPositions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Clear cache
  const clearCache = useCallback((): void => {
    PlanetaryPositionService.clearCaches();
    console.log('🗑️  Planetary position caches cleared');
  }, []);

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    await fetchPositions();
  }, [fetchPositions]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<PlanetaryPositionConfig>): void => {
    PlanetaryPositionService.configure(newConfig);
    console.log('🔧 Planetary position service configuration updated');
  }, []);

  // Get service status
  const getStatus = useCallback(() => {
    return PlanetaryPositionService.getServiceStatus();
  }, []);

  // Determine overall data source
  const dataSource: 'nasa' | 'calculated' | 'mixed' = (() => {
    if (positions.length === 0) return 'calculated';

    const dataSources = new Set(positions.map(p => p.dataSource));

    if (dataSources.has('nasa') && dataSources.size === 1) return 'nasa';
    if (dataSources.has('calculated') && dataSources.size === 1) return 'calculated';
    return 'mixed';
  })();

  return {
    // Data
    positions,
    loading,
    error,
    lastUpdate,

    // Status
    dataSource,
    nasaApiConnected,

    // Actions
    refresh,
    clearCache,
    testConnection,

    // Configuration
    updateConfig,
    getStatus,
  };
}

export default useNasaPositions;
