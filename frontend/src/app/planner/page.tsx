'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { MainLayout } from '@/components/navigation'
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  Play, 
  MoreHorizontal,
  Filter
} from 'lucide-react'

export default function PlannerPage() {
  const [plan, setPlan] = useState<any>(null)
  const [topics, setTopics] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [hoursPerDay, setHoursPerDay] = useState(1.5)
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const { pushError } = useErrorContext()
  
  useEffect(()=>{ 
    (async ()=>{ 
      try{ 
        const [p, t, r] = await Promise.all([
          api('/api/plan/current'),
          api('/api/resources/topics'),
          api('/api/resources/list')
        ])
        setPlan(p)
        setTopics(t.topics||[])
        setResources(r.resources||[])
      } catch(e:any){ 
        pushError({ 
          errorCode: e?.errorCode||'PLAN_400', 
          errorMessage: e?.errorMessage, 
          details: e
        }) 
      }
    })() 
  },[pushError])

  async function regen(){
    setLoading(true)
    try {
      setPlan(await api('/api/plan/generate', { 
        method:'POST', 
        body: JSON.stringify({ horizon_days: 14, preferred_hours_per_day: hoursPerDay, deadline: deadline||undefined }) 
      }))
    } catch(e:any){ 
      pushError({ 
        errorCode: e?.errorCode||'PLAN_500', 
        errorMessage: e?.errorMessage, 
        details: e
      }) 
    } finally {
      setLoading(false)
    }
  }

  async function markSession(date: string, topic: string, status: string){
    try {
      const resp = await api('/api/resources/progress', {
        method: 'POST',
        body: JSON.stringify({ sessions: [{ date, topic, status }] })
      })
      setPlan(resp.plan)
    } catch(e:any){
      pushError({ errorCode: e?.errorCode||'PLAN_PROGRESS_FAIL', errorMessage: e?.errorMessage, details: e })
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'success'
      case 'in-progress': return 'warning'
      case 'pending': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <MainLayout>
      <div className='p-6 space-y-8'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl md:text-4xl font-bold tracking-tight'>Study Planner</h1>
            <p className='text-muted-foreground'>Your personalized AI-generated study schedule</p>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-muted-foreground'>Hours/day</label>
              <input type='number' step='0.5' min='0.5' className='w-20 px-2 py-1 border rounded bg-background text-sm'
                value={hoursPerDay} onChange={e=> setHoursPerDay(parseFloat(e.target.value)||1.5)} />
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-muted-foreground'>Deadline</label>
              <input type='date' className='px-2 py-1 border rounded bg-background text-sm'
                value={deadline} onChange={e=> setDeadline(e.target.value)} />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button onClick={regen} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generating...' : 'Regenerate Plan'}
            </Button>
          </div>
        </div>

        {plan ? (
          <Tabs defaultValue='kanban' className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value='kanban' className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value='calendar' className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value='list'>List View</TabsTrigger>
            </TabsList>

            <TabsContent value='kanban' className="space-y-6">
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {(Array.from(new Set<string>((plan.sessions||[]).map((s:any)=> String(s.date)))) as string[]).slice(0,8).map((date: string)=> (
                  <Card key={date} className="hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                      <CardDescription>
                        {(plan.sessions||[]).filter((s:any)=> s.date===date).length} sessions planned
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {(plan.sessions||[]).filter((s:any)=> s.date===date).map((s:any, idx:number)=> (
                        <div key={idx} className='bg-muted/50 p-3 rounded-lg hover:bg-muted transition-all'>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className='font-medium text-sm'>{s.topic}</h4>
                            <Badge variant={getStatusColor(s.status || 'pending')} className="text-xs">
                              {s.status || 'pending'}
                            </Badge>
                          </div>
                          <p className='text-xs text-muted-foreground mb-2'>{s.focus}</p>
                          <div className="flex items-center justify-between">
                            <span className='text-xs text-muted-foreground'>{s.duration_min} min</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={()=> markSession(s.date, s.topic, s.status==='completed'?'pending':'completed')}>
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value='calendar' className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline View</CardTitle>
                  <CardDescription>Your study sessions organized by date and time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className="border-b">
                          <th className='text-left p-3 font-semibold'>Date</th>
                          <th className='text-left p-3 font-semibold'>Topic</th>
                          <th className='text-left p-3 font-semibold'>Focus Area</th>
                          <th className='text-left p-3 font-semibold'>Duration</th>
                          <th className='text-left p-3 font-semibold'>Status</th>
                          <th className='text-left p-3 font-semibold'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(plan.sessions||[]).map((s:any, idx:number)=> (
                          <tr key={idx} className='border-b hover:bg-muted/50 transition-all'>
                            <td className='p-3'>{new Date(s.date).toLocaleDateString()}</td>
                            <td className='p-3 font-medium'>{s.topic}</td>
                            <td className='p-3 text-muted-foreground'>{s.focus}</td>
                            <td className='p-3'>
                              <Badge variant="outline">{s.duration_min} min</Badge>
                            </td>
                            <td className='p-3'>
                              <Badge variant={getStatusColor(s.status || 'pending')}>
                                {s.status || 'pending'}
                              </Badge>
                            </td>
                            <td className='p-3'>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='list' className="space-y-6">
              <div className="space-y-4">
                {(plan.sessions||[]).map((s:any, idx:number)=> (
                  <Card key={idx} className="hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{s.topic}</h3>
                            <Badge variant={getStatusColor(s.status || 'pending')}>
                              {s.status || 'pending'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">{s.focus}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(s.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {s.duration_min} minutes
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={()=> markSession(s.date, s.topic, s.status==='completed'?'pending':'completed')}>
                            <Play className="w-3 h-3 mr-1" />
                            {s.status==='completed'? 'Undo' : 'Complete'}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Study Plan Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate your first AI-powered study plan to get started
              </p>
              <Button onClick={regen} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating Plan...' : 'Generate Study Plan'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
