import {
    GravityTurnGuidance,
    integrateLaunchTrajectory,
    KalmanFilter3D,
    LAUNCH_VEHICLES,
    LaunchPhase,
    LaunchState,
} from '@gnc/core';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLaunchControl } from '../state/launchControlStore';
import { NasaSolarSystem } from './SolarSystem';

export function LaunchDemo({
  timeMultiplier = 50, // Increased default for better visual pacing
  showTrajectory = true,
}: {
  timeMultiplier?: number;
  showTrajectory?: boolean;
}) {
  // Camera follow state
  const { camera } = useThree();
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls> | null>(null);
  const lastUserInteraction = useRef(Date.now());
  const snapBackTimeout = useRef<number | null>(null);

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

  const invalidStateCount = useRef(0);

  const [trajectory, setTrajectory] = useState<THREE.Vector3[]>(() => [
    new THREE.Vector3(6.371, 0, 0),
  ]);

  const guidance = useMemo(() => {
    return new GravityTurnGuidance(400000, (28.5 * Math.PI) / 180);
  }, []);

  const initialState: LaunchState = useMemo(() => {
    const vehicle = LAUNCH_VEHICLES.FALCON_9;
    return {
      r: [6371000, 0, 0],
      v: [0, 463.8, 0],
      phase: LaunchPhase.PRELAUNCH,
      mission_time: 0,
      altitude: 0,
      velocity_magnitude: 463.8,
      flight_path_angle: Math.PI / 2,
      heading: Math.PI / 2,
      mass: vehicle.stage1.mass_dry + vehicle.stage1.mass_propellant +
            vehicle.stage2.mass_dry + vehicle.stage2.mass_propellant +
            vehicle.payload_mass + vehicle.fairing_mass,
      thrust: [0, 0, 0],
      drag: [0, 0, 0],
      atmosphere: { pressure: 101325, density: 1.225, temperature: 288.15 },
      guidance: { pitch_program: Math.PI / 2, yaw_program: Math.PI / 2, throttle: 0 },
    };
  }, []);

  const stateRef = useRef<LaunchState>(initialState);
  const kfRef = useRef<KalmanFilter3D | null>(null);
  if (!kfRef.current) {
    kfRef.current = new KalmanFilter3D(
      { r: initialState.r as [number, number, number], v: initialState.v as [number, number, number] },
      { posVar: 1e4, velVar: 10 },
      { processPosStd: 2, processVelStd: 0.5, measPosStd: 20, measVelStd: 1 }
    );
  }

  // Helper: get rocket position in world
  const getRocketPosition = useCallback(() => {
    if (vehicleRef.current) {
      const pos = new THREE.Vector3();
      vehicleRef.current.getWorldPosition(pos);
      return pos;
    }
    return new THREE.Vector3(0, 0, 0);
  }, []);

  // Listen for user OrbitControls interaction
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const timeoutRef = snapBackTimeout;

    const onStart = () => {
      lastUserInteraction.current = Date.now();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    const onEnd = () => {
      lastUserInteraction.current = Date.now();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [controlsRef]);

  // Camera follow logic
  useFrame(() => {
    if (vehicleRef.current) {
      const rocketPos = getRocketPosition();

      // Always follow the rocket during launch
      if (isLaunched) {
        // Calculate dynamic camera position based on altitude
        const altitude = stateRef.current.altitude / 1000; // km
        let cameraDistance = Math.max(20, altitude * 0.1 + 20); // Scale with altitude

        // Closer view during launch, further during orbit
        if (altitude < 100) {
          cameraDistance = 20; // Close for launch
        } else if (altitude < 400) {
          cameraDistance = 50; // Medium for ascent
        } else {
          cameraDistance = 100; // Far for orbit
        }

        const target = rocketPos.clone().add(new THREE.Vector3(0, 5, cameraDistance));
        camera.position.lerp(target, 0.02); // Smooth following

        // Look at rocket
        camera.lookAt(rocketPos);

        if (controlsRef.current) {
          controlsRef.current.target.lerp(rocketPos, 0.05);
          controlsRef.current.update();
        }
      }
    }
  });

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
  }, [trajectory]);

  function isFiniteArray(arr: number[]): boolean {
    return arr.length === 3 && arr.every((x) => Number.isFinite(x));
  }

  useFrame((state, deltaTime) => {
    if (!isLaunched) return;

    // Adaptive time scaling based on mission phase for visual appeal
    let adaptiveMultiplier = timeMultiplier;
    const altitude = stateRef.current.altitude / 1000; // km

    // Dynamic time scaling for better visual experience
    if (altitude < 50) {
      adaptiveMultiplier = timeMultiplier * 0.3; // Slow during launch (exciting part)
    } else if (altitude < 200) {
      adaptiveMultiplier = timeMultiplier * 0.5; // Medium during ascent
    } else if (altitude < 400) {
      adaptiveMultiplier = timeMultiplier * 2; // Faster during boring orbital insertion
    } else {
      adaptiveMultiplier = timeMultiplier * 5; // Very fast during orbital operations
    }

    const dt = Math.min(deltaTime * adaptiveMultiplier, 0.1);
    const nextTime = launchTime + dt;

    try {
      const nextState = integrateLaunchTrajectory(stateRef.current, LAUNCH_VEHICLES.FALCON_9, guidance, dt);

      if (
        !nextState ||
        !isFiniteArray(nextState.r) ||
        !isFiniteArray(nextState.v) ||
        nextState.altitude < -1000 ||
        nextState.altitude > 1e6
      ) {
        invalidStateCount.current++;
        if (invalidStateCount.current > 10) {
          console.warn('Launch simulation failed, resetting...');
          resetLaunch();
          invalidStateCount.current = 0;
        }
        return;
      }

      invalidStateCount.current = 0;
      stateRef.current = nextState;
      setCurrentState(nextState);
      setLaunchTime(nextTime);

      // KF predict/update with current simulated state as measurement
      try {
        const kf = kfRef.current!;
        kf.predict(dt);
        kf.update([
          nextState.r[0], nextState.r[1], nextState.r[2],
          nextState.v[0], nextState.v[1], nextState.v[2]
        ]);
      } catch (kfError) {
        console.warn('Kalman filter error:', kfError);
        // Continue without KF if it fails
      }

      if (vehicleRef.current && isFiniteArray(nextState.r)) {
        const scale = 1e-6;
        const newPos = new THREE.Vector3(
          nextState.r[0] * scale,
          nextState.r[1] * scale,
          nextState.r[2] * scale
        );

        // Validate position before setting
        if (newPos.length() < 1000) { // Reasonable bounds check
          vehicleRef.current.position.copy(newPos);

            if (isFiniteArray(nextState.v)) {
            const vel = new THREE.Vector3(nextState.v[0], nextState.v[1], nextState.v[2]);
            if (vel.length() > 0) {
              vehicleRef.current.lookAt(
                vehicleRef.current.position.x + vel.x,
                vehicleRef.current.position.y + vel.y,
                vehicleRef.current.position.z + vel.z
              );
            }
          }
        }
      }

      if (showTrajectory && isFiniteArray(nextState.r)) {
        const newPoint = new THREE.Vector3(
          nextState.r[0] * 1e-6,
          nextState.r[1] * 1e-6,
          nextState.r[2] * 1e-6
        );

        if (Number.isFinite(newPoint.x) && Number.isFinite(newPoint.y) && Number.isFinite(newPoint.z)) {
          setTrajectory((prev) => {
            const updated = [...prev, newPoint];
            return updated.length > 1000 ? updated.slice(-1000) : updated;
          });
        }
      }
    } catch (error) {
      console.error('Error in launch simulation:', error);
      invalidStateCount.current++;
      if (invalidStateCount.current > 5) {
        console.warn('Too many simulation errors, resetting launch...');
        resetLaunch();
        invalidStateCount.current = 0;
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

  return (
    <group ref={groupRef}>
      <NasaSolarSystem
        centerOn="EARTH"
        showOrbits={true}
        useNasaData={true}
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
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Add details to make spacecraft more realistic */}
        <mesh position={[0, 35e-6, 0]}>
          <cylinderGeometry args={[2e-6, 2e-6, 10e-6, 8]} />
          <meshStandardMaterial color="#FF0000" metalness={0.9} roughness={0.1} />
        </mesh>

        <mesh position={[0, 25e-6, 0]}>
          <cylinderGeometry args={[1.5e-6, 1.5e-6, 8e-6, 8]} />
          <meshStandardMaterial color="#0066CC" metalness={0.7} roughness={0.3} />
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
              <meshStandardMaterial color="#808080" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        )}

        {currentState?.phase === LaunchPhase.FAIRING_JETTISON && (
          <>
            <mesh position={[15e-6, 25e-6, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[8e-6, 20e-6, 3e-6]} />
              <meshStandardMaterial color="#CCCCCC" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[-15e-6, 25e-6, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[8e-6, 20e-6, 3e-6]} />
              <meshStandardMaterial color="#CCCCCC" metalness={0.5} roughness={0.5} />
            </mesh>
          </>
        )}
      </group>

      {trajectoryRef.current && <primitive object={trajectoryRef.current} />}


    </group>
  );
}
