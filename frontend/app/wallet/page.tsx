"use client"
import { useEffect, useState } from "react"
import { getWorkers, getWallet } from "@/lib/api"
import { Worker, WalletEntry } from "@/types"
import { TrendingUp, PiggyBank, ArrowDownLeft, Search } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  EARNING: { label: "Earned", color: "text-kazi-green", bg: "bg-kazi-green-light" },
  SAVINGS: { label: "Saved", color: "text-kazi-purple", bg: "bg-kazi-purple-light" },
  WITHDRAWAL: { label: "Withdrawn", color: "text-kazi-amber", bg: "bg-kazi-amber-light" },
  BONUS: { label: "Bonus", color: "text-kazi-blue", bg: "bg-kazi-blue-light" },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function WalletPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selected, setSelected] = useState<Worker | null>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    getWorkers().then(w => {
      setWorkers(w)
      if (w.length > 0) loadWallet(w[0])
    })
  }, [])

  const loadWallet = async (worker: Worker) => {
    setSelected(worker)
    setLoading(true)
    try {
      const data = await getWallet(worker.id)
      setWallet(data)
    } finally {
      setLoading(false)
    }
  }

  // Build chart data from entries
  const chartData = wallet?.entries
    ? (() => {
        const byDay: Record<string, number> = {}
        wallet.entries.filter((e: WalletEntry) => e.type === "EARNING").forEach((e: WalletEntry) => {
          const day = new Date(e.createdAt).toLocaleDateString("en-KE", { weekday: "short" })
          byDay[day] = (byDay[day] || 0) + e.amount
        })
        return Object.entries(byDay).map(([day, amount]) => ({ day, amount }))
      })()
    : []

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500 mt-0.5">IMARA Wallet — earnings history and financial identity</p>
      </div>

      <div className="flex gap-5">
        {/* Worker selector */}
        <div className="w-56 flex-shrink-0">
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 text-xs"
              placeholder="Find worker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            {filteredWorkers.map(w => (
              <button
                key={w.id}
                onClick={() => loadWallet(w)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  selected?.id === w.id ? "bg-kazi-green-light text-kazi-green-dark" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-kazi-green-light flex items-center justify-center text-[10px] font-bold text-kazi-green-dark flex-shrink-0">
                  {w.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{w.name}</p>
                  <p className="text-[10px] text-gray-400">{w.skill}</p>
                </div>
              </button>
            ))}
            {workers.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No workers yet</p>
            )}
          </div>
        </div>

        {/* Wallet content */}
        <div className="flex-1">
          {!selected ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">Select a worker to view their wallet</p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="card p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <TrendingUp size={16} className="text-kazi-green" />
                  </div>
                  <div className="text-2xl font-bold text-kazi-green">
                    KES {(wallet?.totalEarnings || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Total earned</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <PiggyBank size={16} className="text-kazi-purple" />
                  </div>
                  <div className="text-2xl font-bold text-kazi-purple">
                    KES {(wallet?.totalSavings || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Total saved</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <ArrowDownLeft size={16} className="text-kazi-amber" />
                  </div>
                  <div className="text-2xl font-bold text-kazi-amber">
                    {wallet?.entries?.filter((e: WalletEntry) => e.type === "EARNING").length || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Payments received</div>
                </div>
              </div>

              {/* Earnings chart */}
              {chartData.length > 0 && (
                <div className="card p-4 mb-5">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Earnings by day</h3>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(v: any) => [`KES ${v.toLocaleString()}`, "Earned"]}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e5e7eb" }}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {chartData.map((_: any, i: number) => (
                            <Cell key={i} fill="#1D9E75" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Transaction history */}
              <div className="card">
                <div className="p-4 border-b border-gray-50">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction history</h3>
                </div>
                {wallet?.entries?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No transactions yet.<br />
                    <span className="text-xs">Complete jobs to build earnings history.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {wallet?.entries?.map((entry: WalletEntry) => {
                      const cfg = typeConfig[entry.type]
                      return (
                        <div key={entry.id} className="flex items-center gap-3 p-4">
                          <div className={`p-2 rounded-lg ${cfg.bg}`}>
                            <TrendingUp size={13} className={cfg.color} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{entry.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${cfg.color}`}>
                              +KES {entry.amount.toLocaleString()}
                            </p>
                            <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Financial identity note */}
              <div className="mt-4 p-4 bg-kazi-purple-light rounded-xl border border-kazi-purple border-opacity-20">
                <p className="text-xs text-kazi-purple font-medium mb-1">IMARA Financial Identity</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selected.name}'s earnings history is building a financial identity that didn't exist before.
                  {wallet?.totalEarnings > 0
                    ? ` KES ${wallet.totalEarnings.toLocaleString()} in verified income — this becomes their credit footprint.`
                    : " Complete jobs to start building a verifiable income record."}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
