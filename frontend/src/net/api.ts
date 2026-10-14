export interface HealthResponse {
  status: string
  version: string
  env: string
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health')
  if (!res.ok) {
    throw new Error(`API health check failed with status: ${res.status}`)
  }
  return res.json()
}
