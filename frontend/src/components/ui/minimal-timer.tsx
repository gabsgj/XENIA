'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, CheckCircle } from 'lucide-react'

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
  className = ''
}: MinimalTimerProps) {
  const totalSeconds = Math.max(1, duration) * 60
  const [remaining, setRemaining] = useState(() => Math.max(0, totalSeconds * (1 - (externalProgress ?? 0) / 100)))
  const [isRunning, setIsRunning] = useState(() => !!( ! (typeof (arguments) !== 'undefined') && false) )
  // will be initialized properly in effect below; default false to avoid accidental autostart
  // NOTE: we will consider noAutoStart prop in the sync effect
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Sync visible remaining time and completed state, but optionally avoid auto-starting
    if (status === 'completed') {
      setRemaining(0)
    }
    if (status === 'pending') {
      setRemaining(totalSeconds)
    }

    // Only set running state from external status when auto-start is allowed
    // Default behavior: do not auto-start (noAutoStart=true) to keep timers manual.
    if (!noAutoStart) {
      setIsRunning(status === 'in-progress')
    }
  }, [status, totalSeconds, noAutoStart])

  useEffect(() => {
    if (externalProgress !== undefined && !isRunning) {
      setRemaining(Math.max(0, totalSeconds * (1 - externalProgress / 100)))
    }
  }, [externalProgress, isRunning, totalSeconds])

  useEffect(() => {
    if (isRunning && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
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
  }, [onStatusChange])

  const reset = useCallback(() => {
    setIsRunning(false)
    setRemaining(totalSeconds)
    onStatusChange('pending')
  }, [onStatusChange, totalSeconds])

  const complete = useCallback(() => {
    setIsRunning(false)
    setRemaining(0)
    onStatusChange('completed')
    onComplete(Math.max(1, Math.round((totalSeconds - remaining) / 60)))
  }, [onComplete, onStatusChange, totalSeconds, remaining])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100))

  if (status === 'completed') {
    return (
      <div className={`${className} flex items-center gap-2 text-green-600`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Completed</span>
      </div>
    )
  }

  return (
    <div className={`${className} flex items-center gap-2 p-2 bg-muted/20 rounded-md`}>
      <div className="text-sm font-mono min-w-[3rem]">{formatTime(remaining)}</div>
      <div className="flex-1 bg-gray-200 rounded-full h-1 overflow-hidden min-w-[2rem]">
        <div
          className="h-1 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex items-center gap-1">
        {/* Start button - always visible when not completed and not running */}
        {!isRunning && status !== 'completed' && (
          <Button size="sm" variant="ghost" onClick={start} className="h-6 w-6 p-0" aria-label="Start">
            <Play className="w-3 h-3" />
          </Button>
        )}

        {/* Reset button - small and minimal */}
        <Button size="sm" variant="ghost" onClick={reset} className="h-6 w-6 p-0" aria-label="Reset">
          <RotateCcw className="w-3 h-3" />
        </Button>

        {/* Complete button */}
        <Button size="sm" variant="ghost" onClick={complete} className="h-6 w-6 p-0" aria-label="Complete">
          <CheckCircle className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

export default MinimalTimer
