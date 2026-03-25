import { Job } from "@/types"
import { MapPin, DollarSign } from "lucide-react"

const statusConfig: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open", cls: "bg-blue-50 text-blue-700" },
  MATCHED: { label: "Matched", cls: "bg-purple-50 text-purple-700" },
  ESCROW_LOCKED: { label: "Escrow Locked", cls: "bg-kazi-green-light text-kazi-green-dark" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-amber-50 text-amber-700" },
  COMPLETED: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
  DISPUTED: { label: "Disputed", cls: "bg-red-50 text-red-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-100 text-gray-400" },
}

export default function JobCard({ job }: { job: Job }) {
  const status = statusConfig[job.status] || statusConfig.OPEN
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{job.description}</p>
        </div>
        <span className={`badge ${status.cls} ml-2 whitespace-nowrap`}>{status.label}</span>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={11} /> {job.location}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <DollarSign size={11} /> KES {job.budget?.toLocaleString()}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{job.skill}</span>
      </div>
      {job.worker && (
        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-kazi-green-light flex items-center justify-center text-[9px] font-medium text-kazi-green-dark">
            {job.worker.name?.charAt(0)}
          </div>
          <span className="text-xs text-gray-500">{job.worker.name}</span>
          <span className="text-xs text-kazi-green ml-auto">★ {job.worker.score?.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}
