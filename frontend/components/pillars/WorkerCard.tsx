import { Worker } from "@/types"
import { CheckCircle } from "lucide-react"

export default function WorkerCard({ worker }: { worker: Worker }) {
  const initials = worker.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
  const colors = ["bg-kazi-green-light text-kazi-green-dark", "bg-kazi-purple-light text-kazi-purple", "bg-kazi-coral-light text-kazi-coral", "bg-kazi-amber-light text-kazi-amber"]
  const color = colors[worker.name?.charCodeAt(0) % colors.length] || colors[0]

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${color}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-900 truncate">{worker.name}</span>
            {worker.verified && <CheckCircle size={12} className="text-kazi-green flex-shrink-0" />}
          </div>
          <span className="text-xs text-gray-500">{worker.skill}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="text-sm font-semibold text-kazi-green">{worker.score?.toFixed(1)}</div>
          <div className="text-[10px] text-gray-400">Score</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-700">{worker.totalJobs}</div>
          <div className="text-[10px] text-gray-400">Jobs</div>
        </div>
        <div className="text-center">
          <div className="text-[11px] font-medium text-gray-600 truncate max-w-16">{worker.location}</div>
          <div className="text-[10px] text-gray-400">Location</div>
        </div>
      </div>
    </div>
  )
}
