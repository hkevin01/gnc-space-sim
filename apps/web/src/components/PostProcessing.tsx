import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'

/**
 * Post-processing effects for enhanced visuals
 * Based on techniques from the Solar System project
 */
export function PostProcessingEffects() {
  return (
    <EffectComposer>
      {/* Enhanced bloom effect for celestial bodies */}
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.ADD}
        kernelSize={KernelSize.MEDIUM}
        resolutionScale={0.5}
      />

      {/* Tone mapping for better color representation */}
      <ToneMapping
        blendFunction={BlendFunction.NORMAL}
        adaptive={true}
        resolution={256}
        middleGrey={0.6}
        maxLuminance={16.0}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
    </EffectComposer>
  )
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
