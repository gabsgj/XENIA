'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
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
  Timer
} from 'lucide-react'

export default function TasksPage(){
  const [topic, setTopic] = useState('Algebra')
  const [minutes, setMinutes] = useState(30)
  const [status, setStatus] = useState('')
  const [activeTimer, setActiveTimer] = useState<boolean>(false)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const { pushError } = useErrorContext()
  const [tasks, setTasks] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(()=>{
    (async()=>{
      try{
  const data = await api('/api/analytics/student')
        setTasks(data.tasks||[])
        setSessions(data.sessions||[])
      }catch(e:any){
        pushError({
          errorCode: e?.errorCode||'CONTENT_API_FAIL',
          errorMessage: e?.errorMessage,
          details: e
        })
      }
    })()
  },[pushError])

  const mockTasks = [
    {
      id: 1,
      title: "Complete Organic Chemistry Practice Problems",
      subject: "Chemistry",
      status: "in-progress",
      progress: 60,
      estimatedTime: 60,
      completedTime: 36
    },
    {
      id: 2,
      title: "Review Calculus Derivatives",
      subject: "Mathematics", 
      status: "pending",
      progress: 0,
      estimatedTime: 45,
      completedTime: 0
    },
    {
      id: 3,
      title: "Physics Lab Report",
      subject: "Physics",
      status: "completed", 
      progress: 100,
      estimatedTime: 90,
      completedTime: 85
    }
  ]

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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Your current study tasks and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(tasks.length?tasks:mockTasks).map((task:any) => (
                  <div key={task.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{task.title||task.topic}</h3>
                      <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'warning' : 'secondary'}>
                        {task.status||'pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{task.subject||'General'}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{task.progress||0}%</span>
                      </div>
                      <Progress value={task.progress||0} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{task.completedTime||0} min completed</span>
                        <span>{task.estimatedTime||30} min total</span>
                      </div>
                    </div>
                    {task.status !== 'completed' && (
                      <Button size="sm">
                        <Play className="w-3 h-3 mr-1" />
                        {task.status === 'in-progress' ? 'Continue' : 'Start'}
                      </Button>
                    )}
                  </div>
                ))}
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
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold">{String(Math.floor(timerMinutes / 60)).padStart(2, '0')}:{String(timerMinutes % 60).padStart(2, '0')}</div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => setActiveTimer(!activeTimer)}>
                      {activeTimer ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTimerMinutes(0)}>
                      Reset
                    </Button>
                  </div>
                </div>
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
                  <span className="font-semibold">{sessions.reduce((a,b)=>a+(b.duration_min||0),0)}/180 min</span>
                </div>
                <Progress value={Math.min(100, Math.round((sessions.reduce((a,b)=>a+(b.duration_min||0),0)/180)*100))} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
