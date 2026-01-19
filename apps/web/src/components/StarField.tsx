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
      // Random spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Star colors
      const brightness = 0.7 + Math.random() * 0.3
      const colorType = Math.random()
      
      if (colorType < 0.6) {
        // White
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness
        colors[i * 3 + 2] = brightness
      } else if (colorType < 0.8) {
        // Blue-white
        colors[i * 3] = brightness * 0.8
        colors[i * 3 + 1] = brightness * 0.9
        colors[i * 3 + 2] = brightness
      } else if (colorType < 0.95) {
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
      size: 1.5,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    })

    return [geo, mat]
  }, [count, radius])

  // Slow rotation for atmosphere
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.002
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
