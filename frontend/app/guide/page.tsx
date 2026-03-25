"use client"
import { useState } from "react"
import { MessageCircle, Send, Phone, Zap } from "lucide-react"

const QUICK_QUESTIONS = [
  { label: "How to price my work", trigger: "pricing", emoji: "💰" },
  { label: "Write a winning proposal", trigger: "proposal_writing", emoji: "✍️" },
  { label: "Handle a difficult client", trigger: "dispute_handling", emoji: "🤝" },
  { label: "Spot and avoid scams", trigger: "scam_awareness", emoji: "🛡️" },
  { label: "Tips for my first job", trigger: "first_job", emoji: "🚀" },
  { label: "Manage my earnings", trigger: "payment_received", emoji: "📊" },
]

interface Message {
  role: "user" | "guide"
  text: string
  time: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function GuidePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "guide",
      text: "Habari! I'm KaziGo Guide — your personal business mentor. I'm here to help you earn more, work smarter, and stay safe. What would you like to know today?",
      time: "now",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [workerPhone, setWorkerPhone] = useState("")

  const now = () => new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })

  const askGuide = async (question: string) => {
    if (!question.trim()) return
    setLoading(true)

    const userMsg: Message = { role: "user", text: question, time: now() }
    setMessages(prev => [...prev, userMsg])
    setInput("")

    try {
      const res = await fetch(`${API_URL}/api/guide/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          phone: workerPhone || "+254000000000",
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "guide", text: data.advice, time: now() }])
    } catch {
      setMessages(prev => [...prev, {
        role: "guide",
        text: "Keep going! Every job you complete builds your reputation. Deliver quality work, communicate clearly with your client, and always confirm payment terms before you start.",
        time: now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">KaziGo Guide</h1>
        <p className="text-sm text-gray-500 mt-0.5">IMARA Guide — AI business mentor, available via SMS or web</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Chat */}
        <div className="col-span-2 card flex flex-col" style={{ height: "600px" }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-kazi-blue-light flex items-center justify-center">
              <MessageCircle size={16} className="text-kazi-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">KaziGo Guide</p>
              <p className="text-xs text-kazi-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-kazi-green rounded-full inline-block" />
                Powered by Claude AI
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
              <Phone size={11} />
              Also available via SMS
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "guide" && (
                  <div className="w-7 h-7 rounded-full bg-kazi-blue-light flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Zap size={12} className="text-kazi-blue" />
                  </div>
                )}
                <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-kazi-green text-white rounded-tr-sm"
                    : "bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-green-200" : "text-gray-400"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-kazi-blue-light flex items-center justify-center mr-2">
                  <Zap size={12} className="text-kazi-blue" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100">
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Ask anything about freelancing..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && askGuide(input)}
                disabled={loading}
              />
              <button
                onClick={() => askGuide(input)}
                disabled={loading || !input.trim()}
                className="btn-primary px-3 disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick questions */}
          <div className="card p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Quick questions</h3>
            <div className="space-y-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q.trigger}
                  onClick={() => askGuide(q.label)}
                  disabled={loading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-xs text-gray-700 hover:bg-kazi-blue-light hover:text-kazi-blue transition-colors disabled:opacity-50"
                >
                  <span>{q.emoji}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* SMS note */}
          <div className="card p-4 bg-kazi-green-light border-kazi-green border">
            <div className="flex items-start gap-2">
              <Phone size={14} className="text-kazi-green mt-0.5" />
              <div>
                <p className="text-xs font-medium text-kazi-green-dark mb-1">Available via SMS</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Freelancers without internet can access Guide via USSD:<br />
                  <span className="font-mono font-medium text-kazi-green">*384*17825# → option 5</span><br />
                  Advice is sent directly to their phone via SMS.
                </p>
              </div>
            </div>
          </div>

          {/* Worker phone for personalised advice */}
          <div className="card p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Personalise advice</h3>
            <p className="text-xs text-gray-500 mb-2">Enter a worker's phone for context-aware advice based on their job history.</p>
            <input
              className="input text-xs"
              placeholder="+254712345678"
              value={workerPhone}
              onChange={e => setWorkerPhone(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
