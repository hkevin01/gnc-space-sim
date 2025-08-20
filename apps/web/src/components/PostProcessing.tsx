import { useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Advanced Post-Processing Effects for GNC Space Simulator
 *
 * Provides cinematic visual effects including:
 * - Dynamic bloom based on camera distance and celestial bodies
 * - Tone mapping for realistic HDR rendering
 * - Subtle noise for film-like quality
 * - Vignette for depth focus
 * - Atmospheric scattering effects
 */

interface PostProcessingProps {
  altitude: number
  phase: string
  missionTime: number
}

export function PostProcessingEffects({ altitude, phase, missionTime }: PostProcessingProps) {
  const { camera } = useThree()
  const bloomRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

  // Dynamic bloom intensity based on altitude and mission phase
  const bloomSettings = useMemo(() => {
    // Higher altitude = more space = more bloom from stars/sun
    const altitudeBloom = Math.min(1.0, altitude / 1_000_000) * 0.8

    // Mission phase adjustments - more dramatic effects during critical phases
    const phaseMultiplier = phase.includes('BURN') ? 1.8 :
                           phase.includes('ORBITAL') ? 1.4 :
                           phase.includes('SEPARATION') ? 1.6 : 1.0

    // Time-based variations for dynamic effects
    const timeVariation = 1 + Math.sin(missionTime * 0.1) * 0.1

    return {
      intensity: (0.4 + altitudeBloom * phaseMultiplier) * timeVariation,
      luminanceThreshold: phase.includes('BURN') ? 0.7 : 0.9,
      luminanceSmoothing: 0.4
    }
  }, [altitude, phase, missionTime])

  // Dynamic tone mapping based on environment conditions
  const toneMappingSettings = useMemo(() => {
    const sunExposure = altitude > 500_000 ? 1.4 : 0.9
    const spaceExposure = altitude > 2_000_000 ? 1.6 : 1.0

    return {
      mode: ToneMappingMode.ACES_FILMIC,
      resolution: 256,
      whitePoint: 4.0 * spaceExposure,
      middleGrey: 0.6,
      minLuminance: 0.01,
      averageLuminance: 1.0 * sunExposure,
      adaptationRate: sunExposure
    }
  }, [altitude])

  // Update bloom dynamically based on camera movement and mission state
  useFrame(() => {
    if (bloomRef.current) {
      // Get camera distance to origin (where celestial bodies are)
      const distanceToCenter = camera.position.length()

      // Adjust bloom based on distance and mission phase
      const distanceMultiplier = 1 + Math.min(3.0, distanceToCenter / 200)
      const dynamicIntensity = bloomSettings.intensity * distanceMultiplier

      bloomRef.current.intensity = dynamicIntensity
    }
  })

  return (
    <EffectComposer>
      {/* Dynamic bloom for celestial bodies and engine effects */}
      <Bloom
        ref={bloomRef}
        intensity={bloomSettings.intensity}
        luminanceThreshold={bloomSettings.luminanceThreshold}
        luminanceSmoothing={bloomSettings.luminanceSmoothing}
        height={300}
        opacity={1.0}
        blendFunction={BlendFunction.SCREEN}
      />

      {/* Cinematic tone mapping for realistic space lighting */}
      <ToneMapping {...toneMappingSettings} />

      {/* Film grain for cinematic quality - more subtle in space */}
      <Noise
        opacity={altitude > 1_000_000 ? 0.015 : 0.025}
        blendFunction={BlendFunction.MULTIPLY}
      />

      {/* Vignette for focus - stronger during critical mission phases */}
      <Vignette
        offset={phase.includes('BURN') ? 0.4 : 0.5}
        darkness={phase.includes('BURN') ? 0.5 : 0.3}
        opacity={0.8}
        blendFunction={BlendFunction.MULTIPLY}
      />
    </EffectComposer>
  )
}

/**
 * Simple Bloom Effect using Three.js built-ins
 */
export function SimpleBloomEffect({
  children,
  intensity = 0.5
}: {
  children: React.ReactNode
  intensity?: number
}) {
  const { scene } = useThree()

  // This is a placeholder for bloom effect
  // In a full implementation, this would use EffectComposer
  // For now, we enhance emissive materials

  useFrame(() => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const material = object.material as THREE.MeshStandardMaterial
        if (material.emissive && material.emissiveIntensity) {
          // Subtle pulsing effect for emissive materials
          const time = Date.now() * 0.001
          const pulse = Math.sin(time) * 0.1 + 1
          material.emissiveIntensity = material.emissiveIntensity * pulse * intensity
        }
      }
    })
  })

  return <>{children}</>
}

/**
 * Enhanced lighting setup for mission environment
 */
export function MissionLighting() {
  return (
    <>
      {/* Enhanced ambient lighting for better material visibility */}
      <ambientLight intensity={0.15} color="#4682B4" />

      {/* Primary directional light simulating sun */}
      <directionalLight
        position={[100, 100, 50]}
        intensity={0.8}
        color="#FFF8DC"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
      />

      {/* Secondary fill light for depth */}
      <directionalLight
        position={[-50, 30, 100]}
        intensity={0.2}
        color="#E6E6FA"
      />

      {/* Rim light for silhouette enhancement */}
      <directionalLight
        position={[0, -100, -50]}
        intensity={0.1}
        color="#87CEEB"
      />
    </>
  )
}
