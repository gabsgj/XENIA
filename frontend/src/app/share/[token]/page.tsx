"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function SharePage(){
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  useEffect(()=>{ (async()=>{
    try {
      // Assuming backend supports token to fetch a plan; adjust path if needed
      setData(await api(`/api/plan/current?token=${encodeURIComponent(String(token||""))}`));
    } catch(e:any){ setError(e?.errorMessage||"Could not load shared plan") }
  })() },[token])
  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div className="text-xl font-extrabold">XENIA</div>
        <div className="text-sm text-muted-foreground">Shared Plan</div>
      </header>
      {error && <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-3 mb-4">{error}</div>}
      {data && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <div className="font-semibold">Horizon</div>
            <div className="text-muted-foreground">{data.horizon_days} days</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="font-semibold mb-2">Sessions</div>
            <div className="space-y-2">
              {(data.sessions||[]).slice(0,60).map((s:any, i:number)=> (
                <div key={i} className="text-sm flex items-center justify-between border-b last:border-none py-2">
                  <span className="font-medium">{s.topic}</span>
                  <span className="text-muted-foreground">{s.date} • {s.duration_min} min</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}