'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react'

interface StudyTimerProps {
  duration: number // in minutes
  status: 'pending' | 'in-progress' | 'completed'
  onStatusChange: (newStatus: 'pending' | 'in-progress' | 'completed') => void
  onComplete: (actualTime: number) => void // actualTime in minutes
  externalProgress?: number // optional externally-provided progress (0-100)
  // Pomodoro options
  pomodoro?: boolean
  breakMinutes?: number
  taskId?: string | null
}

export function StudyTimer({
  duration,
  status,
  onStatusChange,
  onComplete,
  externalProgress,
  className,
  pomodoro = false,
  breakMinutes = 5
}: StudyTimerProps & { className?: string }) {

  // Core timer state - single source of truth
  const [timerState, setTimerState] = useState(() => {
    const totalWorkSeconds = Math.max(1, duration) * 60
    const progress = externalProgress ?? 0
    const remainingSeconds = Math.max(0, totalWorkSeconds * (1 - progress / 100))

    return {
      phase: 'work' as 'work' | 'break',
      remainingSeconds,
      totalSeconds: totalWorkSeconds,
      isRunning: false,
      progress,
      completed: false
    }
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastExternalProgressRef = useRef(externalProgress ?? 0)
  const workTimeCompletedRef = useRef(externalProgress ? Math.max(1, duration) * 60 * (externalProgress / 100) : 0) // Track total work time completed in seconds

  // Memoized computed values
  const computedValues = useMemo(() => {
    const elapsedSeconds = timerState.totalSeconds - timerState.remainingSeconds
    const progressPercent = Math.min(100, Math.max(0,
      timerState.totalSeconds > 0 ? (elapsedSeconds / timerState.totalSeconds) * 100 : 0
    ))

    return {
      isWorkPhase: timerState.phase === 'work',
      isBreakPhase: timerState.phase === 'break',
      totalWorkSeconds: Math.max(1, duration) * 60,
      totalBreakSeconds: Math.max(1, breakMinutes) * 60,
      currentTotalSeconds: timerState.phase === 'work' ? Math.max(1, duration) * 60 : Math.max(1, breakMinutes) * 60,
      elapsedSeconds,
      progressPercent
    }
  }, [timerState, duration, breakMinutes])

  // High-logic state synchronization
  // Only update internal state when external status changes meaningfully
  useEffect(() => {
    const shouldSyncFromExternal = () => {
      if (status === 'completed' && !timerState.completed) return true
      if (status === 'pending' && (timerState.completed || timerState.isRunning)) return true
      if (status === 'in-progress' && !timerState.isRunning && !timerState.completed) return true
      return false
    }

    if (shouldSyncFromExternal()) {
      setTimerState(prev => ({
        ...prev,
        isRunning: status === 'in-progress',
        completed: status === 'completed',
        // If pending and we have external progress, preserve remainingSeconds derived from that progress
        remainingSeconds: status === 'completed' ? 0 : (status === 'pending' && externalProgress !== undefined ? prev.remainingSeconds : prev.totalSeconds),
        progress: status === 'completed' ? 100 : (status === 'pending' && externalProgress !== undefined ? prev.progress : (status === 'pending' ? 0 : prev.progress))
      }))

      // Clear any running interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status])

  // Handle external progress changes (only when not actively running)
  useEffect(() => {
    if (externalProgress !== undefined &&
        externalProgress !== lastExternalProgressRef.current &&
        !timerState.isRunning &&
        status !== 'in-progress') {

      lastExternalProgressRef.current = externalProgress
      const totalWorkSeconds = Math.max(1, duration) * 60
      const remainingSeconds = Math.max(0, totalWorkSeconds * (1 - externalProgress / 100))

      // Update work time completed based on external progress
      workTimeCompletedRef.current = totalWorkSeconds * (externalProgress / 100)

      setTimerState(prev => ({
        ...prev,
        progress: externalProgress,
        remainingSeconds,
        totalSeconds: totalWorkSeconds,
        phase: 'work' // Reset to work phase when external progress changes
      }))
    }
  }, [externalProgress, timerState.isRunning, timerState.completed, status, duration])

  // Reset timer when duration changes
  useEffect(() => {
    const newTotalSeconds = Math.max(1, duration) * 60
    if (newTotalSeconds !== timerState.totalSeconds) {
      setTimerState(prev => ({
        ...prev,
        totalSeconds: newTotalSeconds,
        remainingSeconds: newTotalSeconds,
        progress: 0,
        completed: false,
        isRunning: false,
        phase: 'work'
      }))

      // Reset work time tracking when duration changes
      workTimeCompletedRef.current = 0

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [duration])

  // Core timer logic - single, clean interval
  useEffect(() => {
    if (timerState.isRunning && !timerState.completed) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newRemaining = prev.remainingSeconds - 1

          if (newRemaining <= 0) {
            // Phase transition logic
            if (pomodoro && prev.phase === 'work') {
              // Add completed work time to the ref
              workTimeCompletedRef.current += prev.totalSeconds

              // Start break phase
              const breakSeconds = Math.max(1, breakMinutes) * 60
              return {
                ...prev,
                phase: 'break',
                remainingSeconds: breakSeconds,
                totalSeconds: breakSeconds,
                progress: 0
              }
            } else {
              // Add final work time if completing from work phase
              if (prev.phase === 'work') {
                workTimeCompletedRef.current += prev.totalSeconds
              }

              // Complete the session
              return {
                ...prev,
                remainingSeconds: 0,
                progress: 100,
                completed: true,
                isRunning: false
              }
            }
          }

          // Normal countdown
          const elapsed = prev.totalSeconds - newRemaining
          const newProgress = prev.totalSeconds > 0 ? (elapsed / prev.totalSeconds) * 100 : 0

          return {
            ...prev,
            remainingSeconds: newRemaining,
            progress: Math.min(100, Math.max(0, newProgress))
          }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [timerState.isRunning, timerState.completed, pomodoro, breakMinutes, timerState.totalSeconds])

  // Handle completion effects
  useEffect(() => {
    if (timerState.completed && timerState.phase === 'work') {
      // Calculate actual work time completed
      const workTimeCompleted = workTimeCompletedRef.current
      const actualMinutes = Math.max(1, Math.round(workTimeCompleted / 60))

      // Notify parent
      onStatusChange('completed')
      onComplete(actualMinutes)

      // Audio notification
      try {
        if (typeof window !== 'undefined' && window.AudioContext) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.type = 'sine'
          o.frequency.value = 880
          g.gain.value = 0.05
          o.connect(g)
          g.connect(ctx.destination)
          o.start()
          setTimeout(() => {
            o.stop()
            ctx.close()
          }, 180)
        }
      } catch {
        // ignore audio errors
      }
    }
  }, [timerState.completed, timerState.phase, onStatusChange, onComplete])

  // Action handlers
  const startTimer = useCallback(() => {
    if (status !== 'in-progress') {
      onStatusChange('in-progress')
    }
    setTimerState(prev => ({ ...prev, isRunning: true }))
  }, [status, onStatusChange])

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false }))
  }, [])

  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      phase: 'work',
      remainingSeconds: Math.max(1, duration) * 60,
      totalSeconds: Math.max(1, duration) * 60,
      isRunning: false,
      progress: 0,
      completed: false
    }))

    // Reset work time tracking
    workTimeCompletedRef.current = 0

    if (status !== 'completed') {
      onStatusChange('pending')
    }
  }, [status, onStatusChange, duration])

  const completeTimer = useCallback(() => {
    // Add any remaining work time if we're in work phase
    if (timerState.phase === 'work') {
      workTimeCompletedRef.current += (timerState.totalSeconds - timerState.remainingSeconds)
    }

    const actualMinutes = Math.max(1, Math.round(workTimeCompletedRef.current / 60))

    setTimerState(prev => ({
      ...prev,
      remainingSeconds: 0,
      progress: 100,
      completed: true,
      isRunning: false
    }))

    onStatusChange('completed')
    onComplete(actualMinutes)
  }, [timerState.phase, timerState.totalSeconds, timerState.remainingSeconds, onStatusChange, onComplete])

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Early return for completed state
  if (status === 'completed' || timerState.completed) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">Completed</span>
      </div>
    )
  }

  return (
    <div className={`${className ?? ''} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200`}>
      {/* Header with Time and Phase Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono tabular-nums text-gray-900 dark:text-white">
              {formatTime(timerState.remainingSeconds)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              of {formatTime(computedValues.currentTotalSeconds)}
            </span>
          </div>
          {pomodoro && (
            <Badge
              variant={computedValues.isWorkPhase ? "default" : "secondary"}
              className={`px-2 py-1 text-xs font-medium ${
                computedValues.isWorkPhase
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
              }`}
            >
              {computedValues.isWorkPhase ? "Work" : "Break"}
            </Badge>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {timerState.isRunning && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
            </div>
          )}
          {status === 'in-progress' && !timerState.isRunning && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Paused</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(status === 'in-progress' || timerState.progress > 0) && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {Math.round(timerState.progress)}%
            </span>
          </div>
          <Progress
            value={timerState.progress}
            className="h-2 bg-gray-100 dark:bg-gray-800"
          />
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {(!timerState.isRunning && status !== 'in-progress') && (
          <Button
            size="sm"
            onClick={startTimer}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Play className="w-3 h-3 mr-2" />
            Start
          </Button>
        )}

        {(timerState.isRunning || status === 'in-progress') && (
          <>
            {timerState.isRunning ? (
              <Button
                size="sm"
                variant="outline"
                onClick={pauseTimer}
                className="flex-1 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Pause className="w-3 h-3 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={startTimer}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                <Play className="w-3 h-3 mr-2" />
                Resume
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={resetTimer}
              className="px-3 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              onClick={completeTimer}
              className="px-3 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}