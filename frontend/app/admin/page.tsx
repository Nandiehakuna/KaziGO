"use client"
import { useEffect, useState } from "react"
import { getAdminStats, getWorkers, getJobs, getCircles } from "@/lib/api"
import ActivityFeed from "@/components/pillars/ActivityFeed"
import { Users, Briefcase, Zap, Shield, MessageCircle, Wifi } from "lucide-react"

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [circles, setCircles] = useState<any[]>([])
  const [tick, setTick] = useState(0)

  const refresh = async () => {
    try {
      const [s, w, j, c] = await Promise.all([getAdminStats(), getWorkers(), getJobs(), getCircles()])
      setStats(s)
      setWorkers(w)
      setJobs(j)
      setCircles(c)
    } catch {}
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(() => {
      refresh()
      setTick(t => t + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const pillars = [
    { label: "Identity", icon: <Users size={14} />, value: `${workers.length} workers`, color: "text-kazi-coral bg-kazi-coral-light", api: "USSD · SMS" },
    { label: "Shield", icon: <Shield size={14} />, value: `KES ${(stats?.totalEscrow || 0).toLocaleString()} locked`, color: "text-kazi-green bg-kazi-green-light", api: "Payments · Voice" },
    { label: "Circle", icon: <Zap size={14} />, value: `${circles.length} chamas`, color: "text-kazi-purple bg-kazi-purple-light", api: "USSD · SMS" },
    { label: "Wallet", icon: <Briefcase size={14} />, value: `${stats?.completedJobs || 0} paid out`, color: "text-kazi-amber bg-kazi-amber-light", api: "Payments · Airtime" },
    { label: "Guide", icon: <MessageCircle size={14} />, value: "AI via SMS", color: "text-kazi-blue bg-kazi-blue-light", api: "Claude · Chat" },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Live Platform Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time view of all KaziGo activity — all 5 pillars</p>
        </div>
        <div className="flex items-center gap-2 bg-kazi-green-light text-kazi-green-dark px-3 py-1.5 rounded-full text-xs font-medium">
          <Wifi size={12} className="pulse-dot" />
          Live · refreshes every 3s
        </div>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Workers online", value: workers.length, color: "text-kazi-coral" },
          { label: "Active jobs", value: stats?.activeJobs || 0, color: "text-kazi-green" },
          { label: "Circles", value: circles.length, color: "text-kazi-purple" },
          { label: "Total escrow (KES)", value: (stats?.totalEscrow || 0).toLocaleString(), color: "text-kazi-amber" },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 5 Pillars status */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {pillars.map(p => (
          <div key={p.label} className="card p-3 text-center">
            <div className={`inline-flex p-2 rounded-lg ${p.color} mb-2`}>{p.icon}</div>
            <div className="text-xs font-semibold text-gray-900">{p.label}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{p.value}</div>
            <div className="text-[10px] text-gray-300 mt-1 font-mono">{p.api}</div>
            <div className="w-2 h-2 bg-kazi-green rounded-full mx-auto mt-2 pulse-dot" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Africa&apos;s Talking API calls — live</h2>
            <span className="text-xs text-gray-400">tick #{tick}</span>
          </div>
          <ActivityFeed activities={stats?.recentActivity || []} autoRefresh />
        </div>

        {/* Workers + Jobs summary */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Registered Workers</h3>
            <div className="space-y-2">
              {workers.slice(0, 5).map((w: any) => (
                <div key={w.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-kazi-green-light flex items-center justify-center text-[10px] font-bold text-kazi-green-dark">
                    {w.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{w.name}</p>
                    <p className="text-[10px] text-gray-400">{w.skill}</p>
                  </div>
                  <span className="text-xs font-medium text-kazi-green">★ {w.score?.toFixed(1)}</span>
                </div>
              ))}
              {workers.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No workers yet — dial *384*5757#</p>}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Job Pipeline</h3>
            {["OPEN", "ESCROW_LOCKED", "COMPLETED"].map(status => {
              const count = jobs.filter((j: any) => j.status === status).length
              const colors: Record<string, string> = { OPEN: "bg-blue-100 text-blue-700", ESCROW_LOCKED: "bg-kazi-green-light text-kazi-green-dark", COMPLETED: "bg-gray-100 text-gray-500" }
              const labels: Record<string, string> = { OPEN: "Open", ESCROW_LOCKED: "In Escrow", COMPLETED: "Done" }
              return (
                <div key={status} className="flex items-center justify-between py-1.5">
                  <span className={`badge ${colors[status]}`}>{labels[status]}</span>
                  <span className="text-sm font-semibold text-gray-700">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
