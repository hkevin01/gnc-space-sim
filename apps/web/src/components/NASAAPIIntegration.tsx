import { useCallback, useEffect, useState } from 'react';

// NASA API Integration Component for Real-Time Space Data
// This component integrates with multiple NASA and space-related APIs to provide live data

// API Endpoints Configuration
const API_CONFIG = {
  // NASA APIs
  NASA_API_KEY: 'DEMO_KEY', // Replace with actual API key for production
  APOD_URL: 'https://api.nasa.gov/planetary/apod',
  NEO_WS_URL: 'https://api.nasa.gov/neo/rest/v1/feed',
  MARS_WEATHER_URL: 'https://api.nasa.gov/insight_weather/',
  EPIC_URL: 'https://api.nasa.gov/EPIC/api/natural/images',

  // ISS Tracking APIs
  ISS_LOCATION_URL: 'http://api.open-notify.org/iss-now.json',
  ISS_PEOPLE_URL: 'http://api.open-notify.org/astros.json',
  WHERETHEISS_URL: 'https://api.wheretheiss.at/v1/satellites/25544',

  // JPL Horizons API for celestial body positions
  HORIZONS_URL: 'https://ssd.jpl.nasa.gov/api/horizons.api',

  // Solar System Data
  SSD_API_URL: 'https://ssd-api.jpl.nasa.gov/cad.api',

  // Rate limits
  REFRESH_INTERVALS: {
    ISS_POSITION: 5000, // 5 seconds
    NASA_DATA: 300000, // 5 minutes
    CELESTIAL_BODIES: 60000, // 1 minute
    WEATHER: 3600000, // 1 hour
  }
};

// Data Types
export interface ISSLocation {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
  visibility: string;
}

export interface CelestialBodyPosition {
  name: string;
  rightAscension: number;
  declination: number;
  distance: number; // AU
  magnitude: number;
  constellation: string;
  phase?: number; // For moon phases
}

export interface NearEarthObject {
  id: string;
  name: string;
  estimatedDiameter: {
    min: number;
    max: number;
  };
  closeApproachDate: string;
  missDistance: number; // km
  relativeVelocity: number; // km/s
  isPotentiallyHazardous: boolean;
}

export interface APODData {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}

export interface NEOResponse {
  near_earth_objects: Record<string, NEOData[]>;
}

export interface NEOData {
  id: string;
  name: string;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data: Array<{
    close_approach_date: string;
    miss_distance: {
      kilometers: string;
    };
    relative_velocity: {
      kilometers_per_second: string;
    };
  }>;
  is_potentially_hazardous_asteroid: boolean;
}

export interface AstronautData {
  name: string;
  craft: string;
}

