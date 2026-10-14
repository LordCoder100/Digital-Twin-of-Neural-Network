import * as THREE from 'three'

interface NodeData {
  mesh: THREE.Mesh
  layer: number
  phase: number
}

export class NetworkView {
  private group: THREE.Group
  private nodes: NodeData[] = []
  private edgeMat: THREE.LineBasicMaterial
  private coolColor = new THREE.Color('hsl(190, 95%, 60%)')
  private warmColor = new THREE.Color('hsl(275, 90%, 68%)')
  private tempColor = new THREE.Color()

  constructor(scene: THREE.Scene, layers = [4, 6, 6, 3], spacing = 3.2) {
    this.group = new THREE.Group()

    const nodeGeo = new THREE.SphereGeometry(0.28, 32, 16)

    layers.forEach((count, li) => {
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: '#111a33',
          emissive: this.coolColor.clone(),
          emissiveIntensity: 0.6,
        })
        const mesh = new THREE.Mesh(nodeGeo, mat)
        mesh.position.set((li - (layers.length - 1) / 2) * spacing, (i - (count - 1) / 2) * 1.1, 0)
        this.group.add(mesh)
        this.nodes.push({ mesh, layer: li, phase: Math.random() * Math.PI * 2 })
      }
    })

    const edgePositions: number[] = []
    for (let li = 0; li < layers.length - 1; li++) {
      const a = this.nodes.filter((n) => n.layer === li)
      const b = this.nodes.filter((n) => n.layer === li + 1)
      for (const na of a) {
        for (const nb of b) {
          edgePositions.push(...na.mesh.position.toArray(), ...nb.mesh.position.toArray())
        }
      }
    }

    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3))
    this.edgeMat = new THREE.LineBasicMaterial({
      color: '#3a5cff',
      transparent: true,
      opacity: 0.18,
    })
    this.group.add(new THREE.LineSegments(edgeGeo, this.edgeMat))

    scene.add(this.group)
  }

  public update(time: number, signal: number): void {
    for (const n of this.nodes) {
      const wave = 0.5 + 0.5 * Math.sin(time * 2 - n.layer * 1.2 + n.phase * 0.3 + signal * 2)
      const mat = n.mesh.material as THREE.MeshStandardMaterial
      mat.emissive.copy(this.tempColor.copy(this.coolColor).lerp(this.warmColor, wave))
      mat.emissiveIntensity = 0.4 + wave * 1.6
      n.mesh.scale.setScalar(0.85 + wave * 0.3)
    }
    this.edgeMat.opacity = 0.12 + 0.1 * (0.5 + 0.5 * signal)
  }
}
