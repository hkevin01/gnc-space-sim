// Replaced by safer, fixed-step implementation
import {
  GNCSystem,
  GravityTurnGuidance,
  integrateLaunchTrajectory,
  LAUNCH_VEHICLES,
  LaunchPhase,
  LaunchState,
} from '@gnc/core';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLaunchControl } from '../state/launchControlStore';
import { MissionEnvironment3D, PhaseVisualIndicator } from './MissionEnvironment';
import { SpacecraftType } from './SpacecraftModels';

export function LaunchDemo() {
  // Use global launch control store instead of local state
  const launchTime = useLaunchControl((state) => state.launchTime);
  const setLaunchTime = useLaunchControl((state) => state.setLaunchTime);
  const currentState = useLaunchControl((state) => state.currentState);
  const setCurrentState = useLaunchControl((state) => state.setCurrentState);
  const resetLaunch = useLaunchControl((state) => state.resetLaunch);
  const isLaunched = useLaunchControl((state) => state.isLaunched);

  const trajectoryRef = useRef<THREE.Line | null>(null);
  const trajectoryGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const trajectoryMatRef = useRef<THREE.LineBasicMaterial | null>(null);

  const vehicleRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  const [simulationTime, setSimulationTime] = useState(0);
  const invalidStateCount = useRef(0);

  const [trajectory, setTrajectory] = useState<THREE.Vector3[]>(() => [
    new THREE.Vector3(6.371, 0, 0),
  ]);

  const [timeMultiplier] = useState(1);
  const accumulator = useRef(0);
  const fixedDt = 1 / 100;

  const guidance = useMemo(() => new GravityTurnGuidance(400000, (28.5 * Math.PI) / 180), []);
  const gncSystem = useMemo(() => new GNCSystem(0.1), []);
  const vehicle = LAUNCH_VEHICLES.FALCON_9;

  const initialState = useMemo<LaunchState>(
    () => ({
      r: [6371000, 0, 0],
      v: [0, 463.8, 0],
      phase: LaunchPhase.PRELAUNCH,
      mission_time: 0,
      altitude: 0,
      velocity_magnitude: 463.8,
      flight_path_angle: Math.PI / 2,
      heading: Math.PI / 2,
      mass:
        vehicle.stage1.mass_dry +
        vehicle.stage1.mass_propellant +
        vehicle.stage2.mass_dry +
        vehicle.stage2.mass_propellant +
        vehicle.payload_mass +
        vehicle.fairing_mass,
      thrust: [0, 0, 0],
      drag: [0, 0, 0],
      atmosphere: { pressure: 101325, density: 1.225, temperature: 288.15 },
      guidance: { pitch_program: Math.PI / 2, yaw_program: Math.PI / 2, throttle: 0 },
    }),
    [vehicle]
  );

  const stateRef = useRef<LaunchState>(initialState);

  useEffect(() => {
    if (!trajectoryRef.current) {
      const geom = new THREE.BufferGeometry().setFromPoints(trajectory);
      const mat = new THREE.LineBasicMaterial({ color: 0x6b7280, linewidth: 2 });
      const line = new THREE.Line(geom, mat);
      trajectoryGeomRef.current = geom;
      trajectoryMatRef.current = mat;
      trajectoryRef.current = line;
    }
    return () => {
      trajectoryGeomRef.current?.dispose();
      trajectoryMatRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!trajectoryMatRef.current) return;
    const colorHex = getTrajectoryColor(currentState?.phase || LaunchPhase.PRELAUNCH);
    trajectoryMatRef.current.color.set(colorHex);
  }, [currentState?.phase]);

  const isFiniteArray = (arr: number[], limit?: number) =>
    Array.isArray(arr) &&
    arr.every((v) => Number.isFinite(v) && !Number.isNaN(v) && (limit ? Math.abs(v) < limit : true));

  const lastSampleTimeRef = useRef(0);

  useFrame((_, renderDelta) => {
    // Only start countdown/simulation if launch has been initiated
    if (!isLaunched) {
      return;
    }

    if (launchTime < 0) {
      const d = Math.min(Math.max(renderDelta, 1 / 300), 0.1);
      setLaunchTime((prev) => prev + d);
      return;
    }

    const clamped = Math.min(Math.max(renderDelta, 1 / 300), 0.1);
    accumulator.current += clamped;

    while (accumulator.current >= fixedDt) {
      accumulator.current -= fixedDt;
      let dt = fixedDt;
      const currentPhase = stateRef.current.phase;
      if (currentPhase === LaunchPhase.LIFTOFF || currentPhase === LaunchPhase.MAX_Q) dt = Math.min(dt, 0.01);
      if (invalidStateCount.current > 0) dt = Math.min(dt, 0.005);

      try {
        const newState = integrateLaunchTrajectory(stateRef.current, vehicle, guidance, dt);
        const hasValidPosition = isFiniteArray(newState.r, 1e12);
        const hasValidVelocity = isFiniteArray(newState.v, 1e6);
        const hasValidAltitude = Number.isFinite(newState.altitude) && !Number.isNaN(newState.altitude) && newState.altitude >= -1000;
        const hasValidTime = Number.isFinite(newState.mission_time) && !Number.isNaN(newState.mission_time);

        if (!hasValidPosition || !hasValidVelocity || !hasValidAltitude || !hasValidTime) {
          invalidStateCount.current++;
          if (invalidStateCount.current > 5) {
            stateRef.current = initialState;
            setCurrentState(initialState);
            resetLaunch();
            invalidStateCount.current = 0;
          }
          continue;
        }

        invalidStateCount.current = 0;
        try {
          gncSystem.update(newState);
        } catch (e) {
          // Ignore GNC update errors to keep render loop stable
          console.debug('GNC update error (non-fatal):', e);
        }

        stateRef.current = newState;
        setCurrentState(newState);
        setLaunchTime((prev) => prev + dt);

        if (newState.mission_time - lastSampleTimeRef.current >= 1 - 1e-6) {
          lastSampleTimeRef.current = newState.mission_time;
          if (isFiniteArray(newState.r)) {
            const scale = 1e6;
            const newPoint = new THREE.Vector3(newState.r[0] / scale, newState.r[1] / scale, newState.r[2] / scale);
            setTrajectory((prev) => {
              const updated = prev.length >= 500 ? [...prev.slice(prev.length - 499), newPoint] : [...prev, newPoint];
              if (trajectoryGeomRef.current) {
                const safePoints = updated.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
                trajectoryGeomRef.current.setFromPoints(safePoints);
                trajectoryGeomRef.current.computeBoundingSphere();
              }
              return updated;
            });
          }
        }

        if (vehicleRef.current && isFiniteArray(newState.r)) {
          const scale = 1e6;
          const px = newState.r[0] / scale;
          const py = newState.r[1] / scale;
          const pz = newState.r[2] / scale;
          if (Number.isFinite(px) && Number.isFinite(py) && Number.isFinite(pz)) {
            vehicleRef.current.position.set(px, py, pz);
          }
          if (Number.isFinite(newState.flight_path_angle) && !Number.isNaN(newState.flight_path_angle) && Number.isFinite(newState.heading) && !Number.isNaN(newState.heading)) {
            vehicleRef.current.rotation.x = -newState.flight_path_angle;
            vehicleRef.current.rotation.z = newState.heading - Math.PI / 2;
          }
        }

        if (newState.phase === LaunchPhase.ORBIT_CIRCULARIZATION && newState.altitude > 390000) {
          console.log('Launch successful! Orbit achieved.');
        }
  } catch {
        invalidStateCount.current++;
        if (invalidStateCount.current > 5) {
          stateRef.current = initialState;
          setCurrentState(initialState);
          resetLaunch();
          invalidStateCount.current = 0;
        }
      }
    }
  });

  useEffect(() => {
    if (trajectoryGeomRef.current && trajectory.length > 0) {
      const valid = trajectory.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
      if (valid.length > 0) {
        trajectoryGeomRef.current.setFromPoints(valid);
        trajectoryGeomRef.current.computeBoundingSphere();
      }
    }
  }, [trajectory]);

  function getTrajectoryColor(phase: LaunchPhase): string {
    switch (phase) {
      case LaunchPhase.LIFTOFF:
      case LaunchPhase.STAGE1_BURN:
        return '#FF6B35';
      case LaunchPhase.MAX_Q:
        return '#8B5CF6';
      case LaunchPhase.STAGE1_SEPARATION:
      case LaunchPhase.STAGE2_IGNITION:
        return '#10B981';
      case LaunchPhase.STAGE2_BURN:
        return '#F59E0B';
      case LaunchPhase.ORBITAL_INSERTION:
      case LaunchPhase.ORBIT_CIRCULARIZATION:
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  }



  const handleTimeUpdate = (_deltaTime: number, totalTime: number) => {
    setSimulationTime(totalTime);
  };

  const environment = {
    showEarth: true,
    showMoon: false,
    showSun: true,
    showMars: false,
    showAsteroid: false,
  };

  return (
    <group ref={groupRef}>
      <MissionEnvironment3D
        phase={currentState?.phase || LaunchPhase.PRELAUNCH}
        missionTime={launchTime > 0 ? launchTime : 0}
        altitude={currentState?.altitude || 0}
        timeMultiplier={timeMultiplier}
        simulationTime={simulationTime}
        onTimeUpdate={handleTimeUpdate}
        environment={environment}
        spacecraftType={SpacecraftType.FALCON9}
        missionPhase={currentState?.phase || LaunchPhase.PRELAUNCH}
        group={groupRef}
        showSpacecraft={false}
      />

      <group ref={vehicleRef}>
        <mesh>
          <cylinderGeometry args={[3.7e-6, 3.7e-6, 70e-6, 8]} />
          <meshStandardMaterial
            color={
              currentState?.phase === LaunchPhase.STAGE1_BURN || currentState?.phase === LaunchPhase.STAGE2_BURN
                ? '#FF6B35'
                : '#FFFFFF'
            }
          />
        </mesh>

        {(currentState?.phase === LaunchPhase.STAGE1_BURN || currentState?.phase === LaunchPhase.STAGE2_BURN) && (
          <mesh position={[0, -50e-6, 0]}>
            <coneGeometry args={[5e-6, 25e-6, 8]} />
            <meshBasicMaterial color="#FFD700" transparent opacity={0.8} />
          </mesh>
        )}

        {currentState?.phase === LaunchPhase.STAGE1_SEPARATION && (
          <group position={[0, -60e-6, 0]}>
            <mesh>
              <cylinderGeometry args={[1.5e-6, 1.5e-6, 30e-6, 8]} />
              <meshStandardMaterial color="#808080" />
            </mesh>
          </group>
        )}

        {currentState?.phase === LaunchPhase.FAIRING_JETTISON && (
          <>
            <mesh position={[15e-6, 25e-6, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[8e-6, 20e-6, 3e-6]} />
              <meshStandardMaterial color="#CCCCCC" />
            </mesh>
            <mesh position={[-15e-6, 25e-6, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[8e-6, 20e-6, 3e-6]} />
              <meshStandardMaterial color="#CCCCCC" />
            </mesh>
          </>
        )}
      </group>

      {trajectoryRef.current && <primitive object={trajectoryRef.current} />}

      {currentState && isFiniteArray(currentState.r) && (
        <Html
          position={[currentState.r[0] / 1e6 + 0.5, currentState.r[1] / 1e6 + 0.5, currentState.r[2] / 1e6]}
          distanceFactor={8}
        >
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm pointer-events-none border border-orange-400 min-w-48">
            <PhaseVisualIndicator phase={currentState.phase} missionTime={launchTime > 0 ? launchTime : 0} />
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Altitude:</span>
                <span className="text-green-400">{(currentState.altitude / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Velocity:</span>
                <span className="text-blue-400">{(currentState.velocity_magnitude / 1000).toFixed(2)} km/s</span>
              </div>
              <div className="flex justify-between">
                <span>Flight Path:</span>
                <span className="text-yellow-400">{(currentState.flight_path_angle * (180 / Math.PI)).toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Mass:</span>
                <span className="text-purple-400">{(currentState.mass / 1000).toFixed(1)} t</span>
              </div>
            </div>
          </div>
        </Html>
      )}


    </group>
  );
}

export function useLaunchState(): LaunchState | null {
  return null;
}
