'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, CheckCircle, RotateCcw } from 'lucide-react'

interface MinimalTimerProps {
  duration: number // minutes
  status: 'pending' | 'in-progress' | 'completed'
  onStatusChange: (newStatus: 'pending' | 'in-progress' | 'completed') => void
  onComplete: (actualTime: number) => void
  externalProgress?: number
  className?: string
  noAutoStart?: boolean
}

export function MinimalTimer({
  duration,
  status,
  onStatusChange,
  onComplete,
  externalProgress,
  className = '',
  noAutoStart = false
}: MinimalTimerProps) {
  const totalSeconds = Math.max(1, duration) * 60
  const [remaining, setRemaining] = useState(() => Math.max(0, totalSeconds * (1 - (externalProgress ?? 0) / 100)))
  const [isRunning, setIsRunning] = useState(false)
  const [manuallyPaused, setManuallyPaused] = useState(false)
  // will be initialized properly in effect below; default false to avoid accidental autostart
  // NOTE: we will consider noAutoStart prop in the sync effect
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    // Narrow the status value to the expected union for safe comparisons
    const s: 'pending' | 'in-progress' | 'completed' = status

    // Always reflect completed state
    if (s === 'completed') {
      setRemaining(0)
      setManuallyPaused(false)
      setIsRunning(false)
      startedRef.current = false
      return
    }

    // Only reset to pending if the local timer hasn't started and isn't running
    if (s === 'pending' && !startedRef.current && !isRunning) {
      const initialRemaining = externalProgress !== undefined && externalProgress !== null
        ? Math.max(0, totalSeconds * (1 - externalProgress / 100))
        : totalSeconds
      setRemaining(initialRemaining)
      setManuallyPaused(false)
      setIsRunning(false)
      startedRef.current = false
    }

    // Only set running state from external when auto-start is allowed and we haven't manually started yet
    if (!noAutoStart && !manuallyPaused && !startedRef.current) {
      setIsRunning(s === 'in-progress')
    }
  }, [status, totalSeconds, noAutoStart, manuallyPaused, externalProgress, isRunning])

  useEffect(() => {
    // Only sync from externalProgress before the local timer has started,
    // or when externalProgress meaningfully changes while idle.
    if (externalProgress !== undefined && !isRunning && !startedRef.current) {
      setRemaining(Math.max(0, totalSeconds * (1 - externalProgress / 100)))
    }
  }, [externalProgress, isRunning, totalSeconds])

  useEffect(() => {
    if (isRunning && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setRemaining((r: number) => {
          const n = r - 1
          if (n <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setIsRunning(false)
            onStatusChange('completed')
            const minutes = Math.max(1, Math.round(totalSeconds / 60))
            onComplete(minutes)
            return 0
          }
          return n
        })
      }, 1000)
    } else if (!isRunning && intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, onComplete, onStatusChange, totalSeconds])

  const start = useCallback(() => {
    onStatusChange('in-progress')
    setIsRunning(true)
    setManuallyPaused(false)
    startedRef.current = true
  }, [onStatusChange])

  const pause = useCallback(() => {
    setIsRunning(false)
    setManuallyPaused(true)
    // Don't change status to pending, keep as in-progress so it can be resumed
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setRemaining(totalSeconds)
    setManuallyPaused(false)
    startedRef.current = false
    onStatusChange('pending')
  }, [onStatusChange, totalSeconds])

  const complete = useCallback(() => {
    setIsRunning(false)
    setManuallyPaused(false)
    startedRef.current = false
    
    // Use a ref to get the current remaining value to avoid stale closures
    setRemaining(currentRemaining => {
      // Immediately mark as completed in UI and notify parent
      onStatusChange('completed')
      onComplete(Math.max(1, Math.round((totalSeconds - currentRemaining) / 60)))
      return 0
    })
  }, [onComplete, onStatusChange, totalSeconds])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100))

  if (status === 'completed') {
    return (
      <div className={`${className} flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-300 dark:border-green-700 shadow-sm`}>
        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-semibold text-green-700 dark:text-green-300">Completed</span>
      </div>
    )
  }

  return (
    <div className={`${className} relative flex flex-col gap-2 px-2 py-2 bg-background rounded border w-full max-w-full min-w-0` }>
      {/* Timer display and progress bar */}
      <div className="flex items-center gap-2 w-full">
        <div className="text-xs font-mono min-w-[3rem] text-muted-foreground">{formatTime(remaining)}</div>
        <div className="flex-1 bg-muted/30 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      {/* Control buttons */}
      <div className="flex items-center gap-1 justify-end w-full">
        {/* Start button - visible when not running and not completed */}
        {!isRunning && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={start} 
            className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300" 
            aria-label="Start" 
            title="Start Timer"
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Pause button - visible when running */}
        {isRunning && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={pause} 
            className="h-7 w-7 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300" 
            aria-label="Pause" 
            title="Pause Timer"
          >
            <Pause className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Reset button - always visible */}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={reset} 
          className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-900/30 hover:text-gray-700 dark:hover:text-gray-300" 
          aria-label="Reset" 
          title="Reset Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>

        {/* Complete button - prominent green button always visible */}
        <Button 
          size="sm" 
          variant="default" 
          onClick={complete} 
          className="h-7 px-3 py-0 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white border-0 shadow-sm hover:shadow-md transition-all whitespace-nowrap font-medium" 
          aria-label="Mark as Complete" 
          title="Mark as Complete"
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          <span className="text-xs">Done</span>
        </Button>
      </div>
    </div>
  )
}

export default MinimalTimer
