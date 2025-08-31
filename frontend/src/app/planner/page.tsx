'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PlannerPage() {
  const [plan, setPlan] = useState<any>(null)
  const { pushError } = useErrorContext()
  useEffect(()=>{ (async ()=>{ try{ setPlan(await api('/api/plan/current?user_id=demo-user')) } catch(e:any){ pushError({ errorCode: e?.errorCode||'PLAN_400', errorMessage: e?.errorMessage, details:e}) } })() },[pushError])
  async function regen(){
    try {
      setPlan(await api('/api/plan/generate', { method:'POST', body: JSON.stringify({ user_id:'demo-user', horizon_days: 14 }) }))
    } catch(e:any){ pushError({ errorCode: e?.errorCode||'PLAN_500', errorMessage: e?.errorMessage, details:e}) }
  }
  return (
    <div className='max-w-5xl mx-auto p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold'>Adaptive Plan</h2>
        <Button onClick={regen}>Regenerate</Button>
      </div>
      {plan && (
        <Tabs defaultValue='kanban'>
          <TabsList>
            <TabsTrigger value='kanban'>Kanban</TabsTrigger>
            <TabsTrigger value='calendar'>Calendar</TabsTrigger>
            <TabsTrigger value='json'>JSON</TabsTrigger>
          </TabsList>
          <TabsContent value='kanban'>
            {/* Simple Kanban by dates */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
              {(Array.from(new Set<string>((plan.sessions||[]).map((s:any)=> String(s.date)))) as string[]).slice(0,6).map((date: string)=> (
                <div key={date} className='rounded-xl border p-4'>
                  <div className='font-semibold mb-2'>{date}</div>
                  <div className='space-y-2'>
                    {(plan.sessions||[]).filter((s:any)=> s.date===date).map((s:any, idx:number)=> (
                      <div key={idx} className='rounded-lg border p-3 text-sm'>
                        <div className='font-medium'>{s.topic}</div>
                        <div className='text-muted-foreground'>{s.focus} • {s.duration_min} min</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value='calendar'>
            <div className='mt-4 overflow-x-auto'>
              <table className='min-w-full text-sm'>
                <thead className='text-left'><tr><th className='p-2'>Date</th><th className='p-2'>Topic</th><th className='p-2'>Focus</th><th className='p-2'>Duration</th></tr></thead>
                <tbody>
                  {(plan.sessions||[]).map((s:any, idx:number)=> (
                    <tr key={idx} className='border-t'>
                      <td className='p-2'>{s.date}</td>
                      <td className='p-2'>{s.topic}</td>
                      <td className='p-2'>{s.focus}</td>
                      <td className='p-2'>{s.duration_min} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value='json'>
            <pre className='mt-4 whitespace-pre-wrap break-all'>{JSON.stringify(plan, null, 2)}</pre>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
