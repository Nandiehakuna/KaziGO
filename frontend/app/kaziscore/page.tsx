"use client"
import { useEffect, useState } from "react"
import { getWorkers } from "@/lib/api"
import { TrendingUp, Mic, Building, Star, CheckCircle } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const BANKS: Record<string, { name: string; product: string; rate: string; max: string }[]> = {
  Prime: [
    { name: "KCB Bank", product: "KCB M-Pesa Loan", rate: "8.64% p.a.", max: "KES 1,000,000" },
    { name: "Equity Bank", product: "Equitel Eazzy Loan", rate: "9% p.a.", max: "KES 500,000" },
    { name: "NCBA Bank", product: "Loop by NCBA", rate: "10% p.a.", max: "KES 750,000" },
    { name: "Stanbic Bank", product: "Personal Loan", rate: "12% p.a.", max: "KES 2,000,000" },
  ],
  Established: [
    { name: "Equity Bank", product: "Equitel Eazzy Loan", rate: "9% p.a.", max: "KES 200,000" },
    { name: "Co-op Bank", product: "MCo-opCash", rate: "14% p.a.", max: "KES 100,000" },
    { name: "Faulu Kenya", product: "Biashara Loan", rate: "18% p.a.", max: "KES 300,000" },
    { name: "KWFT", product: "Business Loan", rate: "18% p.a.", max: "KES 150,000" },
  ],
  Building: [
    { name: "M-Shwari", product: "M-Shwari Loan", rate: "7.5% per month", max: "KES 50,000" },
    { name: "KCB M-Pesa", product: "Fuliza", rate: "1.083% per day", max: "KES 10,000" },
    { name: "Branch", product: "Branch Loan", rate: "17-35% p.a.", max: "KES 70,000" },
    { name: "Tala", product: "Tala Loan", rate: "19-84% p.a.", max: "KES 30,000" },
  ],
}

function ScoreGauge({ score }: { score: number }) {
  const pct = ((score - 300) / 550) * 100
  const color = score >= 700 ? "#1D9E75" : score >= 500 ? "#BA7517" : "#E24B4A"
  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-48">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f0e8" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 251.2} 251.2`} style={{ transition: "stroke-dasharray 1s ease" }} />
        <text x="100" y="88" textAnchor="middle" fontSize="28" fontWeight="600" fill={color}>{score}</text>
        <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#888">out of 850</text>
      </svg>
      <div className="flex justify-between w-48 -mt-1 text-[9px] text-gray-400">
        <span>300</span><span>575</span><span>850</span>
      </div>
    </div>
  )
}

export default function KaziScorePage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [scores, setScores] = useState<Record<string, any>>({})
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkers().then(async w => {
      setWorkers(w)
      for (const worker of w) {
        const res = await fetch(`${API}/api/workers/${worker.id}/kaziscore`)
        const data = await res.json()
        setScores(prev => ({ ...prev, [worker.id]: data }))
      }
      if (w.length > 0) setSelected(w[0])
    }).finally(() => setLoading(false))
  }, [])

  const selectedScore = selected ? scores[selected.id] : null
  const banks = selectedScore ? BANKS[selectedScore.tier] || BANKS.Building : []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">KaziScore</h1>
        <p className="text-sm text-gray-500 mt-0.5">Credit identity for informal workers — built from real gig earnings</p>
      </div>

      {/* Explainer */}
      <div className="card p-5 mb-6 bg-kazi-green-light border-kazi-green border">
        <div className="flex items-start gap-4">
          <TrendingUp size={20} className="text-kazi-green mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-kazi-green-dark mb-1">Why KaziScore exists</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              50 million informal workers in Africa are locked out of bank loans — not because they lack income, but because banks have no way to verify it. KaziScore turns every completed job, every on-time delivery, and every saved shilling into a credit footprint that banks can trust. The longer a worker uses KaziGo, the stronger their financial identity becomes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Worker list */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Select a worker</p>
          {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />) :
            workers.map(w => {
              const ks = scores[w.id]
              return (
                <div key={w.id} onClick={() => setSelected(w)}
                  className={`card p-3 cursor-pointer hover:shadow-md transition-all ${selected?.id === w.id ? "ring-2 ring-kazi-green" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-kazi-green-light flex items-center justify-center text-xs font-bold text-kazi-green-dark">
                      {w.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{w.name}</p>
                      <p className="text-[10px] text-gray-400">{w.skill} · {w.location}</p>
                    </div>
                    {ks && (
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: ks.tier === "Prime" ? "#1D9E75" : ks.tier === "Established" ? "#BA7517" : "#E24B4A" }}>{ks.score}</p>
                        <p className="text-[9px] text-gray-400">{ks.tier}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          }
          {!loading && workers.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">No workers yet. Register via *384*17825#</div>
          )}
        </div>

        {/* Score detail */}
        {selected && selectedScore ? (
          <div className="space-y-4">
            <div className="card p-5 text-center">
              <h3 className="text-sm font-medium text-gray-900 mb-4">{selected.name}</h3>
              <ScoreGauge score={selectedScore.score} />
              <div className="mt-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  selectedScore.tier === "Prime" ? "bg-kazi-green-light text-kazi-green-dark" :
                  selectedScore.tier === "Established" ? "bg-kazi-amber-light text-kazi-amber" :
                  "bg-red-50 text-red-700"}`}>
                  {selectedScore.tier} borrower
                </span>
              </div>
            </div>

            {/* Score factors */}
            <div className="card p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Score factors</p>
              {[
                { label: "Earnings consistency", pct: Math.min(100, (selected.totalJobs * 15)), color: "bg-kazi-green" },
                { label: "Job completion", pct: selected.totalJobs > 0 ? 85 : 0, color: "bg-kazi-purple" },
                { label: "Client ratings", pct: (selected.score / 5) * 100, color: "bg-kazi-amber" },
                { label: "Platform tenure", pct: 30, color: "bg-kazi-blue" },
                { label: "Circle savings", pct: 0, color: "bg-kazi-coral" },
              ].map(f => (
                <div key={f.label} className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>{f.label}</span><span>{Math.round(f.pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-400">
            <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select a worker to view their KaziScore</p>
          </div>
        )}

        {/* Bank recommendations */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Recommended loan products</p>
          {banks.length > 0 ? (
            <div className="space-y-3">
              {banks.map((bank, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-kazi-blue-light flex items-center justify-center flex-shrink-0">
                      <Building size={14} className="text-kazi-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{bank.name}</p>
                      <p className="text-[11px] text-gray-500">{bank.product}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-kazi-green font-medium">{bank.rate}</span>
                        <span className="text-[10px] text-gray-400">Up to {bank.max}</span>
                      </div>
                    </div>
                    {i === 0 && <span className="text-[9px] bg-kazi-green-light text-kazi-green-dark px-1.5 py-0.5 rounded-full">Best match</span>}
                  </div>
                </div>
              ))}
              <div className="card p-3 bg-kazi-purple-light border-kazi-purple border">
                <p className="text-[10px] text-kazi-purple leading-relaxed">
                  <strong className="font-medium">Coming soon:</strong> KaziGo will submit your verified earnings report directly to partner banks — no paperwork, no branch visits.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs card p-6">Select a worker to see loan recommendations</div>
          )}
        </div>
      </div>
    </div>
  )
}
