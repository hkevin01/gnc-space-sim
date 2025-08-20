import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

/**
 * Scene Manager - Handles core Three.js scene setup and management
 *
 * Based on the Solar System project's modular architecture
 * Manages:
 * - Scene configuration
 * - Camera controls
 * - Lighting system
 * - Post-processing effects
 * - Renderer settings
 */

export class SceneManager {
  private scene: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private ambientLight!: THREE.AmbientLight
  private directionalLight!: THREE.DirectionalLight
  private pointLights: THREE.PointLight[] = []

  constructor(canvas?: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    this.setupCamera()
    this.setupRenderer(canvas)
    this.setupLighting()
    this.setupScene()
  }

  private setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    )
    this.camera.position.set(0, 30, 70)
  }

  private setupRenderer(canvas?: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
  }

  private setupLighting() {
    // Enhanced ambient lighting
    this.ambientLight = new THREE.AmbientLight('#4682B4', 0.15)
    this.scene.add(this.ambientLight)

    // Main directional light (simulating distant starlight)
    this.directionalLight = new THREE.DirectionalLight('#E6E6FA', 0.3)
    this.directionalLight.position.set(100, 100, 50)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.far = 1000
    this.directionalLight.shadow.camera.left = -100
    this.directionalLight.shadow.camera.right = 100
    this.directionalLight.shadow.camera.top = 100
    this.directionalLight.shadow.camera.bottom = -100
    this.scene.add(this.directionalLight)
  }

  private setupScene() {
    this.scene.background = new THREE.Color('#000814')
    this.scene.fog = new THREE.Fog('#000814', 500, 2000)
  }

  // Dynamic lighting management
  addPointLight(position: THREE.Vector3, color: string, intensity: number, distance: number) {
    const light = new THREE.PointLight(color, intensity, distance)
    light.position.copy(position)
    light.castShadow = true
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    this.pointLights.push(light)
    this.scene.add(light)
    return light
  }

  removePointLight(light: THREE.PointLight) {
    const index = this.pointLights.indexOf(light)
    if (index > -1) {
      this.pointLights.splice(index, 1)
      this.scene.remove(light)
    }
  }

  updateLighting(cameraPosition: THREE.Vector3, sunPosition?: THREE.Vector3) {
    // Adjust ambient lighting based on distance from sun
    if (sunPosition) {
      const distanceToSun = cameraPosition.distanceTo(sunPosition)
      const ambientIntensity = Math.max(0.05, Math.min(0.3, 1 / (distanceToSun / 100)))
      this.ambientLight.intensity = ambientIntensity
    }

    // Update directional light to follow camera for consistent illumination
    this.directionalLight.position.copy(cameraPosition).add(new THREE.Vector3(100, 100, 50))
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  // Getters
  getScene() { return this.scene }
  getCamera() { return this.camera }
  getRenderer() { return this.renderer }
  getAmbientLight() { return this.ambientLight }
  getDirectionalLight() { return this.directionalLight }
  getPointLights() { return this.pointLights }

  // Cleanup
  dispose() {
    this.pointLights.forEach(light => this.scene.remove(light))
    this.pointLights = []
    this.renderer.dispose()
  }
}

/**
 * React component wrapper for SceneManager
 */
export function EnhancedSceneManager() {
  const { camera, gl } = useThree()
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const sunPositionRef = useRef(new THREE.Vector3(-150, 50, -200))

  // Initialize scene manager
  if (!sceneManagerRef.current) {
    sceneManagerRef.current = new SceneManager(gl.domElement)
  }

  useFrame(() => {
    if (sceneManagerRef.current) {
      // Update lighting based on camera position
      sceneManagerRef.current.updateLighting(camera.position, sunPositionRef.current)
    }
  })

  return null // This component doesn't render anything visible
}

/**
 * Animation Manager - Handles time-based animations and updates
 */
export class AnimationManager {
  private isRunning = false
  private animationId: number | null = null
  private timeMultiplier = 1
  private currentTime = 0
  private lastTime = 0
  private frameCount = 0
  private callbacks: ((deltaTime: number, totalTime: number) => void)[] = []

  constructor() {
    this.animate = this.animate.bind(this)
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true
      this.lastTime = performance.now()
      this.animate()
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.isRunning = false
  }

  private animate() {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) * 0.001 * this.timeMultiplier
    this.currentTime += deltaTime
    this.lastTime = currentTime
    this.frameCount++

