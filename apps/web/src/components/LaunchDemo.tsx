import {
  GravityTurnGuidance,
  integrateLaunchTrajectory,
  KalmanFilter3D,
  LAUNCH_VEHICLES,
  LaunchPhase,
  LaunchState,
} from '@gnc/core';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { ComponentRef, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLaunchControl } from '../state/launchControlStore';
import { getBodyPositionRelativeToCenter, getBodySceneRadius, getRenderRadius, SolarSystem, type SolarBodyName } from './SolarSystem';
import { MISSION_SCENARIOS } from './MissionTypes';
import {
  EARTH_RADIUS_SCENE,
  getCapeCanaveralWorldFrame,
  launchSiteSceneVectorFromLocalFrame,
  ROCKET_VISUAL_SCALE,
  followCameraTarget,
  rocketScenePositionFromR,
  applyBoundaryAwareCameraFraming,
  type Vec3,
} from '../utils/launchVisualBehavior';
import { buildCompressedMissionTimeline, getCompressedMissionPhase } from '../utils/missionTimeline';
import { buildSceneBodyBoundaries, constrainPointToBoundariesDetailed } from '../utils/sceneBoundaries';
import {
  propagateMissionVehicle,
  resolveSoiOwner,
  type MissionSoiOwner,
  type MissionTrailSegment,
} from '../utils/missionPropagation';

/**
 * ID: SSIM-LAUNCH-001
 * Requirement: Render SLS rocket at Earth's visual surface in the solar
 *   system scene and animate a physics-accurate ascent trajectory.
 * Purpose: Visual mission simulation for the GNC Space Simulation.
 * Rationale: The solar system scene uses 1 scene unit = 1e6 km for
 *   orbital distances, but applies a SIZE_MULT of 25× to planet sphere
 *   radii so they are visible. The rocket's physical position (metres →
 *   scene units via posScale=1e-9) is therefore at physical scale, not
 *   at visual scale.  EARTH_RADIUS_SCENE is the VISUAL sphere radius
 *   (≈0.159 units) so the rocket surface offset matches the Earth sphere.
 * Constraints: ROCKET_VISUAL_SCALE is tuned so rocket visual length is
 *   approximately 1/8 of Moon visual radius for scene readability.
 * References: SolarSystem.tsx SOLAR_SYSTEM_DATA.EARTH.sceneRadius formula.
 */

