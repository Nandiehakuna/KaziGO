"use client"
import { useEffect, useState } from "react"
import { getCircles } from "@/lib/api"
import { Circle } from "@/types"
import { Zap, Users, PiggyBank, Star } from "lucide-react"

export default function CirclesPage() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCircles().then(setCircles).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">IMARA Circles</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gig chamas — bid, earn and save collectively</p>
      </div>

      {/* Explainer */}
      <div className="card p-5 mb-6 bg-kazi-purple-light border-kazi-purple border">
        <div className="flex items-start gap-4">
          <Zap size={20} className="text-kazi-purple mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-kazi-purple mb-1">How Circles work</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              A Circle is a digital chama for gig workers. Members form a group, bid on bigger jobs together,
              and earnings split automatically on completion. A 5% savings pool builds over time for emergencies.
              Freelancers create Circles by dialing <span className="font-mono font-medium">*384*5757# → My Circle → Create</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Circles grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(2).fill(0).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : circles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Zap size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No circles yet.</p>
          <p className="text-xs mt-1">Freelancers create circles via USSD: *384*5757# → My Circle</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {circles.map(circle => (
            <div key={circle.id} className="card p-5 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{circle.name}</h3>
                  <span className="text-xs text-kazi-purple bg-kazi-purple-light px-2 py-0.5 rounded-full mt-1 inline-block">
                    {circle.skill}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-kazi-green">{circle.collectiveScore.toFixed(1)}</div>
                  <div className="text-[10px] text-gray-400">Circle Score</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-1"><Users size={14} className="text-gray-400" /></div>
                  <div className="text-sm font-medium text-gray-700">{circle.members?.length || 0}</div>
                  <div className="text-[10px] text-gray-400">Members</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-1"><PiggyBank size={14} className="text-kazi-amber" /></div>
                  <div className="text-sm font-medium text-kazi-amber">KES {circle.savingsPool.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">Savings Pool</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-1"><Star size={14} className="text-kazi-purple" /></div>
                  <div className="text-sm font-medium text-kazi-purple">{circle.savingsPct}%</div>
                  <div className="text-[10px] text-gray-400">Auto-save</div>
                </div>
              </div>

              {/* Members */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Members</p>
                <div className="flex flex-wrap gap-2">
                  {circle.members?.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2.5 py-1">
                      <div className="w-4 h-4 rounded-full bg-kazi-green-light flex items-center justify-center text-[8px] font-bold text-kazi-green-dark">
                        {m.worker?.name?.charAt(0)}
                      </div>
                      <span className="text-[11px] text-gray-700">{m.worker?.name?.split(" ")[0]}</span>
                      {m.role === "LEAD" && <span className="text-[9px] text-kazi-purple font-medium">Lead</span>}
                      <span className="text-[10px] text-gray-400">{m.splitPct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circle code */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">Circle code: </span>
                <span className="text-[11px] font-mono font-medium text-gray-600">
                  KAZIGO-{circle.id.substring(0, 6).toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
