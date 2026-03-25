const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// Workers
export const getWorkers = () => fetchAPI<any[]>("/api/workers")
export const getWorker = (phone: string) => fetchAPI<any>(`/api/workers/${phone}`)

// Jobs
export const getJobs = (params?: { status?: string; skill?: string }) => {
  const query = params ? "?" + new URLSearchParams(params as any).toString() : ""
  return fetchAPI<any[]>(`/api/jobs${query}`)
}

export const createJob = (data: {
  title: string
  description: string
  skill: string
  location: string
  budget: string
  clientPhone: string
  clientName: string
}) => fetchAPI<any>("/api/jobs", { method: "POST", body: JSON.stringify(data) })

export const completeJob = (id: string) =>
  fetchAPI<any>(`/api/jobs/${id}/complete`, { method: "POST" })

export const lockEscrow = (id: string) =>
  fetchAPI<any>(`/api/jobs/${id}/lock-escrow`, { method: "POST" })

// Circles
export const getCircles = () => fetchAPI<any[]>("/api/circles")

export const completeCircleJob = (circleId: string, jobId: string) =>
  fetchAPI<any>(`/api/circles/${circleId}/complete-job`, {
    method: "POST",
    body: JSON.stringify({ jobId }),
  })

// Wallet
export const getWallet = (workerId: string) =>
  fetchAPI<any>(`/api/wallet/${workerId}`)

// Admin
export const getAdminStats = () => fetchAPI<any>("/api/admin/stats")
export const getActivity = () => fetchAPI<any[]>("/api/admin/activity")
