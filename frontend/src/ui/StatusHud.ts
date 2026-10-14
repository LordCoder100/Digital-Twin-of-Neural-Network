export type PillState = 'ok' | 'err' | 'wait'

export class StatusHud {
  private apiPill: HTMLElement | null
  private wsPill: HTMLElement | null
  private envLabel: HTMLElement | null
  private signalLabel: HTMLElement | null

  constructor() {
    this.apiPill = document.getElementById('status-api')
    this.wsPill = document.getElementById('status-ws')
    this.envLabel = document.getElementById('status-env')
    this.signalLabel = document.getElementById('status-signal')
  }

  setApiStatus(state: PillState, text: string): void {
    if (this.apiPill) {
      this.apiPill.className = `pill pill--${state}`
      this.apiPill.textContent = text
    }
  }

  setWsStatus(state: PillState, text: string): void {
    if (this.wsPill) {
      this.wsPill.className = `pill pill--${state}`
      this.wsPill.textContent = text
    }
  }

  setEnv(env: string): void {
    if (this.envLabel) {
      this.envLabel.textContent = env
    }
  }

  setSignal(value: number, tick: number): void {
    if (this.signalLabel) {
      this.signalLabel.textContent = `${value.toFixed(3)} @ ${tick}`
    }
  }
}
