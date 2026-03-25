"use client"
import { useEffect, useState } from "react"
import { getWorkers } from "@/lib/api"
import { CheckCircle, Star, Briefcase, MapPin, Phone, Search, TrendingUp, Mic } from "lucide-react"

const SKILLS = ["All", "Tailoring", "Graphic Design", "Tutoring", "Plumbing", "Catering", "Other"]
const avatarColors = [
  "bg-kazi-green-light text-kazi-green-dark",
  "bg-kazi-purple-light text-kazi-purple",
  "bg-kazi-coral-light text-kazi-coral",
  "bg-kazi-amber-light text-kazi-amber",
  "bg-kazi-blue-light text-kazi-blue",
]

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function KaziScoreBadge({ score, tier }: { score: number; tier: string }) {
  const colors: Record<string, string> = {
    Prime: "bg-kazi-green-light text-kazi-green-dark border-kazi-green",
    Established: "bg-kazi-amber-light text-kazi-amber border-kazi-amber",
    Building: "bg-red-50 text-red-700 border-red-200",
  }
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${colors[tier] || colors.Building}`}>
      <TrendingUp size={11} />
      KaziScore {score} · {tier}
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 5) * 100
  const color = score >= 4.5 ? "bg-kazi-green" : score >= 3.5 ? "bg-kazi-amber" : "bg-red-400"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700">{score?.toFixed(1)}</span>
    </div>
  )
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [kaziScores, setKaziScores] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [skillFilter, setSkillFilter] = useState("All")
  const [selected, setSelected] = useState<any>(null)
  const [callingGuide, setCallingGuide] = useState(false)

  useEffect(() => {
    getWorkers().then(w => {
      setWorkers(w)
      setFiltered(w)
      // Fetch KaziScore for each worker
      w.forEach(async (worker: any) => {
        try {
          const res = await fetch(`${API}/api/workers/${worker.id}/kaziscore`)
          const data = await res.json()
          setKaziScores(prev => ({ ...prev, [worker.id]: data }))
        } catch {}
      })
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = workers
    if (search) result = result.filter((w: any) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase())
    )
    if (skillFilter !== "All") result = result.filter((w: any) => w.skill === skillFilter)
    setFiltered(result)
  }, [search, skillFilter, workers])

  const triggerGuideCall = async (workerId: string) => {
    setCallingGuide(true)
    try {
      await fetch(`${API}/voice/guide-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, question: "general_advice" }),
      })
      alert("Guide voice call initiated! The worker will receive a call shortly.")
    } catch {
      alert("Voice call failed — check ElevenLabs API key in .env")
    } finally {
      setCallingGuide(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Workers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Verified identities — KaziScore builds with every job</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-kazi-coral">{workers.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Registered workers</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-kazi-green">{workers.filter((w: any) => w.verified).length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Verified</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-kazi-amber">
            {Object.values(kaziScores).length > 0
              ? Math.round(Object.values(kaziScores).reduce((s: any, k: any) => s + k.score, 0) / Object.values(kaziScores).length)
              : "—"}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Avg KaziScore</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8" placeholder="Search by name or location..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SKILLS.map(s => (
            <button key={s} onClick={() => setSkillFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${skillFilter === s ? "bg-kazi-green text-white border-kazi-green" : "bg-white text-gray-600 border-gray-200 hover:border-kazi-green"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Workers grid */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No workers found.</p>
              <p className="text-xs mt-1">Workers register via *384*17825#</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((w: any) => {
                const initials = w.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                const color = avatarColors[w.name.charCodeAt(0) % avatarColors.length]
                const ks = kaziScores[w.id]
                return (
                  <div key={w.id} onClick={() => setSelected(selected?.id === w.id ? null : w)}
                    className={`card p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === w.id ? "ring-2 ring-kazi-green" : ""}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${color}`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-900 truncate">{w.name}</span>
                          {w.verified && <CheckCircle size={12} className="text-kazi-green flex-shrink-0" />}
                        </div>
                        <span className="text-xs text-kazi-purple bg-kazi-purple-light px-2 py-0.5 rounded-full">{w.skill}</span>
                      </div>
                    </div>
                    <ScoreBar score={w.score} />
                    {ks && (
                      <div className="mt-2">
                        <KaziScoreBadge score={ks.score} tier={ks.tier} />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} /> {w.location}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Briefcase size={11} /> {w.totalJobs} jobs</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div className="card p-5 sticky top-6">
              <div className="text-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2 ${avatarColors[selected.name.charCodeAt(0) % avatarColors.length]}`}>
                  {selected.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{selected.name}</h3>
                {selected.verified && <span className="inline-flex items-center gap-1 text-xs text-kazi-green mt-1"><CheckCircle size={11} /> Verified</span>}
              </div>

              {/* KaziScore */}
              {kaziScores[selected.id] && (
                <div className="rounded-xl p-4 mb-4 text-center" style={{ background: kaziScores[selected.id].tier === "Prime" ? "#E1F5EE" : kaziScores[selected.id].tier === "Established" ? "#FAEEDA" : "#FCEBEB" }}>
                  <div className="text-3xl font-bold" style={{ color: kaziScores[selected.id].tier === "Prime" ? "#085041" : kaziScores[selected.id].tier === "Established" ? "#633806" : "#A32D2D" }}>
                    {kaziScores[selected.id].score}
                  </div>
                  <div className="text-xs mt-0.5 font-medium">KaziScore · {kaziScores[selected.id].tier}</div>
                  <div className="text-[10px] mt-2 opacity-75">Recommended: {kaziScores[selected.id].banks}</div>
                </div>
              )}

              <div className="space-y-3 mb-4">
                {[
                  { icon: <Briefcase size={13} />, label: "Skill", value: selected.skill },
                  { icon: <MapPin size={13} />, label: "Location", value: selected.location },
                  { icon: <Star size={13} />, label: "Jobs done", value: `${selected.totalJobs} completed` },
                  { icon: <Phone size={13} />, label: "Phone", value: selected.phone },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-gray-400">{row.icon}</span>
                    <div>
                      <div className="text-[10px] text-gray-400">{row.label}</div>
                      <div className="text-xs font-medium text-gray-700">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <a href="/jobs" className="btn-primary w-full text-center block">
                  Hire {selected.name.split(" ")[0]}
                </a>
                <button
                  onClick={() => triggerGuideCall(selected.id)}
                  disabled={callingGuide}
                  className="w-full flex items-center justify-center gap-2 text-xs bg-kazi-purple-light text-kazi-purple px-4 py-2 rounded-lg hover:bg-kazi-purple hover:text-white transition-colors disabled:opacity-50"
                >
                  <Mic size={13} />
                  {callingGuide ? "Calling..." : "Send Guide Voice Call"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center text-gray-400 sticky top-6">
              <TrendingUp size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a worker</p>
              <p className="text-xs mt-1">to view KaziScore + loan matches</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
