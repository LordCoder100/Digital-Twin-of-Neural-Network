export interface PingMessage {
  tick: number
  value: number
}

export type WsStatus = 'ok' | 'err' | 'wait'

export interface WsCallbacks {
  onStatusChange?: (status: WsStatus, text: string) => void
  onMessage?: (data: PingMessage) => void
}

export class PingWebSocketClient {
  private ws: WebSocket | null = null
  private callbacks: WsCallbacks
  private isDestroyed = false

  constructor(callbacks: WsCallbacks = {}) {
    this.callbacks = callbacks
  }

  connect(): void {
    if (this.isDestroyed) return

    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    this.ws = new WebSocket(`${proto}://${location.host}/ws/ping`)

    this.ws.onopen = () => {
      this.callbacks.onStatusChange?.('ok', 'live')
    }

    this.ws.onmessage = (e) => {
      try {
        const msg: PingMessage = JSON.parse(e.data)
        this.callbacks.onMessage?.(msg)
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    this.ws.onclose = () => {
      this.callbacks.onStatusChange?.('err', 'reconnecting')
      if (!this.isDestroyed) {
        setTimeout(() => this.connect(), 2000)
      }
    }

    this.ws.onerror = () => {
      this.callbacks.onStatusChange?.('err', 'error')
    }
  }

  disconnect(): void {
    this.isDestroyed = true
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
