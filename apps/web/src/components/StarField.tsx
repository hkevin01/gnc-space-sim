import { useMemo, useRef } from 'react'
import * as THREE from 'three'

interface StarFieldProps {
  count?: number
  radius?: number
}

export function StarField({ count = 2000, radius = 100 }: StarFieldProps) {
  const meshRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Random spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Random star colors (mostly white/blue with some variation)
      const colorVariation = Math.random()
      if (colorVariation < 0.7) {
        // White stars
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 1.0
      } else if (colorVariation < 0.9) {
        // Blue-white stars
        colors[i * 3] = 0.8
        colors[i * 3 + 1] = 0.9
        colors[i * 3 + 2] = 1.0
      } else {
        // Yellow stars
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.95
        colors[i * 3 + 2] = 0.8
      }
    }

    return { positions, colors }
  }, [count, radius])

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
