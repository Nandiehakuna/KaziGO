"use client"
import { useEffect, useState } from "react"
import { getAdminStats, getJobs, getWorkers } from "@/lib/api"
import { Users, Briefcase, Zap, Wallet, TrendingUp, Shield } from "lucide-react"
import ActivityFeed from "@/components/pillars/ActivityFeed"
import StatCard from "@/components/ui/StatCard"
import JobCard from "@/components/pillars/JobCard"
import WorkerCard from "@/components/pillars/WorkerCard"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAdminStats(), getJobs(), getWorkers()])
      .then(([s, j, w]) => {
        setStats(s)
        setJobs(j.slice(0, 4))
        setWorkers(w.slice(0, 4))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">KaziGo Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">The operating system for the informal African worker</p>
      </div>

      {/* Pillar Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Workers online"
          value={stats?.workers ?? "—"}
          sub="IMARA Identity"
          icon={<Users size={16} />}
          color="coral"
          loading={loading}
        />
        <StatCard
          label="Escrow locked"
          value={stats ? `KES ${(stats.totalEscrow || 0).toLocaleString()}` : "—"}
          sub="IMARA Shield"
          icon={<Shield size={16} />}
          color="green"
          loading={loading}
        />
        <StatCard
          label="Active circles"
          value={stats?.circles ?? "—"}
          sub="IMARA Circle"
          icon={<Zap size={16} />}
          color="purple"
          loading={loading}
        />
        <StatCard
          label="Jobs completed"
          value={stats?.completedJobs ?? "—"}
          sub="IMARA Wallet"
          icon={<TrendingUp size={16} />}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Recent Jobs</h2>
            <a href="/jobs" className="text-xs text-kazi-green hover:underline">View all →</a>
          </div>
          {loading
            ? Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
            : jobs.map(job => <JobCard key={job.id} job={job} />)
          }

          {/* Top Workers */}
          <div className="flex items-center justify-between mt-6">
            <h2 className="text-sm font-medium text-gray-900">Top Workers</h2>
            <a href="/workers" className="text-xs text-kazi-green hover:underline">View all →</a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {loading
              ? Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
              : workers.map(w => <WorkerCard key={w.id} worker={w} />)
            }
          </div>
        </div>

        {/* Live Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Live Activity</h2>
            <span className="flex items-center gap-1 text-xs text-kazi-green">
              <span className="w-1.5 h-1.5 bg-kazi-green rounded-full pulse-dot" />
              Live
            </span>
          </div>
          <ActivityFeed activities={stats?.recentActivity ?? []} loading={loading} />
        </div>
      </div>
    </div>
  )
}
