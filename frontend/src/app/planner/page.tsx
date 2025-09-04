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
  
  // Progress tracking state
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set())
  const [sessionProgress, setSessionProgress] = useState<Record<string, number>>({})
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  
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
        
        // Also fetch topic-specific resources for current plan topics
        if (p?.sessions?.length > 0) {
          const uniqueTopics = [...new Set(p.sessions.map((s:any) => s.topic))] as string[]
          const topicResourcePromises = uniqueTopics.slice(0, 5).map(async (topic: string) => {
            try {
              const topicRes = await api(`/api/plan/resources/${encodeURIComponent(topic)}?learning_style=balanced`)
              return { topic, resources: topicRes.resources || {} }
            } catch (e) {
              console.warn(`Failed to fetch resources for topic: ${topic}`, e)
              return { topic, resources: {} }
            }
          })
          
          const topicResourcesResults = await Promise.allSettled(topicResourcePromises)
          const additionalResources: any[] = []
          
          topicResourcesResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value?.resources) {
              const { topic, resources: topicRes } = result.value
              
              // Extract different types of resources
              Object.entries(topicRes).forEach(([category, resourceList]: [string, any]) => {
                if (Array.isArray(resourceList)) {
                  resourceList.forEach((resource: any) => {
                    additionalResources.push({
                      ...resource,
                      topic: topic,
                      source: category.includes('youtube') || category.includes('videos') ? 'youtube' : 
                             category.includes('articles') ? 'article' : 
                             category.includes('documentation') ? 'docs' : 'general'
                    })
                  })
                }
              })
            }
          })
          
          // Merge with existing resources, avoiding duplicates
          setResources(prev => {
            const existingUrls = new Set(prev.map(r => r.url))
            const newResources = additionalResources.filter(r => !existingUrls.has(r.url))
            return [...prev, ...newResources]
          })
        }
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

  // Progress tracking functions
  const markSessionComplete = (sessionId: string, timeSpent: number = 0) => {
    setCompletedSessions(prev => new Set([...prev, sessionId]))
    setSessionProgress(prev => ({ ...prev, [sessionId]: 100 }))
    setTotalTimeSpent(prev => prev + timeSpent)
    updateProgressOnBackend()
  }

  const updateSessionProgress = (sessionId: string, percentage: number) => {
    setSessionProgress(prev => ({ ...prev, [sessionId]: percentage }))
    if (percentage >= 100) {
      setCompletedSessions(prev => new Set([...prev, sessionId]))
    }
  }

  const updateProgressOnBackend = async () => {
    try {
      const totalSessions = plan?.sessions?.length || 0
      const completionPercentage = totalSessions > 0 ? (completedSessions.size / totalSessions) * 100 : 0
      
      const progressData = {
        completion_percentage: completionPercentage,
        sessions_completed: completedSessions.size,
        time_spent_hours: totalTimeSpent,
        completed_topics: Array.from(completedSessions),
        preferred_pace: hoursPerDay >= 3 ? "fast" : hoursPerDay <= 1.5 ? "slow" : "normal"
      }

      const adjustedPlan = await api('/api/plan/update-progress', {
        method: 'POST',
        body: JSON.stringify(progressData)
      })

      if (adjustedPlan.adjusted_plan) {
        console.log('Plan automatically adjusted based on progress!', adjustedPlan)
        // Could update the plan here or show a notification
      }
    } catch (e) {
      console.error('Failed to sync progress:', e)
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
                          
                          {/* Resource suggestions for this topic */}
                          {resources.filter((r:any) => r.topic === s.topic || s.topic.toLowerCase().includes(r.topic.toLowerCase()) || r.topic.toLowerCase().includes(s.topic.toLowerCase())).slice(0, 2).map((resource:any, rIdx:number) => (
                            <div key={rIdx} className="mb-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border-l-2 border-blue-500">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                  {resource.source === 'youtube' ? '📺' : '📖'} {resource.source.toUpperCase()}
                                </span>
                              </div>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate">
                                {resource.title}
                              </a>
                            </div>
                          ))}

                          <div className="flex items-center justify-between">
                            <span className='text-xs text-muted-foreground'>{s.duration_min} min</span>
                            <div className="flex gap-1">
                              {resources.filter((r:any) => r.topic === s.topic || s.topic.toLowerCase().includes(r.topic.toLowerCase()) || r.topic.toLowerCase().includes(s.topic.toLowerCase())).length > 0 && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                  const topicResources = resources.filter((r:any) => r.topic === s.topic || s.topic.toLowerCase().includes(r.topic.toLowerCase()) || r.topic.toLowerCase().includes(s.topic.toLowerCase()))
                                  alert(`Resources for ${s.topic}:\n\n${topicResources.map(r => `${r.source.toUpperCase()}: ${r.title}\n${r.url}`).join('\n\n')}`)
                                }}>
                                  📚
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={()=> markSession(s.date, s.topic, s.status==='completed'?'pending':'completed')}>
                                <Play className="w-3 h-3" />
                              </Button>
                            </div>
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
                          <th className='text-left p-3 font-semibold'>Resources</th>
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
                              {resources.filter((r:any) => r.topic === s.topic || s.topic.toLowerCase().includes(r.topic.toLowerCase()) || r.topic.toLowerCase().includes(s.topic.toLowerCase())).slice(0, 1).map((resource:any, rIdx:number) => (
                                <a key={rIdx} href={resource.url} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1">
                                  {resource.source === 'youtube' ? '📺' : '📖'} {resource.title.substring(0, 30)}...
                                </a>
                              ))}
                              {resources.filter((r:any) => r.topic === s.topic || s.topic.toLowerCase().includes(r.topic.toLowerCase()) || r.topic.toLowerCase().includes(s.topic.toLowerCase())).length === 0 && (
                                <span className="text-xs text-muted-foreground">No resources</span>
                              )}
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
                          
                          {/* Resource suggestions */}
                          {resources.filter((r:any) => r.topic === s.topic || s.topic.toLowerCase().includes(r.topic.toLowerCase()) || r.topic.toLowerCase().includes(s.topic.toLowerCase())).slice(0, 3).length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-muted-foreground mb-2">📚 Recommended Resources:</h4>
                              <div className="grid gap-2">
                                {resources.filter((r:any) => r.topic === s.topic || s.topic.toLowerCase().includes(r.topic.toLowerCase()) || r.topic.toLowerCase().includes(s.topic.toLowerCase())).slice(0, 3).map((resource:any, rIdx:number) => (
                                  <div key={rIdx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                    <span className="text-xs">
                                      {resource.source === 'youtube' ? '📺' : resource.source === 'ocw' ? '🎓' : '📖'}
                                    </span>
                                    <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                                       className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex-1 truncate">
                                      {resource.title}
                                    </a>
                                    <span className="text-xs text-muted-foreground">{resource.source}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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

        {/* Dedicated Resources Section */}
        {resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📚</span>
                Study Resources
              </CardTitle>
              <CardDescription>
                AI-curated learning materials including YouTube videos, articles, and practice resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.slice(0, 12).map((resource:any, idx:number) => (
                  <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {resource.source === 'youtube' ? '📺' : resource.source === 'ocw' ? '🎓' : '📖'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {resource.source.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Topic: {resource.topic}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm mb-2 line-clamp-2">
                          {resource.title}
                        </h4>
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                        >
                          View Resource →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {resources.length > 12 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 12 of {resources.length} resources
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
