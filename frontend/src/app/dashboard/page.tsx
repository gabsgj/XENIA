"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useErrorContext } from "@/lib/error-context";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export default function DashboardPage(){
  const [data, setData] = useState<any>(null);
  const { pushError } = useErrorContext();
  useEffect(()=>{ (async()=>{
    try{ setData(await api('/api/analytics/student?user_id=demo-user')) }
    catch(e:any){ pushError({ errorCode:e?.errorCode||'CONTENT_API_FAIL', errorMessage:e?.errorMessage, details:e}) }
  })() },[pushError])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-5xl font-extrabold">Welcome back</h1>
        <p className="text-muted-foreground">Keep your streak alive and level up.</p>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Tasks completed</div>
            <div className="text-3xl font-bold">{(data.tasks||[]).filter((t:any)=> t.status==='done').length}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Study time</div>
            <div className="text-3xl font-bold">{(data.sessions||[]).reduce((a:number,b:any)=> a+(b.duration_min||0),0)} min</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Streak</div>
            <div className="text-3xl font-bold">{data.profile?.streak_days||0} days</div>
          </div>
        </div>
      )}

      <div className="rounded-xl border p-4">
        <div className="font-semibold mb-2">Daily study minutes</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={(data?.sessions||[]).map((s:any)=> ({ x: s.created_at?.slice(0,10), y: s.duration_min }))}>
              <XAxis dataKey='x' /><YAxis /><Tooltip />
              <Area type='monotone' dataKey='y' stroke='#111' fill="#11111120" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

