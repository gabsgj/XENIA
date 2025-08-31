'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'

export default function AnalyticsPage(){
  const [data, setData] = useState<any>(null)
  const { pushError } = useErrorContext()
  useEffect(()=>{ (async()=>{ try{ setData(await api('/api/analytics/student?user_id=demo-user')) } catch(e:any){ pushError({ errorCode: e?.errorCode||'CONTENT_API_FAIL', errorMessage: e?.errorMessage, details:e}) } })() },[pushError])
  return (
    <div className='max-w-5xl mx-auto p-6 space-y-6'>
      <h2 className='text-2xl font-semibold'>Analytics</h2>
      {data && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='rounded-xl border p-4'>
            <div className='font-semibold mb-2'>Study Minutes Over Time</div>
            <div className='h-64'>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(data.sessions||[]).map((s:any)=> ({ x: s.created_at?.slice(0,10), y: s.duration_min }))}>
                  <XAxis dataKey='x' /><YAxis /><Tooltip />
                  <Line type='monotone' dataKey='y' stroke='#111' strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className='rounded-xl border p-4'>
            <div className='font-semibold mb-2'>Tasks Status</div>
            <div className='h-64'>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={['todo','doing','done'].map(k=> ({ name:k, value:(data.tasks||[]).filter((t:any)=> t.status===k).length }))} outerRadius={100}>
                    {['#0ea5e9','#f59e0b','#10b981'].map((c,i)=> <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