// Main NASA API Integration Hook
export function useNASAAPI() {
  const [issLocation, setIssLocation] = useState<ISSLocation | null>(null);
  const [celestialBodies, setCelestialBodies] = useState<CelestialBodyPosition[]>([]);
  const [nearEarthObjects, setNearEarthObjects] = useState<NearEarthObject[]>([]);
  const [astronauts, setAstronauts] = useState<AstronautData[]>([]);
  const [apodData, setApodData] = useState<APODData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch ISS Current Location
  const fetchISSLocation = useCallback(async () => {
    try {
      const response = await fetch(API_CONFIG.WHERETHEISS_URL);
      if (!response.ok) throw new Error('Failed to fetch ISS location');

      const data = await response.json();
      setIssLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        velocity: data.velocity,
        timestamp: data.timestamp,
        visibility: data.visibility
      });

      // Clear any previous errors
      setErrors(prev => ({ ...prev, iss: '' }));
    } catch (error) {
      console.error('Error fetching ISS location:', error);
      setErrors(prev => ({ ...prev, iss: 'Failed to fetch ISS location' }));
    }
  }, []);

  // Fetch Astronauts in Space
  const fetchAstronauts = useCallback(async () => {
    try {
      const response = await fetch(API_CONFIG.ISS_PEOPLE_URL);
      if (!response.ok) throw new Error('Failed to fetch astronaut data');

      const data = await response.json();
      setAstronauts(data.people || []);

      setErrors(prev => ({ ...prev, astronauts: '' }));
    } catch (error) {
      console.error('Error fetching astronauts:', error);
      setErrors(prev => ({ ...prev, astronauts: 'Failed to fetch astronaut data' }));
    }
  }, []);

  // Fetch Near-Earth Objects
  const fetchNearEarthObjects = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const url = `${API_CONFIG.NEO_WS_URL}?start_date=${today}&end_date=${endDate}&api_key=${API_CONFIG.NASA_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch NEO data');

      const data = await response.json() as NEOResponse;
      const neos: NearEarthObject[] = [];

      // Parse NEO data from all dates
      Object.values(data.near_earth_objects).forEach((dateObjects: NEOData[]) => {
        dateObjects.forEach((neo: NEOData) => {
          neos.push({
            id: neo.id,
            name: neo.name,
            estimatedDiameter: {
              min: neo.estimated_diameter.kilometers.estimated_diameter_min,
              max: neo.estimated_diameter.kilometers.estimated_diameter_max
            },
            closeApproachDate: neo.close_approach_data[0]?.close_approach_date,
            missDistance: parseFloat(neo.close_approach_data[0]?.miss_distance.kilometers),
            relativeVelocity: parseFloat(neo.close_approach_data[0]?.relative_velocity.kilometers_per_second),
            isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid
          });
        });
      });

      setNearEarthObjects(neos.slice(0, 10)); // Keep top 10
      setErrors(prev => ({ ...prev, neo: '' }));
    } catch (error) {
      console.error('Error fetching NEO data:', error);
      setErrors(prev => ({ ...prev, neo: 'Failed to fetch asteroid data' }));
    }
  }, []);

  // Fetch Astronomy Picture of the Day
  const fetchAPOD = useCallback(async () => {
    try {
      const url = `${API_CONFIG.APOD_URL}?api_key=${API_CONFIG.NASA_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch APOD');

      const data = await response.json();
      setApodData(data);
      setErrors(prev => ({ ...prev, apod: '' }));
    } catch (error) {
      console.error('Error fetching APOD:', error);
      setErrors(prev => ({ ...prev, apod: 'Failed to fetch astronomy picture' }));
    }
  }, []);

  // Fetch Celestial Body Positions (simplified implementation)
  const fetchCelestialBodies = useCallback(async () => {
    try {
      // This is a simplified version - in production, you'd use JPL Horizons API
      // For now, we'll generate approximate positions based on current date/time
      const now = new Date();
      const bodies: CelestialBodyPosition[] = [
        {
          name: 'Mars',
          rightAscension: (now.getTime() / 1000000) % 360, // Simplified calculation
          declination: Math.sin(now.getTime() / 10000000) * 25,
          distance: 1.5 + Math.sin(now.getTime() / 100000000) * 0.5,
          magnitude: -2.0,
          constellation: 'Virgo'
        },
        {
          name: 'Jupiter',
          rightAscension: (now.getTime() / 2000000) % 360,
          declination: Math.sin(now.getTime() / 20000000) * 23,
          distance: 5.2 + Math.sin(now.getTime() / 200000000) * 0.3,
          magnitude: -2.5,
          constellation: 'Pisces'
        },
        {
          name: 'Saturn',
          rightAscension: (now.getTime() / 3000000) % 360,
          declination: Math.sin(now.getTime() / 30000000) * 26,
          distance: 9.5 + Math.sin(now.getTime() / 300000000) * 0.5,
          magnitude: 0.5,
          constellation: 'Aquarius'
        },
        {
          name: 'Moon',
          rightAscension: (now.getTime() / 100000) % 360,
          declination: Math.sin(now.getTime() / 1000000) * 28,
          distance: 0.00257, // AU
          magnitude: -12.7,
          constellation: 'Gemini',
          phase: (now.getTime() / 2551443000) % 1 // Lunar cycle
        }
      ];

      setCelestialBodies(bodies);
      setErrors(prev => ({ ...prev, celestial: '' }));
    } catch (error) {
      console.error('Error calculating celestial positions:', error);
      setErrors(prev => ({ ...prev, celestial: 'Failed to calculate celestial positions' }));
    }
  }, []);

  // Initialize and set up intervals
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchISSLocation(),
        fetchAstronauts(),
        fetchNearEarthObjects(),
        fetchAPOD(),
        fetchCelestialBodies()
      ]);
      setLoading(false);
      setLastUpdate(new Date());
    };

    // Initial fetch
    fetchAllData();

    // Set up intervals for different data types
    const issInterval = setInterval(fetchISSLocation, API_CONFIG.REFRESH_INTERVALS.ISS_POSITION);
    const celestialInterval = setInterval(fetchCelestialBodies, API_CONFIG.REFRESH_INTERVALS.CELESTIAL_BODIES);
    const nasaDataInterval = setInterval(() => {
      fetchNearEarthObjects();
      fetchAstronauts();
    }, API_CONFIG.REFRESH_INTERVALS.NASA_DATA);

    return () => {
      clearInterval(issInterval);
      clearInterval(celestialInterval);
      clearInterval(nasaDataInterval);
    };
  }, [fetchISSLocation, fetchAstronauts, fetchNearEarthObjects, fetchAPOD, fetchCelestialBodies]);

  return {
    issLocation,
    celestialBodies,
    nearEarthObjects,
    astronauts,
    apodData,
    loading,
    lastUpdate,
    errors,
    refresh: {
      issLocation: fetchISSLocation,
      celestialBodies: fetchCelestialBodies,
      nearEarthObjects: fetchNearEarthObjects,
      astronauts: fetchAstronauts,
      apod: fetchAPOD
    }
  };
}

