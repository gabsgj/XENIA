'use client'
import { useEffect, useMemo, useState } from 'react'
import { api, getUserId } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingButton, LoadingOverlay, SkeletonCard } from '@/components/ui/loading'
import MinimalTimer from '@/components/ui/minimal-timer'
import EnhancedRecommendationsPanel from '@/components/EnhancedRecommendationsPanel'

import { MainLayout } from '@/components/navigation'
import { PlannerErrorBoundary } from '@/components/planner/PlannerErrorBoundary'
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  Play, 
  MoreHorizontal,
  Filter
} from 'lucide-react'

export default function PlannerPage() {
  // Helper: safely match a resource to a session topic
  const matchesTopic = (resource: any, topic: string): boolean => {
    try {
      if (!resource) return false
      const rTopic = (resource.topic || '').toString().trim()
      const sTopic = (topic || '').toString().trim()
      if (!rTopic && !sTopic) return false
      if (rTopic && sTopic && rTopic === sTopic) return true
      const rl = rTopic.toLowerCase()
      const sl = sTopic.toLowerCase()
      // match if either contains the other, but avoid trivially true self-contains
      if (rl && sl && (sl.includes(rl) || rl.includes(sl))) return true
      // also match by simple token intersection
  const rTokens: string[] = rl.split(/[^a-z0-9]+/).filter(Boolean)
  const sTokens: string[] = sl.split(/[^a-z0-9]+/).filter(Boolean)
  return rTokens.some((t: string) => sTokens.includes(t))
    } catch {
      return false
    }
  }
  const [plan, setPlan] = useState<any>(null)
  const [topics, setTopics] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [hoursPerDay, setHoursPerDay] = useState(1.5)
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [optimistic, setOptimistic] = useState(false)
  const [prevPlan, setPrevPlan] = useState<any>(null)
  const [initialTopics, setInitialTopics] = useState<any[]>([])
  const [sessionStatus, setSessionStatus] = useState<Record<string, 'pending' | 'in-progress' | 'completed'>>({})
  
  // Progress tracking state
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set())
  const [sessionProgress, setSessionProgress] = useState<Record<string, number>>({})
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  
  // Resources display state
  const [showAllResources, setShowAllResources] = useState(false)
  const [showAllDays, setShowAllDays] = useState(true)
  
  const { pushError } = useErrorContext()

  const uniqueDates = useMemo(() => {
    try {
      const dates = Array.from(new Set<string>((plan?.sessions || []).map((s:any) => String(s.date))))
      dates.sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
      return dates
    } catch {
      return [] as string[]
    }
  }, [plan])
  
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
        if (t.topics?.length > 0) {
          setInitialTopics(t.topics)
        }
        
        // Also fetch topic-specific resources for current plan topics
        if (p?.sessions?.length > 0) {
          const uniqueTopics = [...new Set(p.sessions.map((s:any) => s.topic))] as string[]
          const topicResourcePromises = uniqueTopics.slice(0, 5).map(async (topic: string) => {
            try {
              const topicRes = await api(`/api/resources/recommendations/${encodeURIComponent(topic)}?learning_style=balanced&difficulty=intermediate&free_only=true`)
              return { topic, resources: topicRes.grouped_recommendations || {} }
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
              
              // Extract different types of resources from grouped recommendations
              Object.entries(topicRes).forEach(([category, resourceList]: [string, any]) => {
                if (Array.isArray(resourceList)) {
                  resourceList.forEach((resource: any) => {
                    additionalResources.push({
                      ...resource,
                      topic: topic,
                      source: category === 'youtube_videos' ? 'youtube' : 
                             category === 'ocw_courses' ? 'ocw' : 
                             category === 'documentation' ? 'docs' : 
                             category === 'ai_generated' ? 'ai' : 'general',
                      title: resource.title || resource.name || 'Untitled Resource',
                      url: resource.url || resource.link || `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
                      duration: resource.duration || resource.metadata?.videoDuration || 10,
                      quality_score: resource.quality_score || resource.recommendation_score || 5
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

  // Refresh plan when the window regains focus or visibility changes (helps when navigating back)
  useEffect(() => {
    const refresh = async () => {
      try {
        const p = await api('/api/plan/current')
        if (p) setPlan(p)
      } catch (e) {
        // silent
      }
    }

    const onFocus = () => refresh()
    const onVisibility = () => { if (!document.hidden) refresh() }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  async function regen(){
    setLoading(true)
    // Start optimistic UI
    setPrevPlan(plan)
    setOptimistic(true)
    setShowAllDays(true)
    try {
      const userId = getUserId()

      // Compute an optimistic plan: update deadline and reset non-completed sessions to pending
      const optimisticPlan = (() => {
        try {
          const currentSessions = (plan?.sessions || []).map((s:any) => ({
            ...s,
            status: s.status === 'completed' ? 'completed' : 'pending',
          }))
          return {
            ...(plan || {}),
            deadline: deadline || plan?.deadline || undefined,
            generation_method: 'optimistic_regeneration',
            sessions: currentSessions,
          }
        } catch {
          return plan
        }
      })()
      setPlan(optimisticPlan)

      // Prepare optional topics list if available (backend primarily uses stored/current topics)
      const syllabusTopics = (initialTopics.length > 0 ? initialTopics : topics)
        .map((t: any) => (typeof t === 'string' ? t : t?.topic))
        .filter(Boolean)

      const resp = await api('/api/plan/regenerate', {
        method:'POST',
        body: JSON.stringify({
          user_id: userId,
          new_deadline: deadline || undefined,
          preserve_progress: true,
          excluded_topics: [],
          priority_adjustment: 'balanced',
          learning_pace: 'moderate',
          topics: syllabusTopics,
        })
      })

      // Backend returns { success: true, data: { regenerated_plan, changes_summary } }
      const newPlan = resp?.data?.regenerated_plan || resp?.regenerated_plan || resp?.plan || resp
      if (!newPlan || !newPlan.sessions) {
        throw new Error('Regeneration succeeded but no plan payload was returned')
      }
      setPlan(newPlan)
    } catch(e:any){
      // Revert optimistic change
      if (prevPlan) setPlan(prevPlan)
      pushError({
        errorCode: e?.errorCode||'PLAN_500',
        errorMessage: e?.errorMessage || e?.message,
        details: e
      })
    } finally {
      setOptimistic(false)
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
        user_id: getUserId(), // Add user ID for authentication
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

  async function markSession(date: string, topic: string, status: string, durationMin?: number){
    try {
      // Optimistically update the UI first
      const sessionKey = `${date}-${topic}`
      setSessionStatus(prev => ({ ...prev, [sessionKey]: status as 'pending' | 'in-progress' | 'completed' }))
      
      // Also update the plan sessions optimistically
      setPlan((prevPlan: any) => {
        if (!prevPlan?.sessions) return prevPlan
        
        const updatedSessions = prevPlan.sessions.map((s: any) => 
          s.date === date && s.topic === topic 
            ? { ...s, status, ...(durationMin ? { duration_min: durationMin } : {}) }
            : s
        )
        
        return {
          ...prevPlan,
          sessions: updatedSessions
        }
      })
      
      // Update backend
      const resp = await api('/api/resources/progress', {
        method: 'POST',
        body: JSON.stringify({ 
          sessions: [{ 
            date, 
            topic, 
            status, 
            ...(durationMin ? { duration_min: durationMin } : {}) 
          }] 
        })
      })
      
      // If backend returns updated plan, use it
      if ((resp as any)?.plan) {
        setPlan((resp as any).plan)
      }
      
    } catch(e:any){
      // Revert optimistic update on error
      const sessionKey = `${date}-${topic}`
      setSessionStatus(prev => {
        const newStatus = { ...prev }
        delete newStatus[sessionKey]
        return newStatus
      })
      
      pushError({ 
        errorCode: e?.errorCode||'PLAN_PROGRESS_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to update session status', 
        details: e 
      })
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
    <PlannerErrorBoundary>
      <MainLayout>
        {/* Spinner overlay during regeneration */}
        <LoadingOverlay show={optimistic} title="Regenerating plan..." description="Re-optimizing schedule based on your new deadline" />
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
                value={deadline} onChange={e=> { setDeadline(e.target.value); setShowAllDays(true); }} />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAllDays(v => !v)}>
              {showAllDays ? 'Show 8 days' : 'Show full plan'}
            </Button>
            <LoadingButton
              loading={loading}
              loadingText="Generating..."
              onClick={regen}
              icon={RefreshCw}
            >
              Regenerate Plan
            </LoadingButton>
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
                {(showAllDays ? uniqueDates : uniqueDates.slice(0, 8)).map((date: string)=> (
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
                          
                          <div className="mb-3">
                            <MinimalTimer
                              className="w-full"
                              duration={s.duration_min}
                              status={sessionStatus[`${s.date}-${s.topic}`] || s.status || 'pending'}
                              noAutoStart={true}
                              onStatusChange={(newStatus) => markSession(s.date, s.topic, newStatus)}
                              onComplete={(actualTime) => { 
                                // Mark complete both locally and in the plan
                                markSession(s.date, s.topic, 'completed', actualTime)
                                markSessionComplete(`${s.date}-${s.topic}`, actualTime)
                              }}
                            />
                          </div>
                          
                          <p className='text-xs text-muted-foreground mb-2'>{s.focus}</p>
                          
                          {/* Resource suggestions for this topic */}
                          {resources
                              .filter((r:any) => matchesTopic(r, s.topic))
                              .sort((a:any,b:any)=> (b.source==='youtube'?1:0) - (a.source==='youtube'?1:0))
                              .slice(0, 5)
                              .map((resource:any, rIdx:number) => (
                            <div key={rIdx} className="mb-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                  {resource.source === 'youtube' ? '🎥' : resource.source === 'ocw' ? '🎓' : '📖'} {resource.source.toUpperCase()}
                                </span>
                                {resource.source === 'youtube' && (
                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">VIDEO</span>
                                )}
                              </div>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline block truncate font-medium">
                                {resource.title}
                              </a>
                            </div>
                          ))}

                          <div className="flex items-center justify-between">
                            <span className='text-xs text-muted-foreground'>{s.duration_min} min</span>
                            <div className="flex gap-1">
                              {resources.filter((r:any) => matchesTopic(r, s.topic)).length > 0 && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => {
                                  const topicResources = resources.filter((r:any) => matchesTopic(r, s.topic))
                                  alert(`Resources for ${s.topic}:\n\n${topicResources.map(r => `${r.source.toUpperCase()}: ${r.title}\n${r.url}`).join('\n\n')}`)
                                }}>
                                  📚
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={()=> markSession(s.date, s.topic, 'completed')}>
                                <span className="text-xs">Done</span>
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
                          <th className='text-left p-3 font-semibold'>Timer</th>
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
                              <MinimalTimer
                                className="w-full"
                                duration={s.duration_min}
                                status={sessionStatus[`${s.date}-${s.topic}`] || s.status || 'pending'}
                                noAutoStart={true}
                                onStatusChange={(newStatus) => markSession(s.date, s.topic, newStatus)}
                                onComplete={(actualTime) => { 
                                  markSession(s.date, s.topic, 'completed', actualTime)
                                  markSessionComplete(`${s.date}-${s.topic}`, actualTime)
                                }}
                              />
                            </td>
                            <td className='p-3'>
                              {resources
                                .filter((r:any) => matchesTopic(r, s.topic))
                                .sort((a:any,b:any)=> (b.source==='youtube'?1:0) - (a.source==='youtube'?1:0))
                                .slice(0, 1)
                                .map((resource:any, rIdx:number) => (
                                <a key={rIdx} href={resource.url} target="_blank" rel="noopener noreferrer" 
                                   className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-xs flex items-center gap-1">
                                  {resource.source === 'youtube' ? '🎥' : resource.source === 'ocw' ? '🎓' : '📖'} 
                                  {resource.title.substring(0, 30)}...
                                  {resource.source === 'youtube' && (
                                    <span className="text-red-600 dark:text-red-400 font-medium ml-1">VIDEO</span>
                                  )}
                                </a>
                              ))}
                              {resources.filter((r:any) => matchesTopic(r, s.topic)).length === 0 && (
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
                          {resources.filter((r:any) => matchesTopic(r, s.topic)).slice(0, 3).length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">📚 Recommended Resources:</h4>
                              <div className="grid gap-2">
                                {resources.filter((r:any) => matchesTopic(r, s.topic)).slice(0, 3).map((resource:any, rIdx:number) => (
                                  <div key={rIdx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                                    <span className="text-xs">
                                      {resource.source === 'youtube' ? '🎥' : resource.source === 'ocw' ? '🎓' : '📖'}
                                    </span>
                                    <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                                       className="text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex-1 truncate font-medium">
                                      {resource.title}
                                    </a>
                                    <div className="flex items-center gap-1">
                                      {resource.source === 'youtube' && (
                                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">VIDEO</span>
                                      )}
                                      <span className="text-xs text-slate-500 dark:text-slate-400">{resource.source}</span>
                                    </div>
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
              <LoadingButton
                loading={loading}
                loadingText="Generating Plan..."
                onClick={regen}
                icon={RefreshCw}
              >
                Generate Study Plan
              </LoadingButton>
            </CardContent>
          </Card>
        )}

        {/* Dedicated Resources Section */}
        {(resources.length > 0 || (plan?.sessions?.length || 0) > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎥</span>
                Study Resources
              </CardTitle>
              <CardDescription>
                AI-curated learning materials with YouTube videos and educational content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Smart Recommendations (reuses the tasks panel) */}
              {(() => {
                try {
                  const planTopicsForRecs = Array.from(new Set((plan?.sessions || []).map((s:any) => s.topic).filter(Boolean)))
                  return (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-2">AI-powered Recommendations</h4>
                      <EnhancedRecommendationsPanel topics={planTopicsForRecs} maxItems={12} compact={true} />
                    </div>
                  )
                } catch {
                  return null
                }
              })()}

              {/* Sort resources to prioritize videos */}
              {(() => {
                const sortedResources = [...resources].sort((a, b) => {
                  // YouTube videos first, then OCW, then others
                  const priority = { youtube: 3, ocw: 2, article: 1, other: 0 };
                  const aPriority = priority[a.source as keyof typeof priority] || 0;
                  const bPriority = priority[b.source as keyof typeof priority] || 0;
                  return bPriority - aPriority;
                });

                const videoResources = sortedResources.filter(r => r.source === 'youtube');
                const otherResources = sortedResources.filter(r => r.source !== 'youtube');

                return (
                  <div className="space-y-6">
                    {/* Featured Videos Section */}
                    {videoResources.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <span>🎬</span>
                          Featured Videos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {videoResources.slice(0, showAllResources ? videoResources.length : 12).map((resource:any, idx:number) => (
                            <Card key={`video-${idx}`} className="hover:shadow-lg transition-all border-l-4 border-l-red-500 bg-white dark:bg-slate-800">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">🎥</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="default" className="bg-red-500 text-white text-xs font-medium">
                                        YOUTUBE
                                      </Badge>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {resource.topic}
                                      </span>
                                    </div>
                                    <h4 className="font-medium text-sm mb-3 line-clamp-2 text-slate-700 dark:text-slate-300">
                                      {resource.title}
                                    </h4>
                                    <Button
                                      size="sm"
                                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => window.open(resource.url, '_blank')}
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      Watch Video
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Resources Section */}
                    {otherResources.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <span>📚</span>
                          Additional Resources
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {otherResources.slice(0, showAllResources ? otherResources.length : 12).map((resource:any, idx:number) => (
                            <div key={`other-${idx}`} className="border rounded-lg p-4 hover:shadow-md transition-all">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">
                                  {resource.source === 'ocw' ? '🎓' : '📖'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {resource.source.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {resource.topic}
                                    </span>
                                  </div>
                                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                    {resource.title}
                                  </h4>
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs inline-flex items-center gap-1"
                                  >
                                    View Resource →
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show More/Less Button */}
                    {(videoResources.length > 12 || otherResources.length > 12) && (
                      <div className="text-center mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setShowAllResources(!showAllResources)}
                          className="flex items-center gap-2"
                        >
                          {showAllResources ? (
                            <>
                              <span>Show Less</span>
                            </>
                          ) : (
                            <>
                              <span>Show All Resources</span>
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {resources.length}
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {resources.length > 16 && !showAllResources && (
                <div className="text-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {Math.min(24, resources.length)} of {resources.length} resources
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </MainLayout>
    </PlannerErrorBoundary>
  )
}
