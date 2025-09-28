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
import { TaskList, FocusCard, UpcomingList, QuickLogPanel, DailyProgressCard, ActiveTimerDock } from '@/components/tasks'
import { useTasks } from '@/hooks/useTasks'
import { useStudySession } from '@/hooks/useStudySession'
import { cn } from '@/lib/utils'
import { api, getUserId } from '@/lib/api'

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
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false)
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
      
// For plan items, do not create a backend task session (no task_id). Just mark in-progress.
      if (task.fromPlan) {
        setActiveTaskId(task.id)
        setTimerStatus('in-progress')
      } else {
        // Start new session tied to the task
        await startSession({ 
          taskId: task.id, 
          durationMin: task.estimatedMinutes || task.duration_minutes || 25,
          topic: task.title,
          subject: task.subject
        })
        setActiveTaskId(task.id)
        setTimerStatus('in-progress')
        await updateTask(task.id, { status: 'in-progress' })
      }
      
      // For plan items, optimistically update local plan and notify backend
      if (task.fromPlan && task.__plan) {
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
    const isActive = activeTaskId === task.id
    try {
      setProcessingIds(prev => new Set(prev).add(task.id))
      
      if (isActive && activeSession?.id) {
        await endSession({ 
          sessionId: activeSession.id, 
          taskId: task.fromPlan ? undefined : task.id, 
          completed: true 
        })
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
      
      // Always stop the timer UI if this was the active task (even if no backend session was created)
      if (isActive) {
        setActiveTaskId(null)
        setTimerStatus('pending')
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
        title: taskFormData.title,
        subject: taskFormData.subject,
        dueDate: taskFormData.dueDate,
        estimatedMinutes: taskFormData.duration,
        difficulty: taskFormData.difficulty,
        priority: taskFormData.priority,
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
      // Use track endpoint for logging ad-hoc sessions without a task_id
      await api('/api/tasks/track', {
        method: 'POST',
        body: JSON.stringify({
          user_id: getUserId(),
          topic: quickLogTopic || 'General Study',
          duration_min: quickLogMinutes
        })
      })
      
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

  // Edit form state
  const [editFormData, setEditFormData] = useState<TaskFormData | null>(null)

  useEffect(() => {
    if (editingTask) {
      setEditFormData({
        title: editingTask.title || '',
        subject: editingTask.subject || 'General',
        dueDate: (editingTask.dueDate || editingTask.due_date) ?? new Date().toISOString().split('T')[0],
        duration: Number(editingTask.estimatedMinutes || editingTask.duration_minutes || 30),
        difficulty: (editingTask.difficulty || 'Medium') as TaskFormData['difficulty'],
        priority: (editingTask.priority || 'Medium') as TaskFormData['priority'],
        status: (editingTask.status || 'pending') as TaskFormData['status'],
        description: editingTask.description || ''
      })
    } else {
      setEditFormData(null)
    }
  }, [editingTask])

  const validateAndUpdateTask = async () => {
    if (!editingTask || !editFormData) return
    const errors: Record<string, string> = {}
    if (!editFormData.title.trim()) errors.title = 'Task title cannot be empty'
    if (!editFormData.subject.trim()) errors.subject = 'Subject is required'
    if (!editFormData.dueDate) errors.dueDate = 'Due date is required'
    setFormErrors(errors)
    if (Object.keys(errors).length === 0) {
      try {
        await updateTask(editingTask.id, {
          title: editFormData.title,
          subject: editFormData.subject,
          dueDate: editFormData.dueDate,
          estimatedMinutes: editFormData.duration,
          difficulty: editFormData.difficulty,
          priority: editFormData.priority,
          status: editFormData.status,
          description: editFormData.description
        } as any)
        setShowEditTaskDialog(false)
        setEditingTask(null)
      } catch (e) {
        // error surfaced by error context
      }
    }
  }

  return (
    <TaskErrorBoundary>
      <MainLayout>
        <div className="container mx-auto p-8 max-w-[1440px]">
        {/* Enhanced Header with better hierarchy */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tasks & Sessions
            </h1>
            <p className="text-muted-foreground mt-2">Manage your study tasks and track your learning progress</p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <ActiveTimerDock 
              activeTaskId={activeTaskId}
              task={filteredTasks.find((t: any) => t.id === activeTaskId)}
              status={timerStatus}
              onStatusChange={handleTimerStatusChange}
              onComplete={handleTimerComplete}
            />

            <div className="flex items-center gap-3">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 shadow-sm"
                onClick={() => setShowCreateTaskDialog(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Modal for Task Creation */}
        {showCreateTaskDialog && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
              onClick={() => {
                setShowCreateTaskDialog(false)
                resetForm()
              }}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
              <div 
                className="bg-background border rounded-lg shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-background border-b px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">Create a New Task</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add a new study task to your schedule. Fields marked with * are required.
                      </p>
                    </div>
                    <button 
                      aria-label="Close" 
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      onClick={() => {
                        setShowCreateTaskDialog(false)
                        resetForm()
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6 px-6 py-6">
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
                
                <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateTaskDialog(false)
                      resetForm()
                    }}
                    className="transition-all"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={validateAndCreateTask}
                    className="transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Create Task
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit Task Modal */}
        {showEditTaskDialog && editingTask && editFormData && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
              onClick={() => {
                setShowEditTaskDialog(false)
                setEditingTask(null)
              }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
              <div
                className="bg-background border rounded-lg shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-background border-b px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">Edit Task</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Update your task details.
                      </p>
                    </div>
                    <button
                      aria-label="Close"
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      onClick={() => {
                        setShowEditTaskDialog(false)
                        setEditingTask(null)
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-6 px-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="text-sm font-medium">
                      Task Title *
                    </Label>
                    <Input
                      id="edit-title"
                      placeholder="Enter the name of your task"
                      value={editFormData.title}
                      onChange={(e) => {
                        setEditFormData(prev => prev ? ({ ...prev, title: e.target.value }) : prev)
                        if (formErrors.title) setFormErrors(prev => ({ ...prev, title: '' }))
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-subject" className="text-sm font-medium">
                        Subject *
                      </Label>
                      <Input
                        id="edit-subject"
                        value={editFormData.subject}
                        onChange={(e) => {
                          setEditFormData(prev => prev ? ({ ...prev, subject: e.target.value }) : prev)
                          if (formErrors.subject) setFormErrors(prev => ({ ...prev, subject: '' }))
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
                      <Label htmlFor="edit-dueDate" className="text-sm font-medium">
                        Due Date *
                      </Label>
                      <Input
                        id="edit-dueDate"
                        type="date"
                        value={editFormData.dueDate}
                        onChange={(e) => {
                          setEditFormData(prev => prev ? ({ ...prev, dueDate: e.target.value }) : prev)
                          if (formErrors.dueDate) setFormErrors(prev => ({ ...prev, dueDate: '' }))
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Priority</Label>
                      <Select
                        value={editFormData.priority}
                        onValueChange={(value: 'High' | 'Medium' | 'Low') => setEditFormData(prev => prev ? ({ ...prev, priority: value }) : prev)}
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
                      <Label className="text-sm font-medium">Status</Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(value: 'pending' | 'in-progress' | 'completed') => setEditFormData(prev => prev ? ({ ...prev, status: value }) : prev)}
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Estimated Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="240"
                      value={editFormData.duration}
                      onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, duration: parseInt(e.target.value) || 30 }) : prev)}
                      className="transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      rows={4}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                      className="resize-y transition-all"
                    />
                  </div>
                </div>
                <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditTaskDialog(false)
                      setEditingTask(null)
                    }}
                    className="transition-all"
                  >
                    Cancel
                  </Button>
                  <Button onClick={validateAndUpdateTask} className="transition-all">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

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
              {(() => {
                const nextTask = filteredTasks.find((t: any) => !t.completed && t.status !== 'completed')
                return nextTask ? (
                  <FocusCard 
                    task={nextTask as any}
                    onStart={(t) => handleStartTask(t)}
                    processing={processingIds.has(nextTask.id)}
                    activeTaskId={activeTaskId}
                  />
                ) : null
              })()}

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
                      <TaskList 
                        tasks={filteredTasks as any}
                        activeTaskId={activeTaskId}
                        processingIds={processingIds}
                        onStart={(t) => handleStartTask(t)}
                        onComplete={(t) => handleCompleteTask(t)}
                        onDelete={(t) => handleDeleteTask(t)}
                        onEdit={(t) => { setEditingTask(t); setShowEditTaskDialog(true) }}
                      />
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
                    <UpcomingList 
                      tasks={upcoming.slice(0, 5) as any}
                      onEdit={(t) => { setEditingTask(t); setShowEditTaskDialog(true) }}
                      onComplete={(t) => handleCompleteTask(t)}
                      onDelete={(t) => handleDeleteTask(t)}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Auxiliary Tools */}
            <div className="space-y-6">
              {/* (Timer moved to the header top-right dock) */}

              {/* Quick Log Session - Cleaner Design */}
              <QuickLogPanel 
                topic={quickLogTopic}
                onTopicChange={setQuickLogTopic}
                minutes={quickLogMinutes}
                onMinutesChange={(v) => setQuickLogMinutes(v)}
                onSubmit={handleQuickLogSession}
                status={quickLogStatus}
              />

              {/* Today's Progress - Simplified */}
              <DailyProgressCard 
                completionRate={taskStats.completionRate}
                totalTasks={taskStats.totalTasks}
                completedTasks={taskStats.completedTasks}
                totalTimeToday={sessionStats.totalTimeToday}
                sessionsToday={sessionStats.sessionsToday}
                streakDays={analyticsData?.profile?.streak_days || 0}
              />

              {/* Content Recommendations - YouTube Primary */}
              <Card className="shadow-sm rounded-lg">
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
                    maxItems={16}
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
