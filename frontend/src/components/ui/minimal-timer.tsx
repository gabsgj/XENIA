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

    // Sync visible remaining time and completed state, but optionally avoid auto-starting
    if (s === 'completed') {
      setRemaining(0)
      setManuallyPaused(false)
      setIsRunning(false)
      startedRef.current = false
    }
    // When status is pending, reset state properly
    if (s === 'pending') {
      // Reset to full duration if no external progress, or use external progress
      const initialRemaining = externalProgress !== undefined && externalProgress !== null
        ? Math.max(0, totalSeconds * (1 - externalProgress / 100))
        : totalSeconds
      setRemaining(initialRemaining)
      setManuallyPaused(false)
      setIsRunning(false)
      startedRef.current = false
    }

    // Only set running state from external status when auto-start is allowed and not manually paused
    // Default behavior: do not auto-start (noAutoStart=true) to keep timers manual.
    if (!noAutoStart && !manuallyPaused) {
      setIsRunning(s === 'in-progress')
    }
  }, [status, totalSeconds, noAutoStart, manuallyPaused, externalProgress])

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
      <div className={`${className} flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800`}>
        <CheckCircle className="w-3 h-3 text-green-600" />
        <span className="text-xs font-medium text-green-700 dark:text-green-300">Done</span>
      </div>
    )
  }

  return (
    <div className={`${className} flex items-center gap-2 px-2 py-1 bg-background rounded border w-full`}>
      <div className="text-xs font-mono min-w-[2.75rem] text-muted-foreground">{formatTime(remaining)}</div>
      <div className="flex-1 bg-muted/30 rounded-full h-1 overflow-hidden min-w-[2rem]">
        <div
          className="h-1 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex items-center gap-1">
        {/* Start button - visible when not running and not completed */}
        {!isRunning && (
          <Button size="sm" variant="ghost" onClick={start} className="h-6 w-6 p-0 hover:bg-muted/50" aria-label="Start">
            <Play className="w-3 h-3" />
          </Button>
        )}

        {/* Pause button - visible when running */}
        {isRunning && (
          <Button size="sm" variant="ghost" onClick={pause} className="h-6 w-6 p-0 hover:bg-muted/50" aria-label="Pause">
            <Pause className="w-3 h-3" />
          </Button>
        )}

        {/* Reset button - always visible */}
        <Button size="sm" variant="ghost" onClick={reset} className="h-6 w-6 p-0 hover:bg-muted/50" aria-label="Reset">
          <RotateCcw className="w-3 h-3" />
        </Button>

        {/* Complete button - visible when not completed */}
        <Button size="sm" variant="ghost" onClick={complete} className="h-6 w-6 p-0 hover:bg-muted/50" aria-label="Complete">
          <CheckCircle className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

export default MinimalTimer
