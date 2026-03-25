"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Briefcase, Users, Wallet,
  MessageCircle, Activity, Zap, Map, TrendingUp
} from "lucide-react"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, pillar: null },
  { href: "/jobs", label: "Jobs", icon: Briefcase, pillar: "shield" },
  { href: "/workers", label: "Workers", icon: Users, pillar: "identity" },
  { href: "/circles", label: "Circles", icon: Zap, pillar: "circle" },
  { href: "/wallet", label: "Wallet", icon: Wallet, pillar: "wallet" },
  { href: "/guide", label: "Guide", icon: MessageCircle, pillar: "guide" },
  { href: "/kaziscore", label: "KaziScore", icon: TrendingUp, pillar: "wallet" },
  { href: "/map", label: "Nearby Map", icon: Map, pillar: "identity" },
  { href: "/admin", label: "Live Panel", icon: Activity, pillar: null },
]

const pillarColors: Record<string, string> = {
  identity: "text-kazi-coral",
  shield: "text-kazi-green",
  circle: "text-kazi-purple",
  wallet: "text-kazi-amber",
  guide: "text-kazi-blue",
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-kazi-green rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">KG</span>
          </div>
          <div>
            <div className="text-base font-semibold tracking-wide text-gray-900">KaziGo</div>
            <div className="text-[10px] text-gray-400">Work. Earn. Rise. Together.</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, pillar }) => {
          const active = pathname === href
          const color = pillar ? pillarColors[pillar] : "text-gray-600"
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-kazi-green-light text-kazi-green-dark font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} className={active ? "text-kazi-green" : color} />
              {label}
              {href === "/admin" && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-kazi-green rounded-full pulse-dot" />
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* USSD hint */}
      <div className="p-3 m-3 bg-kazi-green-light rounded-lg">
        <div className="text-[10px] font-medium text-kazi-green-dark mb-1">Freelancer access</div>
        <div className="text-[11px] text-kazi-green font-mono font-medium">*384*5757#</div>
        <div className="text-[10px] text-gray-500 mt-0.5">Any phone · No internet</div>
      </div>
    </aside>
  )
}
