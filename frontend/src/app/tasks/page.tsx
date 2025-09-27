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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
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
  status: 'pending' | 'in-progress' | 'completed'
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
  
  // Analytics data for streak display
  const [analyticsData, setAnalyticsData] = useState<any>(null)

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
    status: 'pending',
    description: ''
  })

  // Plan sessions merging
  const [planToday, setPlanToday] = useState<any[]>([])
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    const fetchPlanToday = async () => {
      setPlanLoading(true)
      try {
        const [planResp, analyticsResp] = await Promise.all([
          api('/api/plan/current'),
          api('/api/analytics/student').catch(() => null)
        ])
        
        if (analyticsResp) setAnalyticsData(analyticsResp)
        
        const todayStr = new Date().toISOString().split('T')[0]
        const sessions = (planResp?.sessions || []).filter((s: any) => s.date === todayStr)
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
        // Use the dedicated completeTask action for real tasks to ensure backend endpoint is used
        await completeTask(task.id)
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
        status: taskFormData.status,
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
        status: 'pending',
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
    setProcessingIds(prev => new Set(prev).add(activeTaskId))
    try {
      // End the session first so backend records the actual minutes
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
        // Use the dedicated completeTask API for non-plan tasks
        try {
          await completeTask(activeTaskId)
        } catch (e) {
          // Fallback to updateTask if completeTask fails for any reason
          await updateTask(activeTaskId, { status: 'completed', completed: true, progress: 100 })
        }
      }

      setActiveTaskId(null)
      setTimerStatus('pending')

    } catch (e: any) {
      pushError({ 
        errorCode: e?.errorCode || 'TIMER_COMPLETE_FAIL', 
        errorMessage: e?.errorMessage || 'Failed to complete timer', 
        details: e 
      })
    } finally {
      setProcessingIds(prev => {
        const copy = new Set(prev)
        copy.delete(activeTaskId)
        return copy
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


  // Add validation state for modal
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateAndCreateTask = async () => {
    const errors: Record<string, string> = {}
    
    if (!taskFormData.title.trim()) {
      errors.title = 'Task title cannot be empty'
    }
    if (!taskFormData.subject.trim()) {
      errors.subject = 'Subject is required'
    }
    if (!taskFormData.dueDate) {
      errors.dueDate = 'Due date is required'
    }
    
    setFormErrors(errors)
    
    if (Object.keys(errors).length === 0) {
      await handleCreateTask()
    }
  }

  const resetForm = () => {
setTaskFormData({
      title: '',
      subject: '',
      dueDate: new Date().toISOString().split('T')[0],
      duration: 30,
      difficulty: 'Medium',
      priority: 'Medium',
      status: 'pending',
      description: ''
    })
    setFormErrors({})
  }

  return (
    <TaskErrorBoundary>
      <MainLayout>
        <div className="container mx-auto p-8 max-w-[1440px]">
        {/* Enhanced Header with better hierarchy */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tasks & Sessions
            </h1>
            <p className="text-muted-foreground mt-2">Manage your study tasks and track your learning progress</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={showCreateTaskDialog} onOpenChange={(open: boolean) => {
              setShowCreateTaskDialog(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-sm">
                    <Plus className="w-5 h-5 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4 border-b relative">
                    <DialogTitle className="text-2xl">Create a New Task</DialogTitle>
                    <DialogDescription>
                      Add a new study task to your schedule. Fields marked with * are required.
                    </DialogDescription>
                    {/* X close button top-right */}
                    <DialogClose asChild>
                      <button aria-label="Close" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        <span className="sr-only">Close</span>
                        ✕
                      </button>
                    </DialogClose>
                  </DialogHeader>
                
                <div className="space-y-6 py-6">
                  {/* Task Title - Full Width */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Task Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter the name of your task"
                      value={taskFormData.title}
                      onChange={(e) => {
                        setTaskFormData(prev => ({ ...prev, title: e.target.value }))
                        if (formErrors.title) {
                          setFormErrors(prev => ({ ...prev, title: '' }))
                        }
                      }}
                      className={cn(
                        "transition-all",
                        formErrors.title && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-500 mt-2">{formErrors.title}</p>
                    )}
                  </div>
                  
                  {/* Subject and Due Date - Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        placeholder="e.g., Mathematics"
                        value={taskFormData.subject}
                        onChange={(e) => {
                          setTaskFormData(prev => ({ ...prev, subject: e.target.value }))
                          if (formErrors.subject) {
                            setFormErrors(prev => ({ ...prev, subject: '' }))
                          }
                        }}
                        className={cn(
                          "transition-all",
                          formErrors.subject && "border-red-500 focus:ring-red-500"
                        )}
                      />
                      {formErrors.subject && (
                        <p className="text-sm text-red-500 mt-2">{formErrors.subject}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="text-sm font-medium">
                        Due Date *
                      </Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={taskFormData.dueDate}
                        onChange={(e) => {
                          setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))
                          if (formErrors.dueDate) {
                            setFormErrors(prev => ({ ...prev, dueDate: '' }))
                          }
                        }}
                        className={cn(
                          "transition-all",
                          formErrors.dueDate && "border-red-500 focus:ring-red-500"
                        )}
                      />
                      {formErrors.dueDate && (
                        <p className="text-sm text-red-500 mt-2">{formErrors.dueDate}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Priority and Status - Side by Side */}
<div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium">
                        Priority
                      </Label>
                      <Select
                        value={taskFormData.priority}
                        onValueChange={(value: 'High' | 'Medium' | 'Low') => 
                          setTaskFormData(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger className="transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Status
                      </Label>
                      <Select
                        value={taskFormData.status}
                        onValueChange={(value: 'pending' | 'in-progress' | 'completed') => 
                          setTaskFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger className="transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">
                      Estimated Duration (minutes)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="240"
                      value={taskFormData.duration}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                      className="transition-all"
                    />
                  </div>
                  
                  {/* Description - Full Width Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description (Optional)
                    </Label>
<Textarea
                      id="description"
                      placeholder="Add any additional details about this task..."
                      rows={4}
                      value={taskFormData.description}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="resize-y transition-all"
                    />
                  </div>
                </div>
                
                <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      onClick={resetForm}
                      className="transition-all"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button 
                    onClick={validateAndCreateTask}
                    className="transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Stats Cards - Cleaner design */}
        <div className="grid grid-cols-3 gap-6 mb-8">
<Card className="border hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedFilter('all')}>
            <CardContent className="p-6">
              <div className="flex flex-col">
                <p className="text-3xl font-bold">{taskStats.totalTasks}</p>
                <p className="text-sm text-muted-foreground mt-2">Today's tasks</p>
              </div>
            </CardContent>
          </Card>

<Card className="border hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedFilter('completed')}>
            <CardContent className="p-6">
              <div className="flex flex-col">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{taskStats.completedTasks}</p>
                <p className="text-sm text-muted-foreground mt-2">Completed</p>
              </div>
            </CardContent>
          </Card>

<Card className="border hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedFilter('in-progress')}>
            <CardContent className="p-6">
              <div className="flex flex-col">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{sessionStats.totalTimeToday} min</p>
                <p className="text-sm text-muted-foreground mt-2">Study time today</p>
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
                <p className="text-lg font-semibold mb-4">No tasks for today</p>
                <p className="text-muted-foreground mb-4">Create a task or plan a session to get started.</p>
                <div className="flex items-center gap-4 justify-center">
                  <Button onClick={() => setShowCreateTaskDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Two-Column Layout: 65% main, 35% sidebar */}
        {tasksLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[65fr,35fr] gap-8">
            <div className="space-y-4">
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
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-32" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : tasksError ? (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-4">Failed to load tasks</h3>
                <p className="text-muted-foreground mb-4">{tasksError}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[65fr,35fr] gap-8">
            {/* Main Column - Primary Focus Area */}
            <div className="space-y-6">
              {/* Today's Focus - Featured Task with enhanced styling */}
              {filteredTasks.length > 0 && filteredTasks.filter(t => !t.completed && t.status !== 'completed').length > 0 && (
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Today's Focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const nextTask = filteredTasks.find(t => !t.completed && t.status !== 'completed')
                      if (!nextTask) return null
                      return (
                        <div>
                          <h3 className="font-semibold text-xl mb-4">{nextTask.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4" />
                              {nextTask.subject}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {nextTask.estimatedMinutes || nextTask.duration_minutes || 30} min
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {nextTask.priority || 'Medium'} Priority
                            </Badge>
                          </div>
                          <Button 
                            onClick={() => handleStartTask(nextTask)}
                            disabled={processingIds.has(nextTask.id) || (!!activeTaskId && activeTaskId !== nextTask.id)}
                            className="w-full bg-primary hover:bg-primary/90 font-medium py-5"
                            size="lg"
                          >
                            {processingIds.has(nextTask.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <PlayCircle className="w-5 h-5 mr-2" />
                                Start This Task
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Today's Tasks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Today's Tasks</CardTitle>
                      <CardDescription>Your study schedule for today</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Filters */}
                  <div className="flex items-center gap-4 mb-8">
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

                  {/* Tasks List with improved spacing and interaction */}
                  <div className="space-y-3">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className={cn(
                            "group relative p-5 rounded-lg border bg-card hover:shadow-md transition-all duration-200",
                            activeTaskId === task.id && "ring-2 ring-primary border-primary",
                            task.completed || task.status === 'completed' ? "opacity-60" : ""
                          )}
                        >
                          <div className="flex items-start gap-4">
                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base mb-2">
                                    {task.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {task.subject}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {(task.completed || task.status === 'completed') && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  )}
                                  {!task.fromPlan && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            setEditingTask(task)
                                            // Open edit dialog
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        {!task.completed && task.status !== 'completed' && (
                                          <DropdownMenuItem 
                                            onClick={() => handleCompleteTask(task)}
                                            className="cursor-pointer"
                                          >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Mark as Complete
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteTask(task)}
                                          className="cursor-pointer text-red-600 dark:text-red-400"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                {task.dueDate && (
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Due {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {task.estimatedMinutes || task.duration_minutes || 30} min
                                </span>
                                <Badge className={cn(
                                  "text-xs",
                                  task.priority === 'High' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                                  task.priority === 'Medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
                                  task.priority === 'Low' && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                )} variant="secondary">
                                  {task.priority} Priority
                                </Badge>
                              </div>
                              
                              {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                  {task.description}
                                </p>
                              )}
                              
                              {task.progress !== undefined && task.progress > 0 && (
                                <div className="mb-4">
                                  <div className="flex justify-between text-xs mb-2">
                                    <span>Progress</span>
                                    <span>{Math.round(task.progress)}%</span>
                                  </div>
                                  <Progress value={task.progress} className="h-2" />
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 mt-3">
                                {activeTaskId === task.id ? (
                                  <>
                                    <Badge variant="default" className="text-xs">
                                      <Timer className="w-3 h-3 mr-1" />
                                      Timer Running
                                    </Badge>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleCompleteTask(task)}
                                      disabled={processingIds.has(task.id)}
                                    >
                                      Mark Complete
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {!task.completed && task.status !== 'completed' && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleStartTask(task)}
                                        disabled={processingIds.has(task.id) || (!!activeTaskId && activeTaskId !== task.id)}
                                      >
                                        {processingIds.has(task.id) ? (
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <>
                                            <PlayCircle className="w-4 h-4 mr-1" />
                                            Start
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    
                                    {(task.completed || task.status === 'completed') ? (
                                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Completed
                                      </span>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCompleteTask(task)}
                                        disabled={processingIds.has(task.id)}
                                      >
                                        {processingIds.has(task.id) ? (
                                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <>
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            Complete
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    
                                    {!task.fromPlan && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteTask(task)}
                                        disabled={processingIds.has(task.id)}
                                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
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
                        <div key={task.id} className="group flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {task.subject} • Due {new Date(task.dueDate || task.due_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{task.estimatedMinutes || 30}min</Badge>
                            {!task.fromPlan && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setEditingTask(task)
                                      // TODO: open edit modal
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {!task.completed && task.status !== 'completed' && (
                                    <DropdownMenuItem 
                                      onClick={() => handleCompleteTask(task)}
                                      className="cursor-pointer"
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Mark as Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTask(task)}
                                    className="cursor-pointer text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Auxiliary Tools */}
            <div className="space-y-6">
              {/* Study Timer - Enhanced Design */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    Study Timer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTaskId ? (
                    <TimerErrorBoundary 
                      taskTitle={filteredTasks.find((t: any) => t.id === activeTaskId)?.title}
                      compact={false}
                    >
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Active Task</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {filteredTasks.find((t: any) => t.id === activeTaskId)?.title}
                          </p>
                        </div>
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
                          showTaskInfo={false}
                        />
                      </div>
                    </TimerErrorBoundary>
                  ) : (
                    <div className="text-center py-12">
                      <Timer className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">Select a task to start the timer</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Log Session - Cleaner Design */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Quick Log Session</CardTitle>
                  <CardDescription className="text-xs">Log a completed study session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickTopic" className="text-sm">Topic</Label>
                    <Input
                      id="quickTopic"
                      placeholder="e.g., Math Review"
                      value={quickLogTopic}
                      onChange={(e) => setQuickLogTopic(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quickDuration" className="text-sm">Duration (minutes)</Label>
                    <Input
                      id="quickDuration"
                      type="number"
                      min="1"
                      max="300"
                      value={quickLogMinutes}
                      onChange={(e) => setQuickLogMinutes(parseInt(e.target.value) || 25)}
                      className="h-9"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleQuickLogSession} 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={!quickLogTopic.trim()}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Log Session
                  </Button>
                  
                  {quickLogStatus && (
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="text-xs text-green-800 dark:text-green-200">{quickLogStatus}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Today's Progress - Simplified */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Today's Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Single Progress Bar Design */}
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm font-medium">Daily Goal</span>
                        <span className="text-sm text-muted-foreground">
                          {taskStats.completedTasks} / {taskStats.totalTasks} Tasks
                        </span>
                      </div>
                      <Progress 
                        value={taskStats.completionRate} 
                        className="h-2 mb-1" 
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {taskStats.completionRate}% Complete
                      </p>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Study Time</span>
                        <span className="text-sm text-muted-foreground">
                          {sessionStats.totalTimeToday}m / 180m
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (sessionStats.totalTimeToday / 180) * 100)} 
                        className="h-2 mb-1" 
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {Math.round((sessionStats.totalTimeToday / 180) * 100)}% of target
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-lg font-semibold">
                          {sessionStats.sessionsToday}
                        </div>
                        <div className="text-xs text-muted-foreground">Sessions</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="text-lg font-semibold">
                          <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
                          {analyticsData?.profile?.streak_days || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Day Streak</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Recommendations - YouTube Primary */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-red-600" />
                    Recommended Resources
                  </CardTitle>
                  <CardDescription className="text-xs">Curated content for today's topics</CardDescription>
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
