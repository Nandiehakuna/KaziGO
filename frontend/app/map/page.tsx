"use client"
import { useEffect, useState, useRef } from "react"
import { getWorkers } from "@/lib/api"
import { MapPin, Filter } from "lucide-react"

const SKILLS = ["All", "Tailoring", "Graphic Design", "Tutoring", "Plumbing", "Catering"]

const LOCATION_COORDS: Record<string, [number, number]> = {
  "Westlands": [-1.2676, 36.8062],
  "Nairobi CBD": [-1.2864, 36.8172],
  "Kibera": [-1.3133, 36.7892],
  "Kasarani": [-1.2219, 36.8942],
  "Langata": [-1.3427, 36.7516],
  "Eastleigh": [-1.2741, 36.8480],
  "Karen": [-1.3187, 36.7128],
  "Kilimani": [-1.2930, 36.7889],
  "Kisumu": [-0.0917, 34.7679],
  "Mombasa": [-4.0435, 39.6682],
  "Eldoret": [0.5143, 35.2698],
  "Nakuru": [-0.3031, 36.0800],
  "Rongai": [-1.3927, 36.7441],
}

function getCoords(location: string): [number, number] {
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (location.toLowerCase().includes(key.toLowerCase())) return coords
  }
  return [-1.2864 + (Math.random() - 0.5) * 0.05, 36.8172 + (Math.random() - 0.5) * 0.05]
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [skillFilter, setSkillFilter] = useState("All")
  const [selected, setSelected] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getWorkers().then(w => { setWorkers(w); setFiltered(w) })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (mapInstanceRef.current) return

    const initMap = () => {
      if (!mapRef.current) return
      if ((mapRef.current as any)._leaflet_id) return

      const L = (window as any).L
      if (!L) return

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
        .setView([-1.2864, 36.8172], 11)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map
      setReady(true)
    }

    if ((window as any).L) {
      setTimeout(initMap, 200)
      return
    }

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => setTimeout(initMap, 200)
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!ready || !mapInstanceRef.current) return
    const L = (window as any).L
    const map = mapInstanceRef.current

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    const toShow = skillFilter === "All" ? workers : workers.filter(w => w.skill === skillFilter)
    setFiltered(toShow)

    toShow.forEach((worker: any) => {
      const coords = getCoords(worker.location)
      const color = worker.score >= 4.5 ? "#1D9E75" : worker.score >= 3.5 ? "#BA7517" : "#888780"

      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:12px;font-weight:600;"><span style="transform:rotate(45deg)">${worker.name.charAt(0)}</span></div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      })

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;min-width:160px;padding:4px"><b style="font-size:13px">${worker.name}</b><br/><span style="color:#1D9E75;font-size:11px">${worker.skill}</span><br/><span style="color:#888;font-size:11px">📍 ${worker.location}</span><br/><span style="color:#888;font-size:11px">★ ${worker.score?.toFixed(1)} · ${worker.totalJobs} jobs</span><br/><div style="margin-top:6px;background:#E1F5EE;color:#085041;font-size:10px;padding:3px 8px;border-radius:4px;text-align:center">${worker.verified ? "✓ Verified" : "Unverified"}</div></div>`)
        .on("click", () => setSelected(worker))

      markersRef.current.push(marker)
    })
  }, [ready, workers, skillFilter])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nearby Freelancers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Click a pin to see their KaziGo profile</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400" />
          {SKILLS.map(s => (
            <button key={s} onClick={() => setSkillFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${skillFilter === s ? "bg-kazi-green text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 card overflow-hidden relative" style={{ height: "560px" }}>
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-kazi-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>

        <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto" style={{ maxHeight: "560px" }}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{filtered.length} workers found</p>
          {filtered.map((worker: any) => (
            <div key={worker.id}
              onClick={() => { setSelected(worker); mapInstanceRef.current?.flyTo(getCoords(worker.location), 14, { duration: 1 }) }}
              className={`card p-3 cursor-pointer hover:shadow-md transition-all ${selected?.id === worker.id ? "ring-2 ring-kazi-green" : ""}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-kazi-green-light flex items-center justify-center text-xs font-bold text-kazi-green-dark">
                  {worker.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">{worker.name}</p>
                  <p className="text-[10px] text-kazi-green">{worker.skill}</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-kazi-green">★{worker.score?.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><MapPin size={9} />{worker.location}</span>
                <span>{worker.totalJobs} jobs</span>
              </div>
              {selected?.id === worker.id && (
                <a href={`/jobs`} className="mt-2 block text-center text-xs bg-kazi-green text-white py-1.5 rounded-lg hover:bg-kazi-green-dark transition-colors">
                  Post a job for {worker.name.split(" ")[0]}
                </a>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <MapPin size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No workers yet.</p>
              <p className="text-[10px] mt-1">Workers register via USSD</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
