'use client'

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
import { StudyTimer } from '@/components/ui/study-timer'

interface Task {
  id: string
  topic: string
  status: string
  due_date: string
  duration_minutes?: number
}

export default function TasksPage(){
  const [topic, setTopic] = useState('Algebra')
  const [minutes, setMinutes] = useState(30)
  const [status, setStatus] = useState('')
  const { pushError } = useErrorContext()
  const [tasks, setTasks] = useState<Task[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [timerStatus, setTimerStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load user ID
  useEffect(() => {
    const userId = getUserId()
    setUserId(userId)
  }, [])

  // Fetch today's tasks
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const data = await api('/api/tasks')
        setTasks(data.tasks || [])
      } catch (e: any) {
        pushError({
          errorCode: e?.errorCode || 'TASKS_FETCH_FAILED',
          errorMessage: e?.errorMessage || 'Failed to load tasks',
          details: e
        })
      }
    })()
  }, [userId, pushError])

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

  const startTask = (taskId: string) => {
    if (activeTaskId && activeTaskId !== taskId) {
      // Stop current task
      setActiveTaskId(null)
      setTimerStatus('pending')
    }
    setActiveTaskId(taskId)
    setTimerStatus('pending')
  }

  const stopTask = () => {
    setActiveTaskId(null)
    setTimerStatus('pending')
  }

  const handleTimerStatusChange = (newStatus: 'pending' | 'in-progress' | 'completed') => {
    setTimerStatus(newStatus)
  }

  const handleTimerComplete = async (actualTime: number) => {
    if (!activeTaskId) return
    
    try {
      // Find the active task to get its topic
      const activeTask = tasks.find(t => t.id === activeTaskId)
      if (!activeTask) return
      
      // Track the session
      await api('/api/tasks/track', { 
        method: 'POST', 
        body: JSON.stringify({ 
          topic: activeTask.topic, 
          duration_min: actualTime 
        }) 
      })
      
      setStatus('Session logged successfully!')
      setActiveTaskId(null)
      setTimerStatus('pending')
      
      // Refresh tasks to show updated progress
      const data = await api('/api/tasks')
      setTasks(data.tasks || [])
    } catch (e: any) {
      pushError({
        errorCode: e?.errorCode || 'TRACK_FAILED',
        errorMessage: e?.errorMessage || 'Failed to track session',
        details: e
      })
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
          <Button disabled title="Tasks are automatically created from your study plans">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>Your study tasks for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground">No tasks for today.</p>
                ) : (
                  tasks.map((task: any) => {
                    const isActive = activeTaskId === task.id
                    const duration = task.duration_minutes || task.estimatedTime || 30
                    return (
                      <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{task.title || task.topic}</h3>
                          <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'warning' : 'secondary'}>
                            {task.status || 'pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{task.subject || 'General'}</p>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Duration</span>
                            <span>{duration} minutes</span>
                          </div>
                          {isActive && timerStatus === 'in-progress' && (
                            <div className="text-xs text-muted-foreground">
                              Timer running...
                            </div>
                          )}
                        </div>
                        {task.status !== 'completed' && (
                          isActive ? (
                            <Button size="sm" onClick={stopTask} variant="destructive">
                              <Square className="w-3 h-3 mr-1" />
                              Stop
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => startTask(task.id)} disabled={!!activeTaskId}>
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          )
                        )}
                      </div>
                    )
                  })
                )}
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
                    duration={tasks.find(t => t.id === activeTaskId)?.duration_minutes || 30}
                    status={timerStatus}
                    onStatusChange={handleTimerStatusChange}
                    onComplete={handleTimerComplete}
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
                  <span className="font-semibold">{tasks.filter(t=>t.status==='done').length}/{tasks.length||3}</span>
                </div>
                <Progress value={tasks.length? Math.round((tasks.filter(t=>t.status==='done').length/Math.max(1,tasks.length))*100):33} className="h-2" />
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
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
