"use client"
import { useEffect, useState } from "react"
import { getActivity } from "@/lib/api"
import { ActivityLog } from "@/types"

const pillarConfig: Record<string, { color: string; dot: string }> = {
  identity: { color: "text-kazi-coral", dot: "bg-kazi-coral" },
  shield: { color: "text-kazi-green", dot: "bg-kazi-green" },
  circle: { color: "text-kazi-purple", dot: "bg-kazi-purple" },
  wallet: { color: "text-kazi-amber", dot: "bg-kazi-amber" },
  guide: { color: "text-kazi-blue", dot: "bg-kazi-blue" },
}

const typeEmoji: Record<string, string> = {
  ussd: "📱",
  sms: "💬",
  payment: "💰",
  guide: "🤖",
  circle: "⚡",
  airtime: "📶",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

interface Props {
  activities?: ActivityLog[]
  loading?: boolean
  autoRefresh?: boolean
}

export default function ActivityFeed({ activities: initial = [], loading, autoRefresh }: Props) {
  const [activities, setActivities] = useState<ActivityLog[]>(initial)

  useEffect(() => {
    if (initial.length) setActivities(initial)
  }, [initial])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(async () => {
      try {
        const data = await getActivity()
        setActivities(data)
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="card p-4 space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex gap-3 items-start animate-pulse">
            <div className="w-2 h-2 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
      {activities.length === 0 && (
        <div className="p-8 text-center text-sm text-gray-400">
          No activity yet.<br />
          <span className="text-xs">Start a USSD session to see live data.</span>
        </div>
      )}
      {activities.map((a) => {
        const cfg = pillarConfig[a.pillar] || pillarConfig.shield
        return (
          <div key={a.id} className="flex gap-3 items-start p-3 hover:bg-gray-50 transition-colors">
            <span className="text-sm mt-0.5 flex-shrink-0">{typeEmoji[a.type] || "•"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 leading-relaxed">{a.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-medium uppercase tracking-wide ${cfg.color}`}>
                  {a.pillar}
                </span>
                {a.phone && (
                  <span className="text-[10px] text-gray-400 font-mono">{a.phone.slice(-4).padStart(a.phone.length, "•")}</span>
                )}
                <span className="text-[10px] text-gray-300 ml-auto">{timeAgo(a.createdAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