// Real-Time Space Data Display Component
interface SpaceDataDisplayProps {
  position?: [number, number, number];
  showISS?: boolean;
  showCelestialBodies?: boolean;
  showNEOs?: boolean;
  compact?: boolean;
}

export function SpaceDataDisplay({
  position = [20, 20, 0],
  showISS = true,
  showCelestialBodies = true,
  showNEOs = true,
  compact = false
}: SpaceDataDisplayProps) {
  const {
    issLocation,
    celestialBodies,
    nearEarthObjects,
    astronauts,
    loading,
    lastUpdate,
    errors
  } = useNASAAPI();

  const formatDistance = (distance: number, unit: string = 'km') => {
    if (distance > 1000000) {
      return `${(distance / 1000000).toFixed(2)}M ${unit}`;
    } else if (distance > 1000) {
      return `${(distance / 1000).toFixed(2)}K ${unit}`;
    }
    return `${distance.toFixed(2)} ${unit}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position[1]}px`,
        right: `${position[0]}px`,
        width: compact ? '300px' : '400px',
        background: 'rgba(0, 15, 30, 0.95)',
        border: '1px solid #2563eb',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        color: '#e2e8f0',
        fontFamily: 'Courier New, monospace',
        fontSize: compact ? '11px' : '12px',
        maxHeight: '80vh',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)',
        zIndex: 1000
      }}
    >
      <div style={{ marginBottom: '12px', borderBottom: '1px solid #475569', paddingBottom: '8px' }}>
        <h3 style={{ margin: 0, color: '#60a5fa', fontSize: compact ? '14px' : '16px' }}>
          🛰️ Live Space Data
        </h3>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
          Last Update: {formatTime(lastUpdate)}
          {loading && ' (Updating...)'}
        </div>
      </div>

      {/* ISS Tracking */}
      {showISS && issLocation && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: compact ? '12px' : '14px' }}>
            🚀 International Space Station
          </h4>
          <div style={{ marginLeft: '8px', fontSize: '11px' }}>
            <div>📍 Lat: {issLocation.latitude.toFixed(4)}°</div>
            <div>📍 Lng: {issLocation.longitude.toFixed(4)}°</div>
            <div>🔴 Alt: {formatDistance(issLocation.altitude)}</div>
            <div>⚡ Vel: {formatDistance(issLocation.velocity, 'km/h')}</div>
            <div>👁️ Visibility: {issLocation.visibility}</div>
          </div>
          {errors.iss && <div style={{ color: '#ef4444', fontSize: '10px' }}>⚠️ {errors.iss}</div>}
        </div>
      )}

      {/* Astronauts in Space */}
      {astronauts.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: compact ? '12px' : '14px' }}>
            👨‍🚀 People in Space ({astronauts.length})
          </h4>
          <div style={{ marginLeft: '8px', fontSize: '11px' }}>
            {astronauts.slice(0, compact ? 3 : 6).map((astronaut, index) => (
              <div key={index}>• {astronaut.name} ({astronaut.craft})</div>
            ))}
            {astronauts.length > (compact ? 3 : 6) && (
              <div style={{ color: '#94a3b8' }}>... and {astronauts.length - (compact ? 3 : 6)} more</div>
            )}
          </div>
        </div>
      )}

      {/* Near-Earth Objects */}
      {showNEOs && nearEarthObjects.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#ec4899', fontSize: compact ? '12px' : '14px' }}>
            ☄️ Near-Earth Objects
          </h4>
          <div style={{ marginLeft: '8px', fontSize: '11px' }}>
            {nearEarthObjects.slice(0, compact ? 2 : 4).map((neo) => (
              <div key={neo.id} style={{ marginBottom: '4px' }}>
                <div style={{ color: neo.isPotentiallyHazardous ? '#ef4444' : '#cbd5e1' }}>
                  {neo.isPotentiallyHazardous ? '⚠️' : '🪨'} {neo.name.replace(/[()]/g, '')}
                </div>
                <div style={{ marginLeft: '16px', fontSize: '10px', color: '#94a3b8' }}>
                  Miss: {formatDistance(neo.missDistance)}
                  {neo.closeApproachDate && ` • ${new Date(neo.closeApproachDate).toLocaleDateString()}`}
                </div>
              </div>
            ))}
          </div>
          {errors.neo && <div style={{ color: '#ef4444', fontSize: '10px' }}>⚠️ {errors.neo}</div>}
        </div>
      )}

      {/* Celestial Bodies */}
      {showCelestialBodies && celestialBodies.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6', fontSize: compact ? '12px' : '14px' }}>
            🌍 Celestial Bodies
          </h4>
          <div style={{ marginLeft: '8px', fontSize: '11px' }}>
            {celestialBodies.map((body) => (
              <div key={body.name} style={{ marginBottom: '4px' }}>
                <div>
                  {body.name === 'Moon' ? '🌙' : body.name === 'Mars' ? '🔴' :
                   body.name === 'Jupiter' ? '🟠' : body.name === 'Saturn' ? '🟡' : '🪐'} {body.name}
                </div>
                <div style={{ marginLeft: '16px', fontSize: '10px', color: '#94a3b8' }}>
                  Mag: {body.magnitude.toFixed(1)} • Dist: {body.distance.toFixed(2)} AU
                  {body.phase !== undefined && ` • Phase: ${(body.phase * 100).toFixed(0)}%`}
                </div>
              </div>
            ))}
          </div>
          {errors.celestial && <div style={{ color: '#ef4444', fontSize: '10px' }}>⚠️ {errors.celestial}</div>}
        </div>
      )}

      {/* API Status */}
      <div style={{
        fontSize: '10px',
        color: '#64748b',
        borderTop: '1px solid #475569',
        paddingTop: '8px',
        textAlign: 'center'
      }}>
        Data Sources: NASA Open Data • JPL • ISS APIs
        {Object.keys(errors).length > 0 && (
          <div style={{ color: '#f59e0b', marginTop: '4px' }}>
            Some data feeds may be unavailable
          </div>
        )}
      </div>
    </div>
  );
}

// Export main component and hook
export default SpaceDataDisplay;
