import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { getMissionSpacecraft } from './SpacecraftModels';

// Mission Type Definitions
export interface MissionPhase {
  name: string;
  description: string;
  duration: number; // in seconds
  requirements: string[];
  events: MissionEvent[];
}

export interface MissionEvent {
  time: number; // seconds from mission start
  type: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface MissionScenario {
  id: string;
  name: string;
  description: string;
  target: string;
  duration: number; // total mission duration in seconds
  spacecraft: string;
  trajectory: {
    departure: { body: string; altitude: number };
    arrival: { body: string; altitude: number };
    deltaV: number; // m/s
    transferTime: number; // seconds
  };
  phases: MissionPhase[];
  objectives: string[];
  science: string[];
}

// Predefined Mission Scenarios
export const MISSION_SCENARIOS: Record<string, MissionScenario> = {
  earthOrbit: {
    id: 'earthOrbit',
    name: 'Low Earth Orbit Mission',
    description: 'Deploy and maintain satellites in Low Earth Orbit',
    target: 'Earth',
    duration: 7200, // 2 hours
    spacecraft: 'falcon9',
    trajectory: {
      departure: { body: 'Earth', altitude: 0 },
      arrival: { body: 'Earth', altitude: 400000 },
      deltaV: 9500,
      transferTime: 600
    },
    phases: [
      {
        name: 'Launch',
        description: 'Ascent from Earth surface to parking orbit',
        duration: 600,
        requirements: ['Engine ignition', 'Stage separation', 'Fairing deployment'],
        events: [
          { time: 0, type: 'liftoff', description: 'Engine ignition and liftoff' },
          { time: 120, type: 'stage_separation', description: 'First stage separation' },
          { time: 180, type: 'fairing_separation', description: 'Payload fairing jettison' },
          { time: 480, type: 'seco', description: 'Second engine cutoff' },
          { time: 600, type: 'orbit_insertion', description: 'Low Earth orbit insertion' }
        ]
      },
      {
        name: 'Orbital Operations',
        description: 'Satellite deployment and orbit maintenance',
        duration: 5400,
        requirements: ['Payload deployment', 'Orbit adjustments'],
        events: [
          { time: 900, type: 'payload_deployment', description: 'Primary payload deployment' },
          { time: 3600, type: 'orbit_adjustment', description: 'Orbital maneuver for final orbit' }
        ]
      },
      {
        name: 'Deorbit',
        description: 'Controlled deorbit and atmospheric reentry',
        duration: 1200,
        requirements: ['Deorbit burn', 'Atmospheric entry'],
        events: [
          { time: 6000, type: 'deorbit_burn', description: 'Retrograde burn for deorbit' },
          { time: 7200, type: 'atmospheric_entry', description: 'Atmospheric reentry' }
        ]
      }
    ],
    objectives: [
      'Deploy satellite payload successfully',
      'Maintain orbital parameters within tolerance',
      'Complete controlled deorbit sequence'
    ],
    science: [
      'Earth observation data collection',
      'Communication relay establishment',
      'Orbital mechanics validation'
    ]
  },

  marsTransfer: {
    id: 'marsTransfer',
    name: 'Mars Transfer Mission',
    description: 'Interplanetary transfer to Mars with orbital insertion',
    target: 'Mars',
    duration: 26438400, // ~9 months
    spacecraft: 'starship',
    trajectory: {
      departure: { body: 'Earth', altitude: 200000 },
      arrival: { body: 'Mars', altitude: 500000 },
      deltaV: 15000,
      transferTime: 26438400
    },
    phases: [
      {
        name: 'Earth Departure',
        description: 'Trans-Mars injection from Earth parking orbit',
        duration: 1800,
        requirements: ['TMI burn', 'Trajectory correction'],
        events: [
          { time: 0, type: 'tmi_burn', description: 'Trans-Mars injection burn' },
          { time: 1200, type: 'trajectory_check', description: 'Initial trajectory verification' },
          { time: 1800, type: 'earth_soi_exit', description: 'Exit Earth sphere of influence' }
        ]
      },
      {
        name: 'Interplanetary Cruise',
        description: 'Long-duration flight to Mars with periodic corrections',
        duration: 26434800,
        requirements: ['Deep space navigation', 'System maintenance', 'Course corrections'],
        events: [
          { time: 2592000, type: 'tcm1', description: 'Trajectory correction maneuver 1' },
          { time: 7776000, type: 'tcm2', description: 'Trajectory correction maneuver 2' },
          { time: 15552000, type: 'tcm3', description: 'Trajectory correction maneuver 3' },
          { time: 23328000, type: 'tcm4', description: 'Final trajectory correction maneuver' }
        ]
      },
      {
        name: 'Mars Arrival',
        description: 'Mars orbit insertion and mission operations setup',
        duration: 1800,
        requirements: ['MOI burn', 'Orbit circularization'],
        events: [
          { time: 26437200, type: 'mars_soi_entry', description: 'Enter Mars sphere of influence' },
          { time: 26437800, type: 'moi_burn', description: 'Mars orbit insertion burn' },
          { time: 26438400, type: 'mars_orbit', description: 'Stable Mars orbit achieved' }
        ]
      }
    ],
    objectives: [
      'Successfully transfer from Earth to Mars',
      'Achieve stable Mars orbit insertion',
      'Maintain spacecraft systems during long cruise',
      'Complete all trajectory correction maneuvers'
    ],
    science: [
      'Interplanetary space environment monitoring',
      'Mars atmospheric entry analysis',
      'Long-duration spaceflight systems validation',
      'Martian orbital reconnaissance'
    ]
  },

  asteroidMission: {
    id: 'asteroidMission',
    name: 'Near-Earth Asteroid Sample Return',
    description: 'Rendezvous with near-Earth asteroid, collect samples, and return to Earth',
    target: 'Bennu',
    duration: 94608000, // ~3 years
    spacecraft: 'probe',
    trajectory: {
      departure: { body: 'Earth', altitude: 200000 },
      arrival: { body: 'Bennu', altitude: 1000 },
      deltaV: 8000,
      transferTime: 63072000 // ~2 years outbound
    },
    phases: [
      {
        name: 'Earth Departure',
        description: 'Launch and Earth escape trajectory',
        duration: 3600,
        requirements: ['Launch vehicle separation', 'Solar array deployment'],
        events: [
          { time: 0, type: 'separation', description: 'Spacecraft separation from launch vehicle' },
          { time: 1800, type: 'solar_deploy', description: 'Solar array deployment' },
          { time: 3600, type: 'earth_escape', description: 'Earth escape trajectory achieved' }
        ]
      },
      {
        name: 'Interplanetary Cruise to Asteroid',
        description: 'Deep space cruise with navigation and asteroid approach',
        duration: 63072000,
        requirements: ['Deep space navigation', 'Asteroid tracking', 'Approach planning'],
        events: [
          { time: 15552000, type: 'deep_space_maneuver', description: 'Deep space maneuver for trajectory adjustment' },
          { time: 31104000, type: 'asteroid_acquisition', description: 'Asteroid optical acquisition' },
          { time: 47520000, type: 'approach_phase', description: 'Begin final approach phase' }
        ]
      },
      {
        name: 'Asteroid Operations',
        description: 'Orbital survey, sample collection, and departure preparation',
        duration: 31536000, // 1 year
        requirements: ['Orbital survey', 'Sample collection', 'Surface mapping'],
        events: [
          { time: 63075600, type: 'orbit_insertion', description: 'Asteroid orbit insertion' },
          { time: 71020800, type: 'detailed_survey', description: 'Detailed surface mapping complete' },
          { time: 78969600, type: 'sample_collection', description: 'Surface sample collection event' },
          { time: 86918400, type: 'sample_stow', description: 'Sample container stowed for return' },
          { time: 94608000, type: 'departure_burn', description: 'Earth return trajectory burn' }
        ]
      }
    ],
    objectives: [
      'Rendezvous and orbit asteroid target',
      'Complete detailed surface mapping',
      'Collect pristine surface samples',
      'Successfully return samples to Earth'
    ],
    science: [
      'Asteroid composition analysis',
      'Surface geology and topography',
      'Organic compound detection',
      'Solar system formation insights'
    ]
  },

  lunarMission: {
    id: 'lunarMission',
    name: 'Artemis Lunar Landing',
    description: 'Crewed lunar landing mission with surface operations',
    target: 'Moon',
    duration: 864000, // 10 days
    spacecraft: 'orion',
    trajectory: {
      departure: { body: 'Earth', altitude: 200000 },
      arrival: { body: 'Moon', altitude: 100000 },
      deltaV: 12000,
      transferTime: 259200 // 3 days
    },
    phases: [
      {
        name: 'Trans-Lunar Injection',
        description: 'Departure from Earth orbit toward the Moon',
        duration: 3600,
        requirements: ['TLI burn', 'Spacecraft checkout'],
        events: [
          { time: 0, type: 'tli_burn', description: 'Trans-lunar injection burn' },
          { time: 1800, type: 'spacecraft_checkout', description: 'Post-TLI spacecraft systems check' },
          { time: 3600, type: 'earth_departure', description: 'Earth departure trajectory confirmed' }
        ]
      },
      {
        name: 'Lunar Transit',
        description: 'Coast phase to Moon with mid-course corrections',
        duration: 255600,
        requirements: ['Navigation updates', 'Mid-course corrections'],
        events: [
          { time: 86400, type: 'mcc1', description: 'Mid-course correction 1' },
          { time: 172800, type: 'mcc2', description: 'Mid-course correction 2' },
          { time: 232000, type: 'lunar_approach', description: 'Begin lunar approach phase' }
        ]
      },
      {
        name: 'Lunar Operations',
        description: 'Lunar orbit insertion, landing, surface ops, and ascent',
        duration: 518400, // 6 days
        requirements: ['LOI burn', 'Landing', 'Surface EVAs', 'Ascent'],
        events: [
          { time: 259200, type: 'loi_burn', description: 'Lunar orbit insertion' },
          { time: 345600, type: 'lunar_landing', description: 'Lunar surface touchdown' },
          { time: 432000, type: 'surface_eva1', description: 'First lunar EVA' },
          { time: 518400, type: 'surface_eva2', description: 'Second lunar EVA' },
          { time: 604800, type: 'lunar_ascent', description: 'Ascent from lunar surface' }
        ]
      },
      {
        name: 'Earth Return',
        description: 'Trans-Earth injection and atmospheric reentry',
        duration: 86400, // 1 day
        requirements: ['TEI burn', 'Reentry prep', 'Splashdown'],
        events: [
          { time: 777600, type: 'tei_burn', description: 'Trans-Earth injection burn' },
          { time: 840000, type: 'entry_prep', description: 'Entry interface preparation' },
          { time: 864000, type: 'splashdown', description: 'Ocean splashdown and recovery' }
        ]
      }
    ],
    objectives: [
      'Successfully land crew on lunar surface',
      'Complete planned surface EVA operations',
      'Collect lunar samples and data',
      'Safely return crew to Earth'
    ],
    science: [
      'Lunar geology sample collection',
      'Lunar south pole ice prospecting',
      'Long-duration surface operations',
      'Human deep space exploration validation'
    ]
  }
};

// Mission Control Interface
interface MissionControlProps {
  currentMission: string;
  onMissionChange: (missionId: string) => void;
  missionTime: number;
  onTimeChange: (time: number) => void;
}

export function MissionControl({
  currentMission,
  onMissionChange,
  missionTime,
  onTimeChange
}: MissionControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const mission = MISSION_SCENARIOS[currentMission];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onTimeChange(Math.min(missionTime + playbackSpeed, mission.duration));
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, missionTime, playbackSpeed, mission.duration, onTimeChange]);

  const getCurrentPhase = () => {
    let elapsed = 0;
    for (const phase of mission.phases) {
      if (missionTime >= elapsed && missionTime < elapsed + phase.duration) {
        return { ...phase, startTime: elapsed, progress: (missionTime - elapsed) / phase.duration };
      }
      elapsed += phase.duration;
    }
    return null;
  };

  const getUpcomingEvents = () => {
    const currentPhase = getCurrentPhase();
    if (!currentPhase) return [];

    return currentPhase.events
      .filter(event => event.time > missionTime - currentPhase.startTime)
      .slice(0, 3);
  };

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPhase = getCurrentPhase();
  const upcomingEvents = getUpcomingEvents();

  return (
      <div
        className="mission-control"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '400px',
          background: 'rgba(0, 20, 40, 0.95)',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '20px',
          color: '#e2e8f0',
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)',
          zIndex: 1000
        }}
      >
      <div className="mission-header">
        <h2>{mission.name}</h2>
        <p>{mission.description}</p>
        <div className="mission-selector">
          <label>Mission:</label>
          <select value={currentMission} onChange={(e) => onMissionChange(e.target.value)}>
            {Object.entries(MISSION_SCENARIOS).map(([id, scenario]) => (
              <option key={id} value={id}>{scenario.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mission-timeline">
        <div className="time-display">
          <div className="mission-time">
            <strong>Mission Time: {formatTime(missionTime)}</strong>
          </div>
          <div className="mission-duration">
            Duration: {formatTime(mission.duration)}
          </div>
        </div>

        <div className="playback-controls">
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button onClick={() => onTimeChange(0)}>⏮️ Reset</button>
          <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))}>
            <option value={0.1}>0.1x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={10}>10x</option>
            <option value={100}>100x</option>
            <option value={1000}>1000x</option>
          </select>
        </div>

        <div className="mission-progress">
          <div
            className="progress-bar"
            style={{
              width: `${(missionTime / mission.duration) * 100}%`,
              backgroundColor: '#4CAF50',
              height: '8px',
              borderRadius: '4px',
              transition: 'width 0.1s'
            }}
          />
        </div>
      </div>

      {currentPhase && (
        <div className="current-phase">
          <h3>Current Phase: {currentPhase.name}</h3>
          <p>{currentPhase.description}</p>
          <div className="phase-progress">
            Progress: {Math.round(currentPhase.progress * 100)}%
          </div>
          <div
            className="phase-progress-bar"
            style={{
              width: `${currentPhase.progress * 100}%`,
              backgroundColor: '#2196F3',
              height: '6px',
              borderRadius: '3px',
              transition: 'width 0.1s'
            }}
          />
        </div>
      )}

      <div className="mission-info">
        <div className="mission-objectives">
          <h4>Mission Objectives</h4>
          <ul>
            {mission.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>

        <div className="science-goals">
          <h4>Science Goals</h4>
          <ul>
            {mission.science.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>

        <div className="upcoming-events">
          <h4>Upcoming Events</h4>
          {upcomingEvents.length > 0 ? (
            <ul>
              {upcomingEvents.map((event, index) => (
                <li key={index}>
                  <strong>T+{formatTime(event.time + (currentPhase?.startTime || 0))}:</strong> {event.description}
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming events in current phase</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Mission Environment with Mission Types
interface MissionEnvironmentWithTypesProps {
  currentMission: string;
  missionTime: number;
}

export function MissionEnvironmentWithTypes({
  currentMission
}: MissionEnvironmentWithTypesProps) {
  const mission = MISSION_SCENARIOS[currentMission];
  const spacecraftType = getMissionSpacecraft(mission.spacecraft);

  return (
    <group>
      {/* Mission-specific environment rendering */}
      {/* Spacecraft component would be rendered here with: */}
      {/* spacecraftType: {spacecraftType} */}
      {/* This can be integrated once the main spacecraft component is imported */}
      <primitive object={new THREE.Group()} userData={{ spacecraftType }} />
    </group>
  );
}

export default MISSION_SCENARIOS;