export function LaunchDemo({
  selectedMission,
  timeMultiplier = 50, // Increased default for better visual pacing
  showTrajectory = true,
  cameraMode = 'follow',
  onCameraRef,
}: {
  selectedMission?: string;
  timeMultiplier?: number;
  showTrajectory?: boolean;
  cameraMode?: 'follow' | 'free';
  onCameraRef?: (ref: RefObject<ComponentRef<typeof OrbitControls> | null>) => void;
}) {
  // Camera follow state
  const { camera } = useThree();
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const lastUserInteraction = useRef(Date.now());
  const snapBackTimeout = useRef<number | null>(null);
  const hasZoomedToRocket = useRef(false);
  const isUserInteracting = useRef(false); // Track if user is actively zooming/rotating

  // Use global launch control store instead of local state
  const launchTime = useLaunchControl((state) => state.launchTime);
  const setLaunchTime = useLaunchControl((state) => state.setLaunchTime);
  const currentState = useLaunchControl((state) => state.currentState);
  const setCurrentState = useLaunchControl((state) => state.setCurrentState);
  const setMissionTelemetry = useLaunchControl((state) => state.setMissionTelemetry);
  const resetLaunch = useLaunchControl((state) => state.resetLaunch);
  const isLaunched = useLaunchControl((state) => state.isLaunched);

  const capeFrame = useMemo(() => getCapeCanaveralWorldFrame(launchTime), [launchTime]);

  const trajectoryRef = useRef<THREE.Line | null>(null);
  const trajectoryGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const trajectoryMatRef = useRef<THREE.LineBasicMaterial | null>(null);

  const vehicleRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);

  const invalidStateCount = useRef(0);

  useEffect(() => {
    if (vehicleRef.current && !isLaunched) {
      vehicleRef.current.position.set(
        capeFrame.surface[0],
        capeFrame.surface[1],
        capeFrame.surface[2],
      );
      vehicleRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(capeFrame.up[0], capeFrame.up[1], capeFrame.up[2]),
      );
    }
  }, [capeFrame.surface, isLaunched]);

  const [trajectory, setTrajectory] = useState<THREE.Vector3[]>(() => [
    new THREE.Vector3(
      capeFrame.surface[0],
      capeFrame.surface[1],
      capeFrame.surface[2],
    ),
  ]);
  const [missionTrail, setMissionTrail] = useState<Array<{ point: Vec3; segment: MissionTrailSegment }>>([])
  const previousMissionPointRef = useRef<Vec3 | undefined>(undefined)
  const previousSoiOwnerRef = useRef<MissionSoiOwner>('EARTH')

  const guidance = useMemo(() => {
    return new GravityTurnGuidance(400000, (28.5 * Math.PI) / 180);
  }, []);

  const lunarTimeline = useMemo(() => {
    if (selectedMission !== 'lunarMission') return []
    return buildCompressedMissionTimeline(MISSION_SCENARIOS.lunarMission.phases)
  }, [selectedMission])

  const activeMissionPhase = useMemo(() => {
    if (selectedMission !== 'lunarMission' || launchTime < 0) return null
    return getCompressedMissionPhase(lunarTimeline, launchTime)
  }, [launchTime, lunarTimeline, selectedMission])

  const protectedBodies = useMemo(() => {
    return buildSceneBodyBoundaries(launchTime, 'EARTH')
  }, [launchTime])

  const outboundTrailPoints = useMemo(() => {
    const points = missionTrail.filter((entry) => entry.segment === 'outbound').map((entry) => entry.point)
    return points.length >= 2 ? points : null
  }, [missionTrail])

  const operationsTrailPoints = useMemo(() => {
    const points = missionTrail.filter((entry) => entry.segment === 'operations' || entry.segment === 'arrival').map((entry) => entry.point)
    return points.length >= 2 ? points : null
  }, [missionTrail])

  const returnTrailPoints = useMemo(() => {
    const points = missionTrail.filter((entry) => entry.segment === 'return' || entry.segment === 'cruise').map((entry) => entry.point)
    return points.length >= 2 ? points : null
  }, [missionTrail])

  useEffect(() => {
    if (onCameraRef) {
      onCameraRef(controlsRef);
    }
  }, [onCameraRef]);

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

  const isFiniteVector3 = (v: THREE.Vector3) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

  // Listen for user OrbitControls interaction
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const timeoutRef = snapBackTimeout;

    const onStart = () => {
      isUserInteracting.current = true;
      lastUserInteraction.current = Date.now();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    const onEnd = () => {
      lastUserInteraction.current = Date.now();
      // Delay before resuming camera follow to let user finish adjusting
      timeoutRef.current = window.setTimeout(() => {
        isUserInteracting.current = false;
      }, 2000) as unknown as number; // Resume follow after 2 seconds of no interaction
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [controlsRef]);

  // Camera follow logic - zoom in when launch starts (skip when user is interacting)
  useFrame(() => {
    if (cameraMode === 'free') return
    if (!isLaunched || launchTime < 0) return

    // Skip camera follow if user is actively using OrbitControls
    if (isUserInteracting.current) return;

    if (vehicleRef.current) {
      const rocketPos = getRocketPosition();
      if (!isFiniteVector3(rocketPos)) return;

      // If rocket position is at origin, use Earth visual surface position
      const actualRocketPos = rocketPos.length() < 0.01
        ? new THREE.Vector3(
            capeFrame.surface[0],
            capeFrame.surface[1],
            capeFrame.surface[2],
          )
        : rocketPos;

      // Always follow the rocket during launch
      if (isLaunched) {
        // Initial zoom to rocket on launch start - SNAP immediately
        if (!hasZoomedToRocket.current && launchTime >= -10) {
          hasZoomedToRocket.current = true;

          // SNAP camera close to rocket surface (scene units ≈ 0.159 Earth sphere)
          const cameraPos = new THREE.Vector3(
            actualRocketPos.x + EARTH_RADIUS_SCENE * 0.4,
            actualRocketPos.y + EARTH_RADIUS_SCENE * 0.2,
            actualRocketPos.z + EARTH_RADIUS_SCENE * 0.6
          );
          camera.position.copy(cameraPos);
          camera.lookAt(actualRocketPos);

          if (controlsRef.current) {
            controlsRef.current.target.copy(actualRocketPos);
            controlsRef.current.update();
          }

          console.log('📍 Camera snapped to rocket at:', actualRocketPos.toArray());
        }

        const altitude = stateRef.current.altitude / 1000; // km
        const cam = followCameraTarget(
          [actualRocketPos.x, actualRocketPos.y, actualRocketPos.z],
          altitude,
          launchTime,
        );
        const targetCamPos = new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]);
        if (!isFiniteVector3(targetCamPos)) return;
        camera.position.lerp(targetCamPos, 0.03); // Smooth following

        // Look at rocket
        camera.lookAt(actualRocketPos);

        if (controlsRef.current) {
          if (isFiniteVector3(actualRocketPos)) {
            controlsRef.current.target.lerp(actualRocketPos, 0.05);
          }
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
      const mat = new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        linewidth: 2,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
        depthWrite: false,
      });
      const line = new THREE.Line(geom, mat);
      line.renderOrder = 20;
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
    if (!isLaunched || launchTime < 0) return;

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
    const nextTime = launchTime + deltaTime;

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
        // Scale: position in metres → scene units using ROCKET_POS_SCALE (1e-9)
        // This keeps the rocket at the correct physical position relative to Earth origin.
        // The NasaSolarSystem offsets Earth to world-origin so (r - Earth_centre) * posScale
        // gives the displacement from Earth's visual centre in scene units.
        const p = rocketScenePositionFromR(nextState.r as [number, number, number], undefined, nextTime);
        const clamped = constrainPointToBoundaries(p, protectedBodies)
        const newPos = new THREE.Vector3(clamped[0], clamped[1], clamped[2]);

        // Validate position before setting (max ~10 scene units = lunar distance range)
        if (newPos.length() < 10) {
          vehicleRef.current.position.copy(newPos);

          const altitudeKm = nextState.altitude / 1000
          const localUp = new THREE.Vector3(capeFrame.up[0], capeFrame.up[1], capeFrame.up[2]).normalize()

          if (altitudeKm < 25) {
            const launchQuaternion = new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(1, 0, 0),
              localUp,
            )
            vehicleRef.current.quaternion.copy(launchQuaternion)
          } else if (isFiniteArray(nextState.v)) {
            const worldVelocity = launchSiteSceneVectorFromLocalFrame(
              nextState.v[0] * 1e-9,
              nextState.v[1] * 1e-9,
              nextState.v[2] * 1e-9,
              nextTime,
            );
            const vel = new THREE.Vector3(worldVelocity[0], worldVelocity[1], worldVelocity[2]);
            if (vel.length() > 0) {
              const desiredDirection = vel.normalize()
              const blend = Math.min(Math.max((altitudeKm - 25) / 75, 0), 1)
              desiredDirection.lerp(localUp, 1 - blend).normalize()
              const flightQuaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(1, 0, 0),
                desiredDirection,
              )
              vehicleRef.current.quaternion.copy(flightQuaternion)
            }
          }
        }
      }

      if (showTrajectory && isFiniteArray(nextState.r)) {
        const p = rocketScenePositionFromR(nextState.r as [number, number, number], undefined, nextTime);
        const newPoint = new THREE.Vector3(p[0], p[1], p[2]);

        // Throttle trajectory updates - only add point every 10 frames to reduce re-renders
        if (Number.isFinite(newPoint.x) && Number.isFinite(newPoint.y) && Number.isFinite(newPoint.z)) {
          const frameCount = Math.floor(nextTime * 10) % 10;
          if (frameCount === 0) {
            setTrajectory((prev) => {
              const updated = [...prev, newPoint];
              return updated.length > 500 ? updated.slice(-500) : updated; // Reduced from 1000
            });
          }
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

  const phase = currentState?.phase;
  const phaseAfterBoosterSep = phase === LaunchPhase.STAGE1_SEPARATION || phase === LaunchPhase.STAGE2_IGNITION || phase === LaunchPhase.STAGE2_BURN || phase === LaunchPhase.FAIRING_JETTISON || phase === LaunchPhase.ORBITAL_INSERTION;
  const phaseAfterCoreSep = phase === LaunchPhase.STAGE2_IGNITION || phase === LaunchPhase.STAGE2_BURN || phase === LaunchPhase.FAIRING_JETTISON || phase === LaunchPhase.ORBITAL_INSERTION;
  const phaseAfterIcpsSep = phase === LaunchPhase.ORBITAL_INSERTION;

  const showAttachedBoosters = !phaseAfterBoosterSep;
  const showBoosterSeparation = phase === LaunchPhase.STAGE1_SEPARATION;
  const showAttachedCore = !phaseAfterCoreSep;
  const showCoreSeparation = phase === LaunchPhase.STAGE2_IGNITION;
  const showAttachedIcps = !phaseAfterIcpsSep;
  const showIcpsSeparation = phaseAfterIcpsSep;
  const showOrbitalInsertionLabel = phase === LaunchPhase.ORBITAL_INSERTION;
  const showEarthReturnLabel = activeMissionPhase?.name === 'Earth Return';
  const outboundPoints = lunarTransferPreview ? slicePoints(lunarTransferPreview.outbound, lunarTrailProgress.outbound) : null;
  const lunarOpsPoints = lunarTransferPreview ? slicePoints(lunarTransferPreview.lunarOps, lunarTrailProgress.operations) : null;
  const returnPoints = lunarTransferPreview ? slicePoints(lunarTransferPreview.inbound, lunarTrailProgress.returnLeg) : null;

  const labelStyle: React.CSSProperties = {
    background: 'rgba(2, 6, 23, 0.82)',
    border: '1px solid rgba(125, 211, 252, 0.45)',
    borderRadius: '999px',
    color: '#e2e8f0',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '0.35rem 0.6rem',
    whiteSpace: 'nowrap',
  };

  return (
    <group ref={groupRef}>
      <SolarSystem
        centerOn="EARTH"
        showOrbits={true}
        missionTime={launchTime}
      />

      <group>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS_SCENE * 1.035, 48, 48]} />
          <meshBasicMaterial
            color="#6ec1ff"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS_SCENE * 1.07, 32, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.035}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Rocket Vehicle Group - visible scale */}
      <group ref={vehicleRef}>
        {/* SLS Core Stage - Orange tank */}
        {showAttachedCore && (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.4, ROCKET_VISUAL_SCALE * 0.4, ROCKET_VISUAL_SCALE * 4, 16]} />
            <meshStandardMaterial
              color="#FF6600"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        )}

        {/* Attached SRBs before booster separation */}
        {showAttachedBoosters && (
          <>
            <mesh position={[0, ROCKET_VISUAL_SCALE * 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 3.5, 12]} />
              <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, -ROCKET_VISUAL_SCALE * 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 0.15, ROCKET_VISUAL_SCALE * 3.5, 12]} />
              <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}

        {/* ICPS upper stage attached until insertion */}
        {showAttachedIcps && (
          <mesh position={[ROCKET_VISUAL_SCALE * 1.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.24, ROCKET_VISUAL_SCALE * 0.24, ROCKET_VISUAL_SCALE * 0.9, 16]} />
            <meshStandardMaterial color="#6E6E6E" metalness={0.7} roughness={0.35} />
          </mesh>
        )}

        {/* Orion Capsule */}
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
        {showBoosterSeparation && (
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
            <Html position={[0, ROCKET_VISUAL_SCALE * 2.1, 0]} center>
              <div style={labelStyle}>BOOSTER SEPARATION</div>
            </Html>
          </group>
        )}

        {/* Core stage separation visualization */}
        {showCoreSeparation && (
          <mesh position={[-ROCKET_VISUAL_SCALE * 1.4, 0, 0]} rotation={[0, 0, Math.PI / 2 - 0.1]}>
            <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.4, ROCKET_VISUAL_SCALE * 0.35, ROCKET_VISUAL_SCALE * 3.2, 16]} />
            <meshStandardMaterial color="#CC5500" metalness={0.6} roughness={0.45} />
          </mesh>
        )}

        {/* ICPS separation visualization */}
        {showIcpsSeparation && (
          <mesh position={[ROCKET_VISUAL_SCALE * 0.85, 0, -ROCKET_VISUAL_SCALE * 0.3]} rotation={[0.12, 0, Math.PI / 2 - 0.15]}>
            <cylinderGeometry args={[ROCKET_VISUAL_SCALE * 0.24, ROCKET_VISUAL_SCALE * 0.2, ROCKET_VISUAL_SCALE * 0.9, 16]} />
            <meshStandardMaterial color="#5A5A5A" metalness={0.65} roughness={0.4} />
          </mesh>
        )}

        {showOrbitalInsertionLabel && (
          <Html position={[ROCKET_VISUAL_SCALE * 1.6, ROCKET_VISUAL_SCALE * 1.8, 0]} center>
            <div style={labelStyle}>ORBITAL INSERTION</div>
          </Html>
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
      </group>

      {trajectoryRef.current && <primitive object={trajectoryRef.current} />}

      {outboundPoints && (
        <Line
          points={outboundPoints}
          color="#7dd3fc"
          lineWidth={2}
          renderOrder={12}
          transparent
          opacity={0.9}
          depthTest={false}
        />
      )}

      {lunarOpsPoints && (
        <Line
          points={lunarOpsPoints}
          color="#fde68a"
          lineWidth={1.8}
          renderOrder={12}
          transparent
          opacity={0.9}
          depthTest={false}
        />
      )}

      {returnPoints && (
        <Line
          points={returnPoints}
          color="#fca5a5"
          lineWidth={2}
          renderOrder={12}
          transparent
          opacity={0.9}
          depthTest={false}
        />
      )}

      {showEarthReturnLabel && lunarTransferPreview && (
        <Html position={[lunarTransferPreview.moonPoint.x * 0.45, 0.14, lunarTransferPreview.moonPoint.z * -0.08]} center>
          <div style={labelStyle}>EARTH RETURN CORRIDOR</div>
        </Html>
      )}

      {/* OrbitControls for user interaction - camera follow managed in useFrame */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.08}
        zoomSpeed={1.5}
        panSpeed={0.8}
        rotateSpeed={0.5}
        minDistance={0.02}
        maxDistance={15000}  // Allow exploring out past the full outer-planet extent
      />
    </group>
  );
}
