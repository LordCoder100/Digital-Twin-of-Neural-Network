import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// ---------------------------------------------------------------------------
// Scene setup
// ---------------------------------------------------------------------------
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping

const scene = new THREE.Scene()
scene.background = new THREE.Color('#0a0c16')
scene.fog = new THREE.FogExp2('#0a0c16', 0.045)

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200)
camera.position.set(9, 5, 11)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.autoRotate = true
controls.autoRotateSpeed = 0.6

scene.add(new THREE.AmbientLight('#8899ff', 0.4))
const grid = new THREE.GridHelper(40, 40, '#1e2a55', '#141a33')
grid.position.y = -3.5
scene.add(grid)

// ---------------------------------------------------------------------------
// Placeholder network (will be replaced by the editor's scene graph)
// ---------------------------------------------------------------------------
const layers = [4, 6, 6, 3]
const spacing = 3.2
const cool = new THREE.Color('hsl(190, 95%, 60%)')
const warm = new THREE.Color('hsl(275, 90%, 68%)')

type Node = { mesh: THREE.Mesh; layer: number; phase: number }
const nodes: Node[] = []
const nodeGeo = new THREE.SphereGeometry(0.28, 32, 16)

layers.forEach((count, li) => {
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: '#111a33', emissive: cool.clone(), emissiveIntensity: 0.6 })
    const mesh = new THREE.Mesh(nodeGeo, mat)
    mesh.position.set((li - (layers.length - 1) / 2) * spacing, (i - (count - 1) / 2) * 1.1, 0)
    scene.add(mesh)
    nodes.push({ mesh, layer: li, phase: Math.random() * Math.PI * 2 })
  }
})

const edgePositions: number[] = []
for (let li = 0; li < layers.length - 1; li++) {
  const a = nodes.filter((n) => n.layer === li)
  const b = nodes.filter((n) => n.layer === li + 1)
  for (const na of a) for (const nb of b) edgePositions.push(...na.mesh.position.toArray(), ...nb.mesh.position.toArray())
}
const edgeGeo = new THREE.BufferGeometry()
edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3))
const edgeMat = new THREE.LineBasicMaterial({ color: '#3a5cff', transparent: true, opacity: 0.18 })
scene.add(new THREE.LineSegments(edgeGeo, edgeMat))

// ---------------------------------------------------------------------------
// Post-processing
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.6, 0.1)
composer.addPass(bloom)

// ---------------------------------------------------------------------------
// Backend connectivity (health + WebSocket test stream)
// ---------------------------------------------------------------------------
const $ = (id: string) => document.getElementById(id)!
function setPill(id: string, state: 'ok' | 'err' | 'wait', text: string) {
  const el = $(id)
  el.className = `pill pill--${state}`
  el.textContent = text
}

let signal = 0 // latest value from backend, drives the animation

async function checkHealth() {
  try {
    const res = await fetch('/api/health')
    if (!res.ok) throw new Error(String(res.status))
    const data: { status: string; version: string; env: string } = await res.json()
    setPill('status-api', 'ok', `v${data.version}`)
    $('status-env').textContent = data.env
  } catch {
    setPill('status-api', 'err', 'offline')
  }
}

function connectWs() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${location.host}/ws/ping`)
  ws.onopen = () => setPill('status-ws', 'ok', 'live')
  ws.onmessage = (e) => {
    const msg: { tick: number; value: number } = JSON.parse(e.data)
    signal = msg.value
    $('status-signal').textContent = `${msg.value.toFixed(3)} @ ${msg.tick}`
  }
  ws.onclose = () => {
    setPill('status-ws', 'err', 'reconnecting')
    setTimeout(connectWs, 2000)
  }
}

checkHealth()
connectWs()

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------
const t0 = performance.now()
const tmp = new THREE.Color()
renderer.setAnimationLoop(() => {
  const t = (performance.now() - t0) / 1000
  for (const n of nodes) {
    // a wave travels through layers, modulated by the backend signal
    const wave = 0.5 + 0.5 * Math.sin(t * 2 - n.layer * 1.2 + n.phase * 0.3 + signal * 2)
    const mat = n.mesh.material as THREE.MeshStandardMaterial
    mat.emissive.copy(tmp.copy(cool).lerp(warm, wave))
    mat.emissiveIntensity = 0.4 + wave * 1.6
    n.mesh.scale.setScalar(0.85 + wave * 0.3)
  }
  edgeMat.opacity = 0.12 + 0.1 * (0.5 + 0.5 * signal)
  controls.update()
  composer.render()
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})
