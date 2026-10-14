import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls
  public composer: EffectComposer

  private animationCallbacks: Array<(elapsedTime: number) => void> = []
  private startTime: number

  constructor(canvas: HTMLCanvasElement) {
    this.startTime = performance.now()

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#1e2025')
    this.scene.fog = new THREE.FogExp2('#f0f2f5', 0.045)

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(9, 5, 11)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.6

    this.scene.add(new THREE.AmbientLight('#8899ff', 0.4))
    const grid = new THREE.GridHelper(40, 40, '#1e2a55', '#141a33')
    grid.position.y = -3.5
    this.scene.add(grid)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.9,
      0.6,
      0.1
    )
    this.composer.addPass(bloom)

    window.addEventListener('resize', this.onWindowResize)

    this.startLoop()
  }

  public onUpdate(callback: (elapsedTime: number) => void): void {
    this.animationCallbacks.push(callback)
  }

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.composer.setSize(window.innerWidth, window.innerHeight)
  }

  private startLoop(): void {
    this.renderer.setAnimationLoop(() => {
      const elapsed = (performance.now() - this.startTime) / 1000

      for (const cb of this.animationCallbacks) {
        cb(elapsed)
      }

      this.controls.update()
      this.composer.render()
    })
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize)
    this.renderer.setAnimationLoop(null)
  }
}
