"use client"

import { useEffect, useState, useMemo } from 'react'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useErrorContext } from '@/lib/error-context'
import { 
  Plus, 
  BookOpen,
  Timer,
  Target,
  Clock,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Lightbulb,
  Filter,
  TrendingUp,
  Flame
} from 'lucide-react'
import { EnhancedStudyTimer } from '@/components/ui/enhanced-study-timer'
import EnhancedRecommendationsPanel from '@/components/EnhancedRecommendationsPanel'
import { TaskErrorBoundary } from '@/components/tasks/TaskErrorBoundary'
import { TimerErrorBoundary } from '@/components/ui/timer-error-boundary'
import { useTasks } from '@/hooks/useTasks'
import { useStudySession } from '@/hooks/useStudySession'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface TaskFormData {
  title: string
  subject: string
  dueDate: string
  duration: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  priority: 'High' | 'Medium' | 'Low'
  description?: string
}

export default function TasksPage(){
  const { pushError } = useErrorContext()
  const { 
    today, 
    upcoming, 
    all, 
    loading: tasksLoading, 
    error: tasksError,
    createTask, 
    updateTask,
    completeTask,
    deleteTask,
    toggleTaskStatus,
    refresh: refreshTasks
  } = useTasks()
  
  const { 
    activeSession,
    isTimerRunning,
    elapsedTime,
    elapsedMinutes,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    getSessionStats
  } = useStudySession()

  // Component state
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [timerStatus, setTimerStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  
  // Quick log session form
  const [quickLogTopic, setQuickLogTopic] = useState('')
  const [quickLogMinutes, setQuickLogMinutes] = useState(25)
  const [quickLogStatus, setQuickLogStatus] = useState('')

  // Task form data
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: '',
    subject: '',
    dueDate: new Date().toISOString().split('T')[0],
    duration: 30,
    difficulty: 'Medium',
    priority: 'Medium',
    description: ''
  })

  // Plan sessions merging
  const [planToday, setPlanToday] = useState<any[]>([])
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    const fetchPlanToday = async () => {
      setPlanLoading(true)
      try {
        const resp = await api('/api/plan/current')
        const todayStr = new Date().toISOString().split('T')[0]
        const sessions = (resp?.sessions || []).filter((s: any) => s.date === todayStr)
        const mapped = sessions.map((s: any, idx: number) => ({
          id: `plan-${s.date}-${idx}`,
          title: s.topic || 'Study Session',
          subject: (s.topic || '').split(':')[0] || 'General',
          estimatedMinutes: s.duration_min || 45,
          duration_minutes: s.duration_min || 45,
          priority: 'Medium',
          status: s.status || 'pending',
          completed: s.status === 'completed',
          progress: s.status === 'completed' ? 100 : s.status === 'in-progress' ? 50 : 0,
          dueDate: s.date,
          fromPlan: true,
          __plan: { date: s.date, topic: s.topic }
        }))
        setPlanToday(mapped)
      } catch {
        setPlanToday([])
      } finally {
        setPlanLoading(false)
      }
    }
    fetchPlanToday()
  }, [])

  // Computed values
  const sessionStats = useMemo(() => {
    return getSessionStats()
  }, [getSessionStats])

  const todaysTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const base = all.filter(task => 
      task.dueDate === todayStr || task.due_date === todayStr
    )
    // Merge plan sessions (non-destructive)
    return [...base, ...planToday]
  }, [all, planToday])

  const filteredTasks = useMemo(() => {
    let filtered = todaysTasks
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(task => {
        if (selectedFilter === 'completed') {
          return task.status === 'completed' || task.completed
        }
        return task.status === selectedFilter
      })
    }
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(task => task.subject === selectedSubject)
    }
    
    return filtered.sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      const aDateStr = (a.dueDate || a.due_date) ?? ''
      const bDateStr = (b.dueDate || b.due_date) ?? ''
      const aTime = isNaN(new Date(aDateStr).getTime()) ? Number.POSITIVE_INFINITY : new Date(aDateStr).getTime()
      const bTime = isNaN(new Date(bDateStr).getTime()) ? Number.POSITIVE_INFINITY : new Date(bDateStr).getTime()
      return aTime - bTime
    })
  }, [todaysTasks, selectedFilter, selectedSubject])

  const availableSubjects = useMemo(() => {
    const subjects = [...new Set(all.map(task => task.subject).filter(Boolean))]
    return subjects.sort()
  }, [all])

  const todaysTopics = useMemo(() => {
    const topics = filteredTasks.map(task => task.subject || task.topic)
    return [...new Set(topics.filter((t): t is string => Boolean(t)))]
  }, [filteredTasks])

  const taskStats = useMemo(() => {
    const totalTasks = todaysTasks.length
    const completedTasks = todaysTasks.filter(task => task.status === 'completed' || task.completed).length
    const inProgressTasks = todaysTasks.filter(task => task.status === 'in-progress').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate
    }
  }, [todaysTasks])

  // Action handlers
  const handleStartTask = async (task: any) => {
    try {
      setProcessingIds(prev => new Set(prev).add(task.id))
      
      // Stop current task if different
      if (activeTaskId && activeTaskId !== task.id) {
        if (activeSession?.id) {
          await endSession({ sessionId: activeSession.id })
        }
      }
      
      // Start new session
      await startSession({ 
        taskId: task.fromPlan ? undefined : task.id, 
        durationMin: task.estimatedMinutes || task.duration_minutes || 25,
        topic: task.title,
        subject: task.subject
      })
      
      setActiveTaskId(task.id)
      setTimerStatus('in-progress')
      
      // Update task status (only for real tasks)
      if (!task.fromPlan) {
        await updateTask(task.id, { status: 'in-progress' })
      } else if (task.__plan) {
        // Optimistically update local plan item
        setPlanToday(prev => prev.map(p => p.id === task.id ? { ...p, status: 'in-progress' } : p))
        // Best-effort: update backend plan status to in-progress
        try {
          await api('/api/resources/progress', {
            method: 'POST',
            body: JSON.stringify({ sessions: [{ date: task.__plan.date, topic: task.__plan.topic, status: 'in-progress' }] })
          })
        } catch {}
      }
      
    } catch (e: any) {
      pushError({ 
        errorCode: e?.errorCode || 'SESSION_START_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to start task', 
        details: e 
      })
    } finally {
      setProcessingIds(prev => {
        const copy = new Set(prev)
        copy.delete(task.id)
        return copy
      })
    }
  }

  const handleCompleteTask = async (task: any) => {
    try {
      setProcessingIds(prev => new Set(prev).add(task.id))
      
      if (activeTaskId === task.id && activeSession?.id) {
        await endSession({ 
          sessionId: activeSession.id, 
          taskId: task.fromPlan ? undefined : task.id, 
          completed: true 
        })
        setActiveTaskId(null)
        setTimerStatus('pending')
      }
      
      if (!task.fromPlan) {
        await toggleTaskStatus(task.id)
      } else if (task.__plan) {
        // Update plan session to completed
        try {
          await api('/api/resources/progress', {
            method: 'POST',
            body: JSON.stringify({ sessions: [{ date: task.__plan.date, topic: task.__plan.topic, status: 'completed', duration_min: task.estimatedMinutes || task.duration_minutes || 25 }] })
          })
          setPlanToday(prev => prev.map(p => p.id === task.id ? { ...p, status: 'completed', completed: true, progress: 100 } : p))
        } catch (e) {
          pushError({ errorCode: 'PLAN_PROGRESS_FAIL', errorMessage: 'Failed to complete plan session', details: e })
        }
      }
      
    } catch (e: any) {
      pushError({ 
        errorCode: e?.errorCode || 'TASK_COMPLETE_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to complete task', 
        details: e 
      })
    } finally {
      setProcessingIds(prev => {
        const copy = new Set(prev)
        copy.delete(task.id)
        return copy
      })
    }
  }

  const handleDeleteTask = async (task: any) => {
    if (task.fromPlan) {
      alert('Plan sessions cannot be deleted here. You can adjust your plan in the Planner page.')
      return
    }

    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return
    }
    
    try {
      setProcessingIds(prev => new Set(prev).add(task.id))
      
      // Stop session if this task is active
      if (activeTaskId === task.id && activeSession?.id) {
        await endSession({ sessionId: activeSession.id })
        setActiveTaskId(null)
        setTimerStatus('pending')
      }
      
      await deleteTask(task.id)
      
    } catch (e: any) {
      pushError({ 
        errorCode: e?.errorCode || 'TASK_DELETE_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to delete task', 
        details: e 
      })
    } finally {
      setProcessingIds(prev => {
        const copy = new Set(prev)
        copy.delete(task.id)
        return copy
      })
    }
  }

  const handleCreateTask = async () => {
    try {
      await createTask({
        ...taskFormData,
        dueDate: taskFormData.dueDate,
        estimatedMinutes: taskFormData.duration,
        status: 'pending',
        completed: false,
        phase: 'active'
      })
      
      setShowCreateTaskDialog(false)
      setTaskFormData({
        title: '',
        subject: '',
        dueDate: new Date().toISOString().split('T')[0],
        duration: 30,
        difficulty: 'Medium',
        priority: 'Medium',
        description: ''
      })
      
    } catch (e: any) {
      pushError({ 
        errorCode: e?.errorCode || 'TASK_CREATE_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to create task', 
        details: e 
      })
    }
  }

  const handleTimerStatusChange = (newStatus: 'pending' | 'in-progress' | 'completed') => {
    setTimerStatus(newStatus)
  }

  const handleTimerComplete = async (actualTime: number) => {
    if (!activeTaskId) return
    
    try {
      // Complete the session and task/plan
      if (activeSession?.id) {
        await endSession({ 
          sessionId: activeSession.id, 
          taskId: planToday.some(p => p.id === activeTaskId) ? undefined : activeTaskId, 
          actualMinutes: actualTime, 
          completed: true 
        })
      }

      const isPlan = planToday.some(p => p.id === activeTaskId)
      if (isPlan) {
        const planItem = planToday.find(p => p.id === activeTaskId)
        if (planItem?.__plan) {
          try {
            await api('/api/resources/progress', {
              method: 'POST',
              body: JSON.stringify({ sessions: [{ date: planItem.__plan.date, topic: planItem.__plan.topic, status: 'completed', duration_min: actualTime }] })
            })
            setPlanToday(prev => prev.map(p => p.id === activeTaskId ? { ...p, status: 'completed', completed: true, progress: 100 } : p))
          } catch (e) {
            pushError({ errorCode: 'PLAN_PROGRESS_FAIL', errorMessage: 'Failed to update plan after timer', details: e })
          }
        }
      } else {
        await updateTask(activeTaskId, { 
          status: 'completed', 
          completed: true, 
          progress: 100 
        })
      }
      
      setActiveTaskId(null)
      setTimerStatus('pending')
      
    } catch (e: any) {
      pushError({ 
        errorCode: e?.errorCode || 'TIMER_COMPLETE_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to complete timer', 
        details: e 
      })
    }
  }

  const handleQuickLogSession = async () => {
    try {
      await startSession({
        topic: quickLogTopic || 'General Study',
        subject: 'General',
        durationMin: quickLogMinutes
      })
      
      // Immediately complete the session
      if (activeSession?.id) {
        await endSession({
          sessionId: activeSession.id,
          actualMinutes: quickLogMinutes,
          completed: true
        })
      }
      
      setQuickLogStatus('Session logged successfully!')
      setQuickLogTopic('')
      setQuickLogMinutes(25)
      
      setTimeout(() => setQuickLogStatus(''), 3000)
      
    } catch (e: any) {
      pushError({ 
        errorCode: e?.errorCode || 'QUICK_LOG_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to log session', 
        details: e 
      })
    }
  }

  // Add sample tasks for demo
  const addSampleTasks = async () => {
    const sampleTasks = [
      {
        title: 'Study Algebra - Linear Equations',
        subject: 'Mathematics',
        dueDate: new Date().toISOString().split('T')[0],
        duration: 45,
        difficulty: 'Medium' as const,
        priority: 'High' as const,
        description: 'Review chapter 3 on solving linear equations'
      },
      {
        title: 'Read Physics - Motion Laws',
        subject: 'Physics',
        dueDate: new Date().toISOString().split('T')[0],
        duration: 30,
        difficulty: 'Medium' as const,
        priority: 'Medium' as const,
        description: "Study Newton's laws of motion"
      },
      {
        title: 'Chemistry Lab Report',
        subject: 'Chemistry',
        dueDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
        duration: 60,
        difficulty: 'Hard' as const,
        priority: 'High' as const,
        description: 'Complete the organic chemistry lab report'
      }
    ]
    
    for (const task of sampleTasks) {
      await createTask({
        ...task,
        estimatedMinutes: task.duration,
        status: 'pending',
        completed: false,
        phase: 'active'
      })
    }
  }

  return (
    <TaskErrorBoundary>
      <MainLayout>
        <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tasks & Sessions</h1>
            <p className="text-muted-foreground">Manage your study tasks and track your learning progress</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Study Calculus Chapter 5"
                      value={taskFormData.title}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="e.g., Mathematics"
                        value={taskFormData.subject}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={taskFormData.dueDate}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (min)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="5"
                        max="240"
                        value={taskFormData.duration}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={taskFormData.difficulty}
                        onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => 
                          setTaskFormData(prev => ({ ...prev, difficulty: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={taskFormData.priority}
                        onValueChange={(value: 'High' | 'Medium' | 'Low') => 
                          setTaskFormData(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add any additional details..."
                      rows={3}
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateTaskDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateTask}
                    disabled={!taskFormData.title || !taskFormData.subject}
                  >
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Tasks</p>
                  <p className="text-3xl font-bold">{taskStats.totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              {taskStats.totalTasks > 0 && (
                <div className="mt-4 space-y-1">
                  <Progress value={taskStats.completionRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">{taskStats.completionRate}% complete</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{taskStats.completedTasks}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Time Today</p>
                  <p className="text-3xl font-bold">{sessionStats.totalTimeToday}<span className="text-lg font-normal">min</span></p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Streak</p>
                  <p className="text-3xl font-bold">{sessionStats.currentStreak}<span className="text-lg font-normal">days</span></p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Tasks Button */}
        {todaysTasks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-semibold mb-2">No tasks for today</p>
                <p className="text-muted-foreground mb-4">Create your first task or add some sample tasks to get started.</p>
                <div className="flex items-center gap-3 justify-center">
                  <Button onClick={() => setShowCreateTaskDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                  <Button onClick={addSampleTasks} variant="outline">
                    Add Sample Tasks
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {tasksLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tasksError ? (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Failed to load tasks</h3>
                <p className="text-muted-foreground mb-4">{tasksError}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Tasks List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Tasks */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Today's Tasks
                      </CardTitle>
                      <CardDescription>Your study tasks for today</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Filters */}
                  <div className="flex items-center gap-4 mb-6">
                    <Select value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as 'all' | 'pending' | 'in-progress' | 'completed')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {availableSubjects.length > 0 && (
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {availableSubjects.map((subject: string) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task: any) => (
                        <Card key={task.id} className={cn(
                          "hover:shadow-md transition-all duration-200",
                          activeTaskId === task.id && "ring-2 ring-primary"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-base mb-1 line-clamp-1">
                                      {task.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {task.subject} • {task.estimatedMinutes || task.duration_minutes || 30} min
                                    </p>
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={cn(
                                      "text-xs",
                                      task.priority === 'High' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                                      task.priority === 'Medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
                                      task.priority === 'Low' && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                    )} variant="secondary">
                                      {task.priority}
                                    </Badge>
                                    <Badge variant={
                                      task.completed || task.status === 'completed' ? 'default' : 
                                      task.status === 'in-progress' ? 'secondary' : 'outline'
                                    }>
                                      {task.completed || task.status === 'completed' ? 'Completed' : 
                                       task.status === 'in-progress' ? 'In Progress' : 'Pending'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {task.progress !== undefined && task.progress > 0 && (
                                  <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Progress</span>
                                      <span>{Math.round(task.progress)}%</span>
                                    </div>
                                    <Progress value={task.progress} className="h-2" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                {activeTaskId === task.id ? (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="default" className="text-xs">
                                      <Timer className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleCompleteTask(task)}
                                      disabled={processingIds.has(task.id)}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    {!task.completed && task.status !== 'completed' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleStartTask(task)}
                                        disabled={processingIds.has(task.id) || (!!activeTaskId && activeTaskId !== task.id)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        {processingIds.has(task.id) ? (
                                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <PlayCircle className="w-3 h-3 mr-1" />
                                        )}
                                        Start
                                      </Button>
                                    )}
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCompleteTask(task)}
                                      disabled={processingIds.has(task.id)}
                                    >
                                      {processingIds.has(task.id) ? (
                                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                    </Button>
                                    
                                    {!task.fromPlan && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteTask(task)}
                                        disabled={processingIds.has(task.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                        <p className="text-muted-foreground">
                          {selectedFilter !== 'all' || selectedSubject !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first task to get started'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Upcoming Tasks */}
              {upcoming.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Tasks</CardTitle>
                    <CardDescription>Tasks scheduled for future dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcoming.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {task.subject} • Due {new Date(task.dueDate || task.due_date).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="outline">{task.estimatedMinutes || 30}min</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Study Timer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5" />
                    Study Timer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTaskId ? (
                    <TimerErrorBoundary 
                      taskTitle={filteredTasks.find((t: any) => t.id === activeTaskId)?.title}
                      compact={false}
                    >
                      <EnhancedStudyTimer
                        duration={((): number => {
                          const task = filteredTasks.find((t: any) => t.id === activeTaskId)
                          return task?.estimatedMinutes || task?.duration_minutes || 30
                        })()}
                        status={timerStatus}
                        onStatusChange={handleTimerStatusChange}
                        onComplete={handleTimerComplete}
                        taskId={activeTaskId}
                        taskTitle={filteredTasks.find((t: any) => t.id === activeTaskId)?.title}
                        subject={filteredTasks.find((t: any) => t.id === activeTaskId)?.subject}
                        compact={false}
                        showTaskInfo={true}
                      />
                    </TimerErrorBoundary>
                  ) : (
                    <div className="text-center py-8">
                      <Timer className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Select a task to start the timer</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Log Session */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Log Session</CardTitle>
                  <CardDescription>Log a completed study session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickTopic">Topic</Label>
                    <Input
                      id="quickTopic"
                      placeholder="e.g., Math Review"
                      value={quickLogTopic}
                      onChange={(e) => setQuickLogTopic(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quickDuration">Duration (minutes)</Label>
                    <Input
                      id="quickDuration"
                      type="number"
                      min="1"
                      max="300"
                      value={quickLogMinutes}
                      onChange={(e) => setQuickLogMinutes(parseInt(e.target.value) || 25)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleQuickLogSession} 
                    className="w-full"
                    disabled={!quickLogTopic.trim()}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Log Session
                  </Button>
                  
                  {quickLogStatus && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">{quickLogStatus}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {sessionStats.sessionsToday}
                      </div>
                      <div className="text-xs text-muted-foreground">Sessions</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {sessionStats.totalTimeToday}
                      </div>
                      <div className="text-xs text-muted-foreground">Minutes</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Daily Goal</span>
                      <span>{sessionStats.totalTimeToday}/120 min</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (sessionStats.totalTimeToday / 120) * 100)} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Recommended Resources
                  </CardTitle>
                  <CardDescription>AI-powered suggestions for today's topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedRecommendationsPanel 
                    topics={todaysTopics} 
                    maxItems={5}
                    compact={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        </div>
      </MainLayout>
    </TaskErrorBoundary>
  )
}
