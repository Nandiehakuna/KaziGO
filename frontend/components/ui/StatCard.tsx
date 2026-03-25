import { ReactNode } from "react"

const colorMap = {
  green: { bg: "bg-kazi-green-light", text: "text-kazi-green-dark", icon: "text-kazi-green" },
  coral: { bg: "bg-kazi-coral-light", text: "text-kazi-coral", icon: "text-kazi-coral" },
  purple: { bg: "bg-kazi-purple-light", text: "text-kazi-purple", icon: "text-kazi-purple" },
  amber: { bg: "bg-kazi-amber-light", text: "text-kazi-amber", icon: "text-kazi-amber" },
  blue: { bg: "bg-kazi-blue-light", text: "text-kazi-blue", icon: "text-kazi-blue" },
}

interface Props {
  label: string
  value: string | number
  sub: string
  icon: ReactNode
  color: keyof typeof colorMap
  loading?: boolean
}

export default function StatCard({ label, value, sub, icon, color, loading }: Props) {
  const c = colorMap[color]
  if (loading) return <div className="stat-card animate-pulse h-24 bg-gray-100" />
  return (
    <div className="stat-card p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`p-1.5 rounded-lg ${c.bg} ${c.icon}`}>{icon}</span>
      </div>
      <div className={`text-2xl font-semibold ${c.text}`}>{value}</div>
      <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
    </div>
  )
}
