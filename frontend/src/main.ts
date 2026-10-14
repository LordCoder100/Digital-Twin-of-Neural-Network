import './style.css'
import { SceneManager } from './render/SceneManager.ts'
import { NetworkView } from './render/NetworkView.ts'
import { StatusHud } from './ui/StatusHud.ts'
import { fetchHealth } from './net/api.ts'
import { PingWebSocketClient } from './net/websocket.ts'

// 1. Initialize UI HUD
const hud = new StatusHud()

// 2. Initialize 3D Scene & Network
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!
const sceneManager = new SceneManager(canvas)
const networkView = new NetworkView(sceneManager.scene)

const addBtn = document.getElementById('btn-add-node')
addBtn?.addEventListener('click', () => {
  console.log('Клік по кнопці! Тут буде створення 3D-сфери')
})


// 3. Signal state shared between network and WebSocket
let currentSignal = 0

// 4. Hook animation update to render loop
sceneManager.onUpdate((time) => {
  networkView.update(time, currentSignal)
})

// 5. Connect API health check
async function initHealth() {
  try {
    const data = await fetchHealth()
    hud.setApiStatus('ok', `v${data.version}`)
    hud.setEnv(data.env)
  } catch (err) {
    console.error('API health check error:', err)
    hud.setApiStatus('err', 'offline')
  }
}

// 6. Connect WebSocket stream
const wsClient = new PingWebSocketClient({
  onStatusChange: (status, text) => {
    hud.setWsStatus(status, text)
  },
  onMessage: (msg) => {
    currentSignal = msg.value
    hud.setSignal(msg.value, msg.tick)
  },
})

initHealth()
wsClient.connect()
