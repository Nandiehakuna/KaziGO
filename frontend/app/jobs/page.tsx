"use client"
import { useEffect, useState } from "react"
import { getJobs, createJob, completeJob, lockEscrow } from "@/lib/api"
import { Plus, Lock, CheckCircle, MessageCircle, Edit2, Phone, Send, X } from "lucide-react"

const SKILLS = ["Tailoring", "Graphic Design", "Tutoring", "Plumbing", "Catering", "Cleaning", "Photography", "Writing", "Other"]
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const statusConfig: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open", cls: "bg-blue-50 text-blue-700" },
  MATCHED: { label: "Matched", cls: "bg-purple-50 text-purple-700" },
  ESCROW_LOCKED: { label: "Escrow Locked", cls: "bg-kazi-green-light text-kazi-green-dark" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-amber-50 text-amber-700" },
  COMPLETED: { label: "Completed", cls: "bg-gray-100 text-gray-500" },
  DISPUTED: { label: "Disputed", cls: "bg-red-50 text-red-700" },
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMsg, setSendingMsg] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [form, setForm] = useState({
    title: "", description: "", skill: "Tailoring", location: "",
    budget: "", clientPhone: "", clientName: ""
  })

  const load = () => getJobs().then(setJobs).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const loadMessages = async (jobId: string) => {
    const res = await fetch(`${API}/api/jobs/${jobId}/messages`)
    const data = await res.json()
    setMessages(data)
  }

  const selectJob = (job: any) => {
    setSelectedJob(job)
    loadMessages(job.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedJob) return
    setSendingMsg(true)
    try {
      await fetch(`${API}/api/jobs/${selectedJob.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderType: "client", senderName: "Client", message: newMessage }),
      })
      setNewMessage("")
      await loadMessages(selectedJob.id)
    } finally { setSendingMsg(false) }
  }

  const saveEdit = async () => {
    if (!editingJob) return
    await fetch(`${API}/api/jobs/${editingJob.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingJob.title, description: editingJob.description, budget: editingJob.budget }),
    })
    setEditingJob(null)
    load()
  }

  const triggerDisputeCall = async (jobId: string) => {
    await fetch(`${API}/voice/dispute-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    })
    alert("Dispute mediation voice calls initiated to both parties.")
    load()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const jobResult = await createJob(form)
      setShowForm(false)
      setForm({ title: "", description: "", skill: "Tailoring", location: "", budget: "", clientPhone: "", clientName: "" })
      load()
      // Play voice alert in browser — the wow moment
      try {
        const workers = jobResult?.matchedWorkers || 0
        if (workers > 0) {
          const msg = `Hello! This is KaziGo. You have a new ${form.skill} job in ${form.location}. K E S ${parseInt(form.budget).toLocaleString()} secured in escrow. Dial star 384 to accept.`
          const audio = new Audio(`${API}/voice/preview?text=${encodeURIComponent(msg)}`)
          audio.play().catch(() => {}) // silent fail if browser blocks autoplay
        }
      } catch {}
    } finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Post work · Lock escrow · Message workers · Resolve disputes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Post a Job
        </button>
      </div>

      {/* Post job form */}
      {showForm && (
        <div className="card p-5 mb-6 border-kazi-green border">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Post a new job</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Job title</label>
              <input className="input" placeholder="e.g. Dress alterations x3" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <textarea className="input" rows={2} placeholder="Describe the work needed..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Skill needed</label>
              <select className="input" value={form.skill} onChange={e => setForm(f => ({ ...f, skill: e.target.value }))}>
                {SKILLS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Location</label>
              <input className="input" placeholder="e.g. Westlands, Nairobi" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Budget (KES)</label>
              <input className="input" type="number" placeholder="1200" value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Your name</label>
              <input className="input" placeholder="Your name" value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Your phone</label>
              <input className="input" placeholder="+254712345678" value={form.clientPhone}
                onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} required />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? "Posting..." : "Post Job — Alert Freelancers (SMS + Voice)"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Jobs list */}
        <div className="space-y-3">
          {loading
            ? Array(3).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)
            : jobs.map(job => {
              const st = statusConfig[job.status] || statusConfig.OPEN
              return (
                <div key={job.id}
                  onClick={() => selectJob(job)}
                  className={`card p-4 cursor-pointer hover:shadow-md transition-all ${selectedJob?.id === job.id ? "ring-2 ring-kazi-green" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      {editingJob?.id === job.id ? (
                        <div className="space-y-1" onClick={e => e.stopPropagation()}>
                          <input className="input text-sm" value={editingJob.title}
                            onChange={e => setEditingJob((j: any) => ({ ...j, title: e.target.value }))} />
                          <input className="input text-xs" type="number" value={editingJob.budget}
                            onChange={e => setEditingJob((j: any) => ({ ...j, budget: e.target.value }))} />
                          <div className="flex gap-1 mt-1">
                            <button onClick={saveEdit} className="text-xs bg-kazi-green text-white px-2 py-1 rounded">Save</button>
                            <button onClick={() => setEditingJob(null)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-medium text-gray-900 truncate">{job.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{job.description}</p>
                        </>
                      )}
                    </div>
                    <span className={`badge text-[10px] whitespace-nowrap ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span>📍 {job.location}</span>
                    <span>KES {job.budget?.toLocaleString()}</span>
                    <span className="ml-auto text-gray-400">{job.skill}</span>
                  </div>

                  {job.worker && (
                    <div className="flex items-center gap-2 py-2 border-t border-gray-50">
                      <div className="w-5 h-5 rounded-full bg-kazi-green-light flex items-center justify-center text-[9px] font-bold text-kazi-green-dark">
                        {job.worker.name?.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-600">{job.worker.name}</span>
                      <span className="text-xs text-kazi-green ml-auto">★ {job.worker.score?.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-1.5 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    {job.status === "OPEN" || job.status === "MATCHED" ? (
                      <button onClick={() => lockEscrow(job.id).then(load)}
                        className="flex items-center gap-1 text-[10px] bg-kazi-green-light text-kazi-green-dark px-2 py-1 rounded-lg hover:bg-kazi-green hover:text-white transition-colors">
                        <Lock size={10} /> Lock Escrow
                      </button>
                    ) : null}
                    {(job.status === "ESCROW_LOCKED" || job.status === "IN_PROGRESS") ? (
                      <button onClick={() => completeJob(job.id).then(load)}
                        className="flex items-center gap-1 text-[10px] bg-kazi-amber-light text-kazi-amber px-2 py-1 rounded-lg hover:bg-kazi-amber hover:text-white transition-colors">
                        <CheckCircle size={10} /> Mark Complete
                      </button>
                    ) : null}
                    {job.status !== "COMPLETED" && job.status !== "DISPUTED" ? (
                      <>
                        <button onClick={() => setEditingJob({ ...job })}
                          className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                          <Edit2 size={10} /> Edit
                        </button>
                        <button onClick={() => triggerDisputeCall(job.id)}
                          className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors">
                          <Phone size={10} /> Dispute Call
                        </button>
                      </>
                    ) : null}
                    <button onClick={() => selectJob(job)}
                      className="flex items-center gap-1 text-[10px] bg-kazi-purple-light text-kazi-purple px-2 py-1 rounded-lg hover:bg-kazi-purple hover:text-white transition-colors ml-auto">
                      <MessageCircle size={10} /> {job.messages?.length || 0} msgs
                    </button>
                  </div>
                </div>
              )
            })}
          {!loading && jobs.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No jobs yet.</p>
              <p className="text-xs mt-1">Post your first job above.</p>
            </div>
          )}
        </div>

        {/* Message panel */}
        <div className="sticky top-6">
          {selectedJob ? (
            <div className="card flex flex-col" style={{ height: "560px" }}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{selectedJob.title}</h3>
                  <p className="text-xs text-gray-500">Negotiation & updates</p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No messages yet.</p>
                    <p className="text-[10px] mt-1">Start the conversation below.</p>
                  </div>
                ) : messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.senderType === "client" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-xl text-xs ${msg.senderType === "client" ? "bg-kazi-green text-white" : "bg-gray-100 text-gray-800"}`}>
                      <div className="font-medium mb-0.5 text-[10px] opacity-75">{msg.senderName}</div>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="Message the worker... (sends SMS)"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} disabled={sendingMsg || !newMessage.trim()}
                  className="bg-kazi-green text-white p-2 rounded-lg hover:bg-kazi-green-dark transition-colors disabled:opacity-50">
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400" style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div>
                <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a job</p>
                <p className="text-xs mt-1">to view messages and manage escrow</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
