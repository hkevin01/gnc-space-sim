import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface StarFieldProps {
  count?: number
  radius?: number
}

export function StarField({ count = 8000, radius = 4000 }: StarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const [geometry, material] = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Random spherical distribution with a shallow shell spread so the
      // background reads as deep space instead of a flat star wall.
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const shellRadius = radius * (0.82 + Math.random() * 0.28)

      positions[i * 3] = shellRadius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = shellRadius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = shellRadius * Math.cos(phi)

      // Star colors
      const brightness = 0.34 + Math.random() * 0.5
      const colorType = Math.random()

      if (colorType < 0.72) {
        // White
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness
        colors[i * 3 + 2] = brightness
      } else if (colorType < 0.79) {
        // Very slight cool-white tint
        colors[i * 3] = brightness * 0.92
        colors[i * 3 + 1] = brightness * 0.95
        colors[i * 3 + 2] = brightness
      } else if (colorType < 0.94) {
        // Yellow
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness * 0.9
        colors[i * 3 + 2] = brightness * 0.6
      } else {
        // Red
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness * 0.5
        colors[i * 3 + 2] = brightness * 0.3
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return [geo, mat]
  }, [count, radius])

  // Slow rotation for atmosphere
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.0009
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
