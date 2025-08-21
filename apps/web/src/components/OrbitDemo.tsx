import { keplerianPropagateTwoBody, MU_EARTH, State6 } from '@gnc/core'
import { useFrame, type RootState } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Mesh } from 'three'

export function OrbitDemo() {
  const ref = useRef<Mesh>(null)
  const state0 = useMemo<State6>(() => ({
    r: [7000e3, 0, 0],
    v: [0, 7.5e3, 0],
  }), [])
  const stateRef = useRef<State6>(state0)
  const scale = 1e6 // meters to megameters for visualization
  useFrame((state: RootState, delta: number) => {
    // Integrate from the last state to avoid resetting every frame
    stateRef.current = keplerianPropagateTwoBody(stateRef.current, delta, MU_EARTH)
    const s = stateRef.current
    if (ref.current) ref.current.position.set(s.r[0] / scale, s.r[1] / scale, s.r[2] / scale)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}
