import {
  GravityTurnGuidance,
  integrateLaunchTrajectory,
  KalmanFilter3D,
  LAUNCH_VEHICLES,
  LaunchPhase,
  LaunchState,
} from '@gnc/core';
import { OrbitControls, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLaunchControl } from '../state/launchControlStore';
import { NasaSolarSystem } from './SolarSystem';

// Scale factor: 1 unit = 1000 km in solar system view
// Earth radius = 6.371 units, so rocket needs to be visible at that scale
const ROCKET_VISUAL_SCALE = 0.05; // Visible rocket size relative to Earth

export function LaunchDemo({
  timeMultiplier = 50, // Increased default for better visual pacing
  showTrajectory = true,
  onCameraRef,
}: {
  timeMultiplier?: number;
  showTrajectory?: boolean;
  onCameraRef?: (ref: React.RefObject<typeof OrbitControls | null>) => void;
}) {
  // Camera follow state
  const { camera } = useThree();
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  const lastUserInteraction = useRef(Date.now());
  const snapBackTimeout = useRef<number | null>(null);
  const hasZoomedToRocket = useRef(false);

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

  // Camera follow logic - zoom in when launch starts
  useFrame(() => {
    if (vehicleRef.current) {
      const rocketPos = getRocketPosition();

      // Always follow the rocket during launch
      if (isLaunched) {
        // Initial zoom to rocket on launch start
        if (!hasZoomedToRocket.current && launchTime >= -10) {
          hasZoomedToRocket.current = true;
          // Instantly position camera near rocket for launch
          const earthRadius = 6.371; // units (1 unit = 1000km)
          const launchOffset = new THREE.Vector3(0.5, 0.3, 1.0);
          camera.position.set(
            earthRadius + launchOffset.x,
            launchOffset.y,
            launchOffset.z
          );
          if (controlsRef.current) {
            controlsRef.current.target.set(earthRadius, 0, 0);
            controlsRef.current.update();
          }
        }

        // Calculate dynamic camera position based on altitude
        const altitude = stateRef.current.altitude / 1000; // km
        let cameraDistance: number;

        // Closer view during launch, further during orbit
        if (altitude < 100) {
          cameraDistance = 0.3; // Very close for launch
        } else if (altitude < 400) {
          cameraDistance = 0.8; // Medium for ascent
        } else if (altitude < 1000) {
          cameraDistance = 2; // Further for high altitude
        } else {
          cameraDistance = 5; // Far for orbital operations
        }

        const target = rocketPos.clone().add(new THREE.Vector3(0, cameraDistance * 0.2, cameraDistance));
        camera.position.lerp(target, 0.03); // Smooth following

        // Look at rocket
        camera.lookAt(rocketPos);

        if (controlsRef.current) {
          controlsRef.current.target.lerp(rocketPos, 0.05);
          controlsRef.current.update();
        }
      }
    }
  });

  // Reset zoom flag when launch is reset
  useEffect(() => {
    if (!isLaunched) {
      hasZoomedToRocket.current = false;
    }
  }, [isLaunched]);

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
        // Scale: position in meters -> scene units (1 unit = 1000 km = 1,000,000 m)
        const posScale = 1e-6;
        const newPos = new THREE.Vector3(
          nextState.r[0] * posScale,
          nextState.r[1] * posScale,
          nextState.r[2] * posScale
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

      {/* Rocket Vehicle Group - visible scale */}
      <group ref={vehicleRef}>
        {/* SLS Core Stage - Orange tank */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.4, ROCKET_VISUAL_SCALE * 0.4, ROCKET_VISUAL_SCALE * 4, 16]} />
          <meshStandardMaterial
            color="#FF6600"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Left SRB - Solid Rocket Booster */}
        <mesh position={[0, ROCKET_VISUAL_SCALE * 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 3.5, 12]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Right SRB - Solid Rocket Booster */}
        <mesh position={[0, -ROCKET_VISUAL_SCALE * 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 3.5, 12]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Orion Capsule on top */}
        <mesh position={[ROCKET_VISUAL_SCALE * 2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[ROCKET_VISUAL_SCALE * 0.35, ROCKET_VISUAL_SCALE * 0.8, 16]} />
          <meshStandardMaterial color="#DDDDDD" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Service Module */}
        <mesh position={[ROCKET_VISUAL_SCALE * 2.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.3, ROCKET_VISUAL_SCALE * 0.3, ROCKET_VISUAL_SCALE * 0.5, 16]} />
          <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Engine Flames during burn phases */}
        {(currentState?.phase === LaunchPhase.STAGE1_BURN || currentState?.phase === LaunchPhase.STAGE2_BURN) && (
          <group>
            {/* Main engine flame */}
            <mesh position={[-ROCKET_VISUAL_SCALE * 2.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[ROCKET_VISUAL_SCALE * 0.5, ROCKET_VISUAL_SCALE * 2, 12]} />
              <meshBasicMaterial color="#FF4400" transparent opacity={0.9} />
            </mesh>
            {/* Flame glow */}
            <mesh position={[-ROCKET_VISUAL_SCALE * 3.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[ROCKET_VISUAL_SCALE * 0.8, ROCKET_VISUAL_SCALE * 3, 12]} />
              <meshBasicMaterial color="#FFAA00" transparent opacity={0.5} />
            </mesh>
            {/* SRB flames */}
            <mesh position={[-ROCKET_VISUAL_SCALE * 2.2, ROCKET_VISUAL_SCALE * 0.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[ROCKET_VISUAL_SCALE * 0.2, ROCKET_VISUAL_SCALE * 1.5, 8]} />
              <meshBasicMaterial color="#FF6600" transparent opacity={0.85} />
            </mesh>
            <mesh position={[-ROCKET_VISUAL_SCALE * 2.2, -ROCKET_VISUAL_SCALE * 0.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[ROCKET_VISUAL_SCALE * 0.2, ROCKET_VISUAL_SCALE * 1.5, 8]} />
              <meshBasicMaterial color="#FF6600" transparent opacity={0.85} />
            </mesh>
          </group>
        )}

        {/* SRB Separation visualization */}
        {currentState?.phase === LaunchPhase.STAGE1_SEPARATION && (
          <group>
            {/* Separating left SRB */}
            <mesh position={[ROCKET_VISUAL_SCALE * -1, ROCKET_VISUAL_SCALE * 1.2, 0]} rotation={[0, 0, Math.PI / 2 + 0.2]}>
              <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 3.5, 12]} />
              <meshStandardMaterial color="#CCCCCC" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Separating right SRB */}
            <mesh position={[ROCKET_VISUAL_SCALE * -1, -ROCKET_VISUAL_SCALE * 1.2, 0]} rotation={[0, 0, Math.PI / 2 - 0.2]}>
              <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 3.5, 12]} />
              <meshStandardMaterial color="#CCCCCC" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* Fairing jettison visualization */}
        {currentState?.phase === LaunchPhase.FAIRING_JETTISON && (
          <>
            <mesh position={[ROCKET_VISUAL_SCALE * 1.5, ROCKET_VISUAL_SCALE * 0.8, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[ROCKET_VISUAL_SCALE * 0.8, ROCKET_VISUAL_SCALE * 1.5, ROCKET_VISUAL_SCALE * 0.1]} />
              <meshStandardMaterial color="#CCCCCC" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[ROCKET_VISUAL_SCALE * 1.5, -ROCKET_VISUAL_SCALE * 0.8, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[ROCKET_VISUAL_SCALE * 0.8, ROCKET_VISUAL_SCALE * 1.5, ROCKET_VISUAL_SCALE * 0.1]} />
              <meshStandardMaterial color="#CCCCCC" metalness={0.5} roughness={0.5} />
            </mesh>
          </>
        )}

        {/* Mission status label */}
        <Html position={[0, ROCKET_VISUAL_SCALE * 1.5, 0]} center distanceFactor={5}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            border: '1px solid #444'
          }}>
            🚀 SLS / Orion
          </div>
        </Html>
      </group>

      {trajectoryRef.current && <primitive object={trajectoryRef.current} />}

      {/* OrbitControls for user interaction - camera follow managed in useFrame */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={2}
        panSpeed={1}
        rotateSpeed={0.5}
        minDistance={0.1}
        maxDistance={500}
      />
    </group>
  );
}
