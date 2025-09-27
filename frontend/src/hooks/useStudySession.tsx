"use client"
import { useState, useCallback, useEffect, useRef } from 'react'
import { api, getUserId } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'

export interface StudySession {
  id: string
  task_id?: string
  user_id: string
  topic?: string
  subject?: string
  status: 'pending' | 'in-progress' | 'completed'
  planned_duration: number // minutes
  actual_duration?: number // minutes
  start_time?: string
  end_time?: string
  created_at: string
  updated_at?: string
  progress?: number
}

interface SessionState {
  activeSession: StudySession | null
  recentSessions: StudySession[]
  loading: boolean
  error: string | null
  isTimerRunning: boolean
  timerStartTime: Date | null
  elapsedTime: number // seconds
}

export function useStudySession(){
  const [state, setState] = useState<SessionState>({
    activeSession: null,
    recentSessions: [],
    loading: false,
    error: null,
    isTimerRunning: false,
    timerStartTime: null,
    elapsedTime: 0
  })
  
  const { pushError } = useErrorContext()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Timer functionality
  const startTimer = useCallback(() => {
    if (!state.isTimerRunning) {
      setState(prev => ({
        ...prev,
        isTimerRunning: true,
        timerStartTime: new Date()
      }))
      
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.timerStartTime) return prev
          const elapsed = Math.floor((Date.now() - prev.timerStartTime.getTime()) / 1000)
          return { ...prev, elapsedTime: elapsed }
        })
      }, 1000)
    }
  }, [state.isTimerRunning])

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState(prev => ({ ...prev, isTimerRunning: false }))
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState(prev => ({
      ...prev,
      isTimerRunning: false,
      timerStartTime: null,
      elapsedTime: 0
    }))
  }, [])

// Session management
  const startSession = useCallback(async ({ 
    taskId, 
    durationMin = 25, 
    topic, 
    subject 
  }: { 
    taskId?: string, 
    durationMin?: number, 
    topic?: string, 
    subject?: string 
  }) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // Create a local session object without hitting the server to avoid schema mismatches
      const localSession: StudySession = {
        id: `${Date.now()}`,
        task_id: taskId,
        user_id: getUserId(),
        topic: topic || 'General Study',
        subject: subject || 'General',
        status: 'in-progress',
        planned_duration: durationMin,
        created_at: new Date().toISOString(),
      }
      
      setState(prev => ({
        ...prev,
        activeSession: localSession,
        loading: false
      }))
      
      startTimer()
      return localSession
      
    } catch (e: any) {
      const errorMsg = e?.errorMessage || e?.message || 'Failed to start session'
      setState(prev => ({ ...prev, error: errorMsg, loading: false }))
      pushError({
        errorCode: e?.errorCode || 'SESSION_START_FAIL',
        errorMessage: errorMsg,
        details: e
      })
      throw e
    }
  }, [startTimer, pushError])

const updateSession = useCallback(async (updates: Partial<StudySession>) => {
    if (!state.activeSession) return null
    
    try {
      // Local-only update; backend endpoint for partial session updates is not available
      setState(prev => ({
        ...prev,
        activeSession: prev.activeSession ? { ...prev.activeSession, ...updates } : null
      }))
      return state.activeSession
    } catch (e: any) {
      const errorMsg = e?.errorMessage || 'Failed to update session'
      pushError({
        errorCode: e?.errorCode || 'SESSION_UPDATE_FAIL',
        errorMessage: errorMsg,
        details: e
      })
      throw e
    }
  }, [state.activeSession, pushError])

