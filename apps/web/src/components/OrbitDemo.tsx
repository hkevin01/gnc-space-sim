import { keplerianPropagateTwoBody, MU_EARTH, State6 } from '@gnc/core'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

export function OrbitDemo() {
  const ref = useRef<THREE.Mesh>(null)
  const state0 = useMemo<State6>(() => ({
    r: [7000e3, 0, 0],
    v: [0, 7.5e3, 0],
  }), [])
  let t = 0
  useFrame((_, delta) => {
    t += delta
    const s = keplerianPropagateTwoBody(state0, delta, MU_EARTH)
    if (ref.current) {
      ref.current.position.set(s.r[0] / 1e6, s.r[1] / 1e6, s.r[2] / 1e6)
    }
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}
