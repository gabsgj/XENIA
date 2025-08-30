"use client"
import { useState } from "react"
import { API_BASE } from "@/lib/api"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<"syllabus" | "assessment">("syllabus")
  const [status, setStatus] = useState<string>("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const form = new FormData()
    form.append("file", file)
    form.append("user_id", "demo-user")
    const res = await fetch(`${API_BASE}/api/upload/${type}`, { method: "POST", body: form })
    const data = await res.json()
    setStatus(JSON.stringify(data))
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Upload {type === "syllabus" ? "Syllabus" : "Assessment"}</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <select className="border p-2 rounded" value={type} onChange={(e)=> setType(e.target.value as any)}>
          <option value="syllabus">Syllabus</option>
          <option value="assessment">Assessment</option>
        </select>
        <input className="block" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
        <button className="border rounded px-4 py-2" type="submit">Upload</button>
      </form>
      {status && <pre className="mt-4 whitespace-pre-wrap break-all">{status}</pre>}
    </div>
  )
}
