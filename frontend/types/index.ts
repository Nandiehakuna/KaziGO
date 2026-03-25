// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Worker {
  id: string
  phone: string
  name: string
  skill: string
  location: string
  verified: boolean
  score: number
  totalJobs: number
  createdAt: string
}

export interface Client {
  id: string
  phone: string
  name: string
  email?: string
  createdAt: string
}

export type JobStatus =
  | "OPEN"
  | "MATCHED"
  | "ESCROW_LOCKED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED"

export interface Job {
  id: string
  title: string
  description: string
  skill: string
  location: string
  budget: number
  status: JobStatus
  escrowLocked: boolean
  escrowAmount: number
  clientId: string
  workerId?: string
  client?: Client
  worker?: Worker
  createdAt: string
  completedAt?: string
}

// ─── Circle Types ─────────────────────────────────────────────────────────────

export type CircleRole = "LEAD" | "MEMBER"

export interface CircleMember {
  id: string
  circleId: string
  workerId: string
  role: CircleRole
  splitPct: number
  worker: Worker
}

export interface Circle {
  id: string
  name: string
  skill: string
  collectiveScore: number
  savingsPool: number
  savingsPct: number
  members: CircleMember[]
  createdAt: string
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────

export type WalletEntryType = "EARNING" | "SAVINGS" | "WITHDRAWAL" | "BONUS"

export interface WalletEntry {
  id: string
  workerId: string
  amount: number
  type: WalletEntryType
  description: string
  jobId?: string
  createdAt: string
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string
  type: string
  pillar: string
  message: string
  phone?: string
  metadata?: string
  createdAt: string
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  workers: number
  jobs: number
  activeJobs: number
  completedJobs: number
  circles: number
  totalEscrow: number
  recentActivity: ActivityLog[]
}