const endSession = useCallback(async ({
    sessionId,
    taskId,
    actualMinutes,
    completed = false
  }: {
    sessionId?: string,
    taskId?: string,
    actualMinutes?: number,
    completed?: boolean
  } = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const activeSessionId = sessionId || state.activeSession?.id
      if (!activeSessionId) {
        throw new Error('No active session to end')
      }
      
      // Calculate actual duration if not provided
      const finalActualMinutes = actualMinutes || Math.max(1, Math.floor(state.elapsedTime / 60))
      
      // Record the completed study time using the track endpoint
      try {
        await api('/api/tasks/track', {
          method: 'POST',
          body: JSON.stringify({
            user_id: getUserId(),
            topic: state.activeSession?.topic || 'General Study',
            duration_min: finalActualMinutes
          })
        })
      } catch (trackErr) {
        console.warn('Failed to record session via track endpoint', trackErr)
      }
      
      // Stop timer and update state
      pauseTimer()
      resetTimer()
      
      setState(prev => ({
        ...prev,
        activeSession: null,
        recentSessions: prev.activeSession 
          ? [{ ...prev.activeSession, status: 'completed', actual_duration: finalActualMinutes }, ...prev.recentSessions.slice(0, 9)]
          : prev.recentSessions,
        loading: false
      }))
      
      return { ok: true }
      
    } catch (e: any) {
      const errorMsg = e?.errorMessage || e?.message || 'Failed to end session'
      setState(prev => ({ ...prev, error: errorMsg, loading: false }))
      pushError({
        errorCode: e?.errorCode || 'SESSION_END_FAIL',
        errorMessage: errorMsg,
        details: e
      })
      throw e
    }
  }, [state.activeSession, state.elapsedTime, pauseTimer, resetTimer, pushError])

  const pauseSession = useCallback(async () => {
    if (!state.activeSession) return
    
    pauseTimer()
    return updateSession({ status: 'pending' })
  }, [state.activeSession, pauseTimer, updateSession])

  const resumeSession = useCallback(async () => {
    if (!state.activeSession) return
    
    startTimer()
    return updateSession({ status: 'in-progress' })
  }, [state.activeSession, startTimer, updateSession])

const fetchRecentSessions = useCallback(async () => {
    try {
      const response = await api(`/api/tasks/sessions?limit=20`)
      
      if (response?.sessions) {
        // Normalize into StudySession shape
        const normalized = response.sessions.map((s: any) => ({
          id: s.id,
          user_id: getUserId(),
          topic: s.topic || 'General',
          status: 'completed',
          planned_duration: s.duration_min || 0,
          actual_duration: s.duration_min || 0,
          created_at: s.created_at
        }))
        setState(prev => ({
          ...prev,
          recentSessions: normalized
        }))
      }
    } catch (e: any) {
      console.warn('Failed to fetch recent sessions:', e)
    }
  }, [])

  // Get session stats
const getSessionStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const todaySessions = state.recentSessions.filter(s => 
      s.created_at?.startsWith(today)
    )
    
    const totalTimeToday = todaySessions.reduce((sum, session) => 
      sum + (session.actual_duration || (session as any).duration_min || session.planned_duration || 0), 0
    )
    
    const currentStreak = calculateStreak(state.recentSessions)
    
    return {
      sessionsToday: todaySessions.length,
      totalTimeToday,
      currentStreak,
      totalSessions: state.recentSessions.length,
      averageSessionTime: state.recentSessions.length > 0 
        ? Math.round(state.recentSessions.reduce((sum, s) => sum + (s.actual_duration || (s as any).duration_min || s.planned_duration || 0), 0) / state.recentSessions.length)
        : 0
    }
  }, [state.recentSessions])

  // Calculate streak helper
  const calculateStreak = (sessions: StudySession[]) => {
    if (sessions.length === 0) return 0
    
    const sessionsByDate = sessions.reduce((acc, session) => {
      const date = session.created_at.split('T')[0]
      if (!acc[date]) acc[date] = []
      acc[date].push(session)
      return acc
    }, {} as Record<string, StudySession[]>)
    
    const sortedDates = Object.keys(sessionsByDate).sort().reverse()
    let streak = 0
    const currentDate = new Date()
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr)
      const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  // Load recent sessions on mount
  useEffect(() => {
    fetchRecentSessions()
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Auto-save session progress periodically
  useEffect(() => {
    if (state.activeSession && state.isTimerRunning) {
      const saveInterval = setInterval(() => {
        updateSession({
          actual_duration: Math.floor(state.elapsedTime / 60),
          progress: Math.min(100, (state.elapsedTime / 60) / (state.activeSession?.planned_duration || 25) * 100)
        })
      }, 60000) // Save every minute
      
      return () => clearInterval(saveInterval)
    }
  }, [state.activeSession, state.isTimerRunning, state.elapsedTime, updateSession])

  return {
    // Session state
    activeSession: state.activeSession,
    recentSessions: state.recentSessions,
    loading: state.loading,
    error: state.error,
    
    // Timer state
    isTimerRunning: state.isTimerRunning,
    elapsedTime: state.elapsedTime,
    elapsedMinutes: Math.floor(state.elapsedTime / 60),
    
    // Session actions
    startSession,
    endSession,
    updateSession,
    pauseSession,
    resumeSession,
    
    // Timer actions
    startTimer,
    pauseTimer,
    resetTimer,
    
    // Utilities
    fetchRecentSessions,
    getSessionStats,
    
    // Computed values
    sessionProgress: state.activeSession 
      ? Math.min(100, (state.elapsedTime / 60) / (state.activeSession.planned_duration || 25) * 100)
      : 0
  }
}