    // Execute all registered callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(deltaTime, this.currentTime)
      } catch (error) {
        console.error('Animation callback error:', error)
      }
    })

    this.animationId = requestAnimationFrame(this.animate)
  }

  addCallback(callback: (deltaTime: number, totalTime: number) => void) {
    this.callbacks.push(callback)
  }

  removeCallback(callback: (deltaTime: number, totalTime: number) => void) {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  setTimeMultiplier(multiplier: number) {
    this.timeMultiplier = multiplier
  }

  getTimeMultiplier() {
    return this.timeMultiplier
  }

  getCurrentTime() {
    return this.currentTime
  }

  getFrameCount() {
    return this.frameCount
  }

  resetTime() {
    this.currentTime = 0
    this.frameCount = 0
  }
}

/**
 * React component wrapper for AnimationManager
 */
interface AnimationManagerProviderProps {
  children: React.ReactNode
  onTimeUpdate?: (deltaTime: number, totalTime: number) => void
  timeMultiplier?: number
}

export function AnimationManagerProvider({
  children,
  onTimeUpdate,
  timeMultiplier = 1
}: AnimationManagerProviderProps) {
  const animationManagerRef = useRef<AnimationManager | null>(null)

  if (!animationManagerRef.current) {
    animationManagerRef.current = new AnimationManager()
    animationManagerRef.current.start()
  }

  // Update time multiplier
  if (animationManagerRef.current.getTimeMultiplier() !== timeMultiplier) {
    animationManagerRef.current.setTimeMultiplier(timeMultiplier)
  }

  // Register callback
  useFrame((_, delta) => {
    if (onTimeUpdate && animationManagerRef.current) {
      const totalTime = animationManagerRef.current.getCurrentTime()
      onTimeUpdate(delta * timeMultiplier, totalTime)
    }
  })

  return <>{children}</>
}

/**
 * Camera Manager - Handles camera controls and movements
 */
export class CameraManager {
  private camera: THREE.PerspectiveCamera
  private followTarget: THREE.Object3D | null = null
  private followOffset = new THREE.Vector3(10, 5, 10)
  private smoothness = 0.1

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
  }

  setFollowTarget(target: THREE.Object3D | null, offset?: THREE.Vector3) {
    this.followTarget = target
    if (offset) {
      this.followOffset.copy(offset)
    }
  }

  update() {
    if (this.followTarget) {
      const targetPosition = new THREE.Vector3()
      this.followTarget.getWorldPosition(targetPosition)
      targetPosition.add(this.followOffset)

      // Smooth camera movement
      this.camera.position.lerp(targetPosition, this.smoothness)
      this.camera.lookAt(this.followTarget.position)
    }
  }

  setPosition(position: THREE.Vector3) {
    this.camera.position.copy(position)
  }

  lookAt(target: THREE.Vector3) {
    this.camera.lookAt(target)
  }

  setSmoothness(smoothness: number) {
    this.smoothness = Math.max(0, Math.min(1, smoothness))
  }

  getCamera() {
    return this.camera
  }
}

/**
 * React component wrapper for CameraManager
 */
export function EnhancedCameraManager({
  followTarget,
  followOffset,
  smoothness = 0.1
}: {
  followTarget?: THREE.Object3D | null
  followOffset?: THREE.Vector3
  smoothness?: number
}) {
  const { camera } = useThree()
  const cameraManagerRef = useRef<CameraManager | null>(null)

  if (!cameraManagerRef.current && camera instanceof THREE.PerspectiveCamera) {
    cameraManagerRef.current = new CameraManager(camera)
  }

  // Update follow target
  if (followTarget !== undefined && cameraManagerRef.current) {
    cameraManagerRef.current.setFollowTarget(followTarget, followOffset)
  }

  // Update smoothness
  if (cameraManagerRef.current) {
    cameraManagerRef.current.setSmoothness(smoothness)
  }

  useFrame(() => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.update()
    }
  })

  return null
}

/**
 * Performance Monitor - Tracks and reports performance metrics
 */
interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage: number
  frameCount: number
}

export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 0
  private frameTime = 0
  private memoryUsage = 0
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = []

  update() {
    this.frameCount++
    const currentTime = performance.now()
    this.frameTime = currentTime - this.lastTime

    // Calculate FPS every 60 frames
    if (this.frameCount % 60 === 0) {
      this.fps = 1000 / this.frameTime

      // Get memory usage if available
      if ('memory' in performance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576 // MB
      }

      // Notify callbacks
      const metrics: PerformanceMetrics = {
        fps: this.fps,
        frameTime: this.frameTime,
        memoryUsage: this.memoryUsage,
        frameCount: this.frameCount
      }

      this.callbacks.forEach(callback => callback(metrics))
    }

    this.lastTime = currentTime
  }

  addCallback(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback)
  }

  removeCallback(callback: (metrics: PerformanceMetrics) => void) {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: this.memoryUsage,
      frameCount: this.frameCount
    }
  }
}
