"use client"

import { useEffect, useState, useRef } from 'react'
import { api, getUserId } from '@/lib/api'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useErrorContext } from '@/lib/error-context'
import { 
  Play, 
  Pause, 
  Plus, 
  BookOpen,
  Timer,
  Square
} from 'lucide-react'
import React from 'react'
import { StudyTimer } from '@/components/ui/study-timer'
// TaskList component is now inline
import RecommendationsPanel from '@/components/RecommendationsPanel'
import { useTasks } from '@/hooks/useTasks'
import { useStudySession } from '@/hooks/useStudySession'

export default function TasksPage(){
  const [topic, setTopic] = useState('Algebra')
  const [minutes, setMinutes] = useState(30)
  const [status, setStatus] = useState('')
  const { pushError } = useErrorContext()
  const { today, upcoming, loading: tasksLoading, fetchToday, fetchUpcoming, completeTask } = useTasks()
  const { activeSession, startSession, endSession } = useStudySession()
  const [planResources, setPlanResources] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [timerStatus, setTimerStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending')
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatTaskStatus = (s?: string | boolean) => {
    if (!s) return 'pending'
    const st = String(s)
    if (st === 'done' || st === 'completed') return 'Completed'
    if (st === 'in-progress' || st === 'in_progress') return 'In progress'
    if (st === 'pending') return 'Pending'
    return st.charAt(0).toUpperCase() + st.slice(1)
  }
  // Add sample tasks for testing
  const addSampleTasks = async () => {
    try {
      const sampleTasks = [
        { title: 'Study Algebra - Chapter 5', due_date: new Date().toISOString().split('T')[0], duration_minutes: 45, subject: 'Mathematics' },
        { title: 'Read Physics Chapter 3', due_date: new Date().toISOString().split('T')[0], duration_minutes: 30, subject: 'Physics' },
        { title: 'Complete Chemistry Lab Report', due_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], duration_minutes: 60, subject: 'Chemistry' },
        { title: 'Review History Notes', due_date: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0], duration_minutes: 25, subject: 'History' }
      ]
      
      for (const task of sampleTasks) {
        await api('/api/tasks', { 
          method: 'POST', 
          body: JSON.stringify({ ...task, user_id: userId }) 
        })
      }
      
      await fetchToday()
      await fetchUpcoming()
    } catch (e) {
      console.error('Failed to add sample tasks:', e)
    }
  }

  // Load user ID
  useEffect(() => {
    const userId = getUserId()
    setUserId(userId)
  }, [])

  // Fetch plan resources and initial tasks
  useEffect(() => {
    const load = async () => {
      try {
        const plan = await api('/api/plan/current')
        const resourcesResp = await api('/api/resources/list')
        const topicResources: any[] = resourcesResp.resources || []
        if (plan?.sessions?.length) {
          const uniqueTopics: string[] = (Array.from(new Set(plan.sessions.map((s:any)=> String(s.topic)))) as string[]).slice(0,5)
          for (const t of uniqueTopics) {
            try {
              const tr = await api(`/api/plan/resources/${encodeURIComponent(t)}?learning_style=balanced`)
              if (tr?.resources) {
                Object.entries(tr.resources).forEach(([k,v]: any) => {
                  if (Array.isArray(v)) {
                    v.forEach((r:any)=> topicResources.push({...r, topic: t}))
                  }
                })
              }
            } catch(e){ /* ignore topic-specific failure */ }
          }
        }
        setPlanResources(topicResources)
      } catch(e){ 
        console.warn('Failed to load plan resources:', e)
      }
    }
    load()
  }, [])

  // Fetch recent sessions for progress
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const data = await api('/api/analytics/student')
        setSessions(data.sessions || [])
      } catch (e: any) {
        // Sessions fetch is optional, don't show error
        console.warn('Failed to load sessions:', e)
      }
    })()
  }, [userId])

  const startTask = async (taskId: string) => {
    if (activeTaskId && activeTaskId !== taskId) {
      // Stop current task
      setActiveTaskId(null)
      setTimerStatus('pending')
    }
    // Start backend session
    try{
      setStartingTaskId(taskId)
      const resp = await startSession({ taskId, durationMin: 25 })
      setActiveTaskId(taskId)
      setTimerStatus('in-progress')
    }catch(e:any){ 
      console.error('Failed to start task:', e)
      pushError({ errorCode: 'SESSION_START_FAIL', errorMessage: 'Failed to start session', details: e }) 
    } finally {
      setStartingTaskId(null)
    }
  }

  const toggleTaskComplete = async (task: any) => {
    try {
      setCompletingIds(prev => new Set(prev).add(task.id))
      await completeTask(task.id)
    } catch (e:any) {
      pushError({ errorCode: e?.errorCode||'TASK_UPDATE_FAIL', errorMessage: e?.errorMessage, details: e })
    } finally {
      setCompletingIds(prev => {
        const copy = new Set(prev)
        copy.delete(task.id)
        return copy
      })
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      await api(`/api/tasks/${taskId}`, { method: 'DELETE' })
      await fetchToday()
      await fetchUpcoming()
    } catch(e:any){ pushError({ errorCode: e?.errorCode||'TASK_DELETE_FAIL', errorMessage: e?.errorMessage, details: e }) }
  }

  const stopTask = async () => {
    // end active session if present
    if (activeSession && activeSession.id) {
      try{
        await endSession({ sessionId: activeSession.id })
      }catch(e:any){ console.warn('Failed to end session', e) }
    }
    setActiveTaskId(null)
    setTimerStatus('pending')
  }

  const handleTimerStatusChange = (newStatus: 'pending' | 'in-progress' | 'completed') => {
    setTimerStatus(newStatus)
  }

  const handleTimerComplete = async (actualTime: number) => {
    if (!activeTaskId) return
    try{
      // find active session id
      const session = activeSession
      // end session and mark task complete
      if (session && session.id) {
        await endSession({ sessionId: session.id, taskId: activeTaskId, actualMinutes: actualTime, completed: true })
        // Ensure task is marked complete in tasks API as well (some backends don't auto-toggle task status on session end)
        try {
          await completeTask(activeTaskId)
        } catch (e) {
          // swallow - we'll refresh below anyway
          console.warn('completeTask fallback failed', e)
        }
      } else {
        // fallback: track manually
        await api('/api/tasks/track', { method: 'POST', body: JSON.stringify({ topic: topic, duration_min: actualTime }) })
      }
      setStatus('Session logged successfully!')
      setActiveTaskId(null)
      setTimerStatus('pending')
      await fetchToday()
    }catch(e:any){
      pushError({ errorCode: e?.errorCode||'TRACK_FAILED', errorMessage: e?.errorMessage || String(e), details: e })
    }
  }

  async function track(){
    try {
      await api('/api/tasks/track', { 
        method:'POST', 
        body: JSON.stringify({ topic, duration_min: minutes }) 
      })
      setStatus('Session logged successfully!')
    } catch(e:any){ 
      pushError({ 
        errorCode: e?.errorCode||'HTTP_500', 
        errorMessage: e?.errorMessage, 
        details: e
      }) 
    }
  }

  return (
    <MainLayout>
      <div className='p-6 space-y-8'>
        {/* Header */}
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl md:text-4xl font-bold tracking-tight'>Tasks & Sessions</h1>
            <p className='text-muted-foreground'>Manage your study tasks and track your learning sessions</p>
          </div>
          <Button title="Create a new task" onClick={async ()=> {
            const title = window.prompt('Task title')
            if (!title) return
            const due = window.prompt('Due date/time (ISO or YYYY-MM-DD HH:MM)')
            const durationStr = window.prompt('Duration in minutes', '30')
            const duration = durationStr ? parseInt(durationStr || '30') : 30
            try {
              const created = await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title, due_date: due, duration_minutes: duration, user_id: userId }) })
              // refresh tasks
              await fetchToday()
              await fetchUpcoming()
            } catch(e:any){ 
              pushError({ errorCode: e?.errorCode||'TASK_CREATE_FAIL', errorMessage: e?.errorMessage, details: e }) 
            }
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Sample Tasks Button - Remove this in production */}
        {today.length === 0 && upcoming.length === 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No tasks yet. Create your first task or add some sample tasks to get started.</p>
                <Button onClick={addSampleTasks} disabled={!userId}>
                  Add Sample Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>Your study tasks for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
{today.length > 0 ? (
                  <div className="space-y-3">
                    {today.map((task: any) => (
                      <div key={task.id} className="p-3 border rounded-lg hover:bg-muted/50 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{task.title || task.topic}</div>
                          <div className="text-sm text-muted-foreground">{task.subject || 'General'} • {task.duration_minutes || task.estimatedMinutes || 30} min</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={task.status === 'done' || task.completed ? 'success' : 'secondary'}>
                            {formatTaskStatus(task.status ?? task.completed)}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => startTask(task.id)} disabled={!!activeTaskId || startingTaskId===task.id}>
                            {startingTaskId===task.id ? 'Starting' : 'Start'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleTaskComplete(task)} disabled={completingIds.has(task.id)}>
                            {completingIds.has(task.id) ? 'Saving...' : (task.status === 'done' || task.completed ? 'Undo' : 'Complete')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">No tasks for today.</div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming grouped by date */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Grouped by date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const groups: Record<string, any[]> = {}
                  upcoming.forEach((t:any) => {
                    const key = new Date(t.dueDate || t.due_date || t.date || t.due || null).toDateString()
                    if (!groups[key]) groups[key] = []
                    groups[key].push(t)
                  })
                  const sortedKeys = Object.keys(groups).sort((a,b)=> new Date(a).getTime() - new Date(b).getTime())
                  if (sortedKeys.length === 0) return <p className="text-muted-foreground">No upcoming tasks.</p>
                  return sortedKeys.map(k => (
                    <div key={k} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{new Date(k).toLocaleDateString()}</h4>
                        <span className="text-sm text-muted-foreground">{groups[k].length} tasks</span>
                      </div>
                      <div className="space-y-2">
                        {groups[k].map((task:any)=> (
                          <div key={task.id} className="p-3 border rounded hover:bg-muted/50 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{task.title || task.topic}</div>
                              <div className="text-xs text-muted-foreground">{task.subject || 'General'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={task.status==='completed'? 'success' : 'secondary'}>{formatTaskStatus(task.status ?? task.completed)}</Badge>
                              <Button size="sm" variant="ghost" onClick={() => startTask(task.id)} disabled={!!activeTaskId || startingTaskId===task.id}>{startingTaskId===task.id? 'Starting':'Start'}</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Study Timer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTaskId ? (
                  <StudyTimer
                    duration={((): number => {
                      const t: any = today.find((x:any)=>x.id===activeTaskId)
                      return t?.estimatedMinutes || t?.estimated_minutes || t?.duration_minutes || 30
                    })()}
                    status={timerStatus}
                    onStatusChange={handleTimerStatusChange}
                    onComplete={handleTimerComplete}
                    externalProgress={(today.find(t=>t.id===activeTaskId) as any)?.progress ?? 0}
                    pomodoro={false}
                    breakMinutes={5}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a task to start the timer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Log Session */}
            <Card>
              <CardHeader>
                <CardTitle>Log Study Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input 
                    id="topic"
                    value={topic} 
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g., Algebra"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration"
                    type="number" 
                    value={minutes} 
                    onChange={e => setMinutes(parseInt(e.target.value) || 0)}
                    placeholder="30"
                  />
                </div>
                <Button onClick={track} className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Log Session
                </Button>
                {status && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">{status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasks Completed</span>
                  <span className="font-semibold">{([...(today as any[]), ...(upcoming as any[])] as any[]).filter((t:any)=>t.status==='done' || t.completed).length}/{([...(today as any[]), ...(upcoming as any[])] as any[]).length || 3}</span>
                </div>
                <Progress value={([...(today as any[]), ...(upcoming as any[])] as any[]).length? Math.round((([...(today as any[]), ...(upcoming as any[])] as any[]).filter((t:any)=>t.status==='done' || t.completed).length/Math.max(1,([...(today as any[]), ...(upcoming as any[])] as any[]).length))*100):33} className="h-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Study Time Goal</span>
                  <span className="font-semibold">{sessions.filter(s => {
                    const sessionDate = new Date(s.created_at).toDateString()
                    const today = new Date().toDateString()
                    return sessionDate === today
                  }).reduce((a,b)=>a+(b.duration_min||0),0)}/180 min</span>
                </div>
                <Progress value={Math.min(100, Math.round((sessions.filter(s => {
                  const sessionDate = new Date(s.created_at).toDateString()
                  const today = new Date().toDateString()
                  return sessionDate === today
                }).reduce((a,b)=>a+(b.duration_min||0),0)/180)*100))} className="h-2" />
              </CardContent>
            </Card>

            {/* Recommendations from Planner / AI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Recommended Resources
                </CardTitle>
                <CardDescription className="text-xs">AI-powered suggestions for today's tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* derive topics from today's tasks */}
                <div>
                  <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading recommendations…</div>}>
                    {/* Dynamically import to keep initial bundle small */}
                    <RecommendationsPanel topics={[...new Set(today.map((t:any)=> t.subject || t.topic).filter(Boolean))]} />
                  </React.Suspense>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
