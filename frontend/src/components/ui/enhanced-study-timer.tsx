'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock,
  Target,
  AlertCircle,
  Timer
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedStudyTimerProps {
  duration: number // in minutes
  status: 'pending' | 'in-progress' | 'completed'
  onStatusChange: (newStatus: 'pending' | 'in-progress' | 'completed') => void
  onComplete: (actualTime: number) => void // actualTime in minutes
  taskId?: string
  taskTitle?: string
  subject?: string
  externalProgress?: number // optional externally-provided progress (0-100)
  className?: string
  showTaskInfo?: boolean
  compact?: boolean
  pomodoro?: boolean
  breakMinutes?: number
}

export function EnhancedStudyTimer({
  duration,
  status,
  onStatusChange,
  onComplete,
  taskId,
  taskTitle,
  subject,
  externalProgress,
  className,
  showTaskInfo = true,
  compact = false,
  pomodoro = false,
  breakMinutes = 5
}: EnhancedStudyTimerProps) {
  // Internal timer state
  const [timerState, setTimerState] = useState(() => {
    const totalSeconds = Math.max(1, duration) * 60
    const progress = externalProgress ?? 0
    const remainingSeconds = Math.max(0, totalSeconds * (1 - progress / 100))

    return {
      phase: 'work' as 'work' | 'break',
      remainingSeconds,
      totalSeconds,
      isRunning: status === 'in-progress',
      progress,
      completed: status === 'completed',
      actualTimeSpent: 0, // Track actual time spent in seconds
      isPaused: false
    }
  })

  // Derived values
  const computedValues = useMemo(() => {
    const elapsedSeconds = timerState.totalSeconds - timerState.remainingSeconds
    const progressPercent = Math.min(100, Math.max(0,
      timerState.totalSeconds > 0 ? (elapsedSeconds / timerState.totalSeconds) * 100 : 0
    ))

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return {
      isWorkPhase: timerState.phase === 'work',
      isBreakPhase: timerState.phase === 'break',
      elapsedSeconds,
      progressPercent,
      formatTime,
      timeRemaining: formatTime(timerState.remainingSeconds),
      totalTime: formatTime(timerState.totalSeconds),
      actualTimeMinutes: Math.floor(timerState.actualTimeSpent / 60)
    }
  }, [timerState])

  // Sync with external status
  useEffect(() => {
    if (status !== 'in-progress' && timerState.isRunning) {
      setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }))
    } else if (status === 'in-progress' && !timerState.isRunning && !timerState.completed) {
      setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }))
    } else if (status === 'completed' && !timerState.completed) {
      setTimerState(prev => ({ 
        ...prev, 
        isRunning: false, 
        completed: true, 
        remainingSeconds: 0,
        progress: 100 
      }))
    } else if (status === 'pending' && (timerState.completed || timerState.isRunning)) {
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        completed: false,
        isPaused: false,
        remainingSeconds: prev.totalSeconds,
        progress: 0,
        actualTimeSpent: 0
      }))
    }
  }, [status])

  // Main timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerState.isRunning && !timerState.completed && timerState.remainingSeconds > 0) {
      interval = setInterval(() => {
        setTimerState(prev => {
          const newRemaining = prev.remainingSeconds - 1
          const newActualTime = prev.actualTimeSpent + 1

          if (newRemaining <= 0) {
            // Timer completed
            if (pomodoro && prev.phase === 'work') {
              // Start break phase
              const breakSeconds = breakMinutes * 60
              return {
                ...prev,
                phase: 'break',
                remainingSeconds: breakSeconds,
                totalSeconds: breakSeconds,
                progress: 0,
                actualTimeSpent: newActualTime
              }
            } else {
              // Complete the session
              return {
                ...prev,
                remainingSeconds: 0,
                progress: 100,
                completed: true,
                isRunning: false,
                actualTimeSpent: newActualTime
              }
            }
          }

          // Normal countdown
          const elapsed = prev.totalSeconds - newRemaining
          const newProgress = prev.totalSeconds > 0 ? (elapsed / prev.totalSeconds) * 100 : 0

          return {
            ...prev,
            remainingSeconds: newRemaining,
            progress: Math.min(100, Math.max(0, newProgress)),
            actualTimeSpent: newActualTime
          }
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerState.isRunning, timerState.completed, timerState.remainingSeconds, pomodoro, breakMinutes])

  // Handle completion
  useEffect(() => {
    if (timerState.completed && timerState.phase === 'work') {
      onStatusChange('completed')
      onComplete(Math.max(1, Math.round(timerState.actualTimeSpent / 60)))
      
      // Play completion sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeCMFl2+P')
        audio.volume = 0.3
        audio.play().catch(() => {}) // Ignore audio errors
      } catch {}
    }
  }, [timerState.completed, timerState.phase, timerState.actualTimeSpent, onStatusChange, onComplete])

  // Action handlers
  const handleStart = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }))
    if (status !== 'in-progress') {
      onStatusChange('in-progress')
    }
  }, [status, onStatusChange])

  const handlePause = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }))
  }, [])

  const handleReset = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      phase: 'work',
      remainingSeconds: duration * 60,
      totalSeconds: duration * 60,
      isRunning: false,
      progress: 0,
      completed: false,
      actualTimeSpent: 0,
      isPaused: false
    }))
    if (status !== 'pending') {
      onStatusChange('pending')
    }
  }, [duration, status, onStatusChange])

  const handleComplete = useCallback(() => {
    const actualMinutes = Math.max(1, Math.round(timerState.actualTimeSpent / 60))
    setTimerState(prev => ({
      ...prev,
      remainingSeconds: 0,
      progress: 100,
      completed: true,
      isRunning: false
    }))
    onStatusChange('completed')
    onComplete(actualMinutes)
  }, [timerState.actualTimeSpent, onStatusChange, onComplete])

  // Early return for completed state
  if (status === 'completed' || timerState.completed) {
    return (
      <Card className={cn("border-green-200 dark:border-green-800", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-green-700 dark:text-green-300">
                Session Completed!
              </div>
              {computedValues.actualTimeMinutes > 0 && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {computedValues.actualTimeMinutes} minutes studied
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border rounded-lg", className)}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Timer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-mono text-lg font-bold tabular-nums">
            {computedValues.timeRemaining}
          </span>
          {timerState.isRunning && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {!timerState.isRunning ? (
            <Button size="sm" onClick={handleStart} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-3 h-3" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handlePause}>
              <Pause className="w-3 h-3" />
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={handleComplete}>
            <CheckCircle className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      timerState.isRunning ? "border-blue-200 dark:border-blue-800" : "",
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        {showTaskInfo && (taskTitle || subject) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{taskTitle || 'Study Session'}</span>
            </div>
            {subject && (
              <Badge variant="secondary" className="text-xs">
                {subject}
              </Badge>
            )}
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-3xl font-bold font-mono tabular-nums">
              {computedValues.timeRemaining}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            of {computedValues.totalTime}
            {computedValues.actualTimeMinutes > 0 && (
              <span className="ml-2">• {computedValues.actualTimeMinutes}min studied</span>
            )}
          </div>

          {/* Phase indicator for Pomodoro */}
          {pomodoro && (
            <div className="mt-2">
              <Badge 
                variant={computedValues.isWorkPhase ? "default" : "secondary"}
                className={cn(
                  "px-3 py-1",
                  computedValues.isWorkPhase 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                )}
              >
                {computedValues.isWorkPhase ? "Work Session" : "Break Time"}
              </Badge>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
            <span className="text-sm font-bold">
              {Math.round(timerState.progress)}%
            </span>
          </div>
          <Progress 
            value={timerState.progress} 
            className={cn(
              "h-3 transition-all duration-300",
              computedValues.isWorkPhase ? "bg-blue-100 dark:bg-blue-900" : "bg-orange-100 dark:bg-orange-900"
            )}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {timerState.isRunning && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
            </>
          )}
          {timerState.isPaused && (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Paused</span>
            </>
          )}
          {!timerState.isRunning && !timerState.isPaused && !timerState.completed && (
            <>
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-sm font-medium text-muted-foreground">Ready</span>
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!timerState.isRunning ? (
            <Button 
              onClick={handleStart}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              {timerState.isPaused ? 'Resume' : 'Start'}
            </Button>
          ) : (
            <Button 
              onClick={handlePause}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="px-4"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleComplete}
            className="px-4 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}