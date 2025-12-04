"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, getUserId } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'

export interface Task {
  id: string
  title: string
  subject: string
  topic?: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedMinutes: number
  duration_minutes?: number
  priority: 'High' | 'Medium' | 'Low'
  phase: string
  completed: boolean
  status: 'pending' | 'in-progress' | 'completed' | 'done'
  dueDate: string
  due_date?: string
  created_at?: string
  updated_at?: string
  user_id?: string
  progress?: number
}

interface TasksState {
  today: Task[]
  upcoming: Task[]
  all: Task[]
  loading: boolean
  error: string | null
  lastFetch: Date | null
}

export function useTasks(){
  const [state, setState] = useState<TasksState>({
    today: [],
    upcoming: [],
    all: [],
    loading: true,
    error: null,
    lastFetch: null
  })
  const { pushError } = useErrorContext()
  
  // Track in-flight API calls to prevent duplicates
  const pendingCompletions = useRef<Set<string>>(new Set())

  const updateTaskLocally = useCallback((taskId: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      today: prev.today.map(task => task.id === taskId ? { ...task, ...updates } : task),
      upcoming: prev.upcoming.map(task => task.id === taskId ? { ...task, ...updates } : task),
      all: prev.all.map(task => task.id === taskId ? { ...task, ...updates } : task)
    }))
  }, [])

  const fetchTasks = useCallback(async (type: 'today' | 'upcoming' | 'all' = 'all') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const endpoints = {
        today: '/api/tasks/daily',
        upcoming: '/api/tasks/upcoming',
        all: '/api/tasks'
      }
      
      const responses: any = {}
      
      if (type === 'all') {
        // Fetch all types
        const [todayResp, upcomingResp, allResp] = await Promise.allSettled([
          api(endpoints.today),
          api(endpoints.upcoming),
          api(endpoints.all)
        ])
        
        responses.today = todayResp.status === 'fulfilled' ? todayResp.value : { tasks: [] }
        responses.upcoming = upcomingResp.status === 'fulfilled' ? upcomingResp.value : { tasks: [] }
        responses.all = allResp.status === 'fulfilled' ? allResp.value : { tasks: [] }
      } else {
        responses[type] = await api(endpoints[type])
      }
      
      const rawToArray = (resp: any) => Array.isArray(resp) ? resp : (resp?.tasks ?? [])
      const normalizeTasks = (resp: any) => rawToArray(resp).map((t: any, i: number) => {
        const id = String(t.id ?? t.task_id ?? t.uuid ?? t._id ?? `${t.title || 'task'}-${t.dueDate || t.due_date || ''}-${i}`)
        const status = (t.status === 'in-progress' || t.status === 'completed' || t.status === 'pending')
          ? t.status
          : (t.completed ? 'completed' : 'pending')
        return {
          // Preserve everything but ensure critical fields exist in expected format
          ...t,
          id,
          title: t.title ?? t.name ?? 'Untitled Task',
          subject: t.subject ?? t.category ?? 'General',
          estimatedMinutes: t.estimatedMinutes ?? t.duration_minutes ?? t.duration ?? 30,
          dueDate: t.dueDate ?? t.due_date ?? new Date().toISOString().split('T')[0],
          status,
          completed: Boolean(t.completed ?? (t.status === 'completed')),
          progress: typeof t.progress === 'number' ? t.progress : (status === 'completed' ? 100 : 0)
        } as Task
      })

      setState(prev => ({
        ...prev,
        today: Object.prototype.hasOwnProperty.call(responses, 'today') ? normalizeTasks(responses.today) : prev.today,
        upcoming: Object.prototype.hasOwnProperty.call(responses, 'upcoming') ? normalizeTasks(responses.upcoming) : prev.upcoming,
        all: Object.prototype.hasOwnProperty.call(responses, 'all') ? normalizeTasks(responses.all) : prev.all,
        loading: false,
        lastFetch: new Date()
      }))
      
    } catch (e: any) {
      const errorMsg = e?.errorMessage || e?.message || 'Failed to fetch tasks'
      setState(prev => ({ ...prev, error: errorMsg, loading: false }))
      pushError({ 
        errorCode: e?.errorCode || 'TASKS_FETCH_FAIL', 
        errorMessage: errorMsg, 
        details: e 
      })
    }
  }, [pushError])

  const fetchToday = useCallback(() => fetchTasks('today'), [fetchTasks])
  const fetchUpcoming = useCallback(() => fetchTasks('upcoming'), [fetchTasks])
  const fetchAll = useCallback(() => fetchTasks('all'), [fetchTasks])

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      // Backend expects snake_case keys: due_date, duration_minutes
      const payload = {
        user_id: getUserId(),
        title: taskData.title,
        subject: taskData.subject || 'General',
        due_date: taskData.dueDate,
        duration_minutes: (taskData as any).duration_minutes ?? taskData.estimatedMinutes ?? (taskData as any).duration ?? 30,
        status: 'pending'
      }

      const response = await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      
      if (response?.task) {
        const respTask: any = response.task || {}
        const fallbackDuration = (taskData as any).duration ?? (taskData as any).duration_minutes ?? (taskData as any).estimatedMinutes
        const estimated = Number(respTask.estimatedMinutes ?? respTask.duration_minutes ?? respTask.duration ?? fallbackDuration ?? 30)
        const due = respTask.dueDate ?? respTask.due_date ?? taskData.dueDate
        const normalized = {
          ...respTask,
          id: String(respTask.id ?? respTask.task_id ?? respTask.uuid ?? Date.now()),
          estimatedMinutes: estimated,
          dueDate: due,
          status: respTask.status ?? 'pending',
          completed: Boolean(respTask.completed ?? false),
          progress: typeof respTask.progress === 'number' ? respTask.progress : 0,
        }
        setState(prev => ({
          ...prev,
          today: taskData.dueDate === new Date().toISOString().split('T')[0]
            ? [...prev.today, normalized]
            : prev.today,
          upcoming: taskData.dueDate > new Date().toISOString().split('T')[0]
            ? [...prev.upcoming, normalized]
            : prev.upcoming,
          all: [...prev.all, normalized],
          loading: false
        }))
      }
      return response?.task
    } catch (e: any) {
      const errorMsg = e?.errorMessage || 'Failed to create task'
      setState(prev => ({ ...prev, error: errorMsg, loading: false }))
      pushError({ 
        errorCode: e?.errorCode || 'TASK_CREATE_FAIL', 
        errorMessage: errorMsg, 
        details: e 
      })
      throw e
    }
  }, [pushError])

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Store original task for rollback
    const originalTask = state.all.find(t => t.id === taskId) || 
                        state.today.find(t => t.id === taskId) || 
                        state.upcoming.find(t => t.id === taskId)
    
    try {
      updateTaskLocally(taskId, updates) // Optimistic update
      
      const response = await api(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...updates, user_id: getUserId() })
      })
      
      if (response?.task) {
        updateTaskLocally(taskId, response.task)
      }
      
      return response?.task
    } catch (e: any) {
      // Revert to original state on failure
      if (originalTask) {
        updateTaskLocally(taskId, originalTask)
      } else {
        // If we can't find original, refresh from server
        await fetchTasks('all')
      }
      
      const errorMsg = e?.errorMessage || 'Failed to update task'
      pushError({ 
        errorCode: e?.errorCode || 'TASK_UPDATE_FAIL', 
        errorMessage: errorMsg, 
        details: e 
      })
      throw e
    }
  }, [updateTaskLocally, fetchTasks, pushError, state])

  const completeTask = useCallback(async (taskId: string) => {
    // Prevent duplicate API calls for the same task
    if (pendingCompletions.current.has(taskId)) {
      console.log(`[useTasks] Skipping duplicate completion for task ${taskId}`)
      return { success: true, duplicate: true }
    }
    
    // Mark as pending
    pendingCompletions.current.add(taskId)
    
    try {
      updateTaskLocally(taskId, { status: 'completed', completed: true }) // Optimistic update
      
      const response = await api('/api/tasks/complete', {
        method: 'POST',
        body: JSON.stringify({ task_id: taskId, user_id: getUserId() })
      })
      
      if ((response as any)?.success || (response as any)?.ok) {
        updateTaskLocally(taskId, { 
          status: 'completed', 
          completed: true, 
          progress: 100 
        })
      }
      
      return response
    } catch (e: any) {
      // Revert optimistic update on failure
      await fetchTasks('all')
      const errorMsg = e?.errorMessage || 'Failed to complete task'
      pushError({ 
        errorCode: e?.errorCode || 'TASK_COMPLETE_FAIL', 
        errorMessage: errorMsg, 
        details: e 
      })
      throw e
    } finally {
      // Clear pending status after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        pendingCompletions.current.delete(taskId)
      }, 2000)
    }
  }, [updateTaskLocally, fetchTasks, pushError])

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setState(prev => ({
        ...prev,
        today: prev.today.filter(task => task.id !== taskId),
        upcoming: prev.upcoming.filter(task => task.id !== taskId),
        all: prev.all.filter(task => task.id !== taskId)
      }))
      
      await api(`/api/tasks/${taskId}`, { method: 'DELETE' })
    } catch (e: any) {
      // Revert optimistic update on failure
      await fetchTasks('all')
      const errorMsg = e?.errorMessage || 'Failed to delete task'
      pushError({ 
        errorCode: e?.errorCode || 'TASK_DELETE_FAIL', 
        errorMessage: errorMsg, 
        details: e 
      })
      throw e
    }
  }, [fetchTasks, pushError])

  const toggleTaskStatus = useCallback(async (taskId: string) => {
    const task = state.all.find(t => t.id === taskId) || 
                state.today.find(t => t.id === taskId) || 
                state.upcoming.find(t => t.id === taskId)
    
    if (!task) return
    
    const newStatus = task.status === 'completed' || task.completed ? 'pending' : 'completed'
    const newCompleted = newStatus === 'completed'
    
    return updateTask(taskId, { 
      status: newStatus, 
      completed: newCompleted, 
      progress: newCompleted ? 100 : 0 
    })
  }, [state, updateTask])

  // Initial fetch
  useEffect(() => {
    fetchTasks('all')
  }, [])

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.lastFetch && Date.now() - state.lastFetch.getTime() > 5 * 60 * 1000) {
        fetchTasks('all')
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [state.lastFetch, fetchTasks])

  return {
    ...state,
    fetchToday,
    fetchUpcoming,
    fetchAll,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    toggleTaskStatus,
    refresh: () => fetchTasks('all')
  }
}
