'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

export function StudyTimer({ duration, status, onStatusChange, onComplete, externalProgress, className, pomodoro = false, breakMinutes = 5, taskId = null }: StudyTimerProps & { className?: string }) {
  const initialSeconds = Math.max(1, duration) * 60
  const [remaining, setRemaining] = useState<number>(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<number>(() => externalProgress ?? 0)
  const [justCompleted, setJustCompleted] = useState(false)
  const [inBreak, setInBreak] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset timer when duration changes
  useEffect(() => {
    const seconds = duration * 60
    setRemaining(seconds)
    setProgress(externalProgress ?? 0)
    setIsRunning(false)
    setJustCompleted(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [duration, externalProgress])

  // Handle status changes from parent
  useEffect(() => {
    if (status === 'completed') {
      setIsRunning(false)
      setRemaining(0)
      setProgress(100)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else if (status === 'pending') {
      setRemaining(duration * 60)
      setProgress(externalProgress ?? 0)
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, duration])

  // Update progress when externalProgress prop changes while not running
  useEffect(() => {
    if (!isRunning && status !== 'in-progress') {
      setProgress(externalProgress ?? 0)
    }
  }, [externalProgress, isRunning, status])

  const startTimer = () => {
    if (status !== 'in-progress') {
      onStatusChange('in-progress')
    }
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setRemaining(duration * 60)
    setProgress(0)
    setJustCompleted(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // Reset to pending unless it was previously completed
    if (status !== 'completed') {
      onStatusChange('pending')
    }
  }

  const completeTimer = () => {
    const actualMinutes = Math.max(1, Math.round((initialSeconds - remaining) / 60))
    setIsRunning(false)
    setRemaining(0)
    setProgress(100)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    onStatusChange('completed')
    onComplete(actualMinutes)
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 2000)
    // Play a short beep to notify completion (user gesture already occurred)
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
    } catch (e) {
      // ignore audio errors
    }
  }

  // Timer countdown effect - single interval while running
  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            // If pomodoro is enabled and we just finished a work interval, start break
            if (pomodoro && !inBreak) {
              setInBreak(true)
              const breakSecs = Math.max(1, breakMinutes) * 60
              setRemaining(breakSecs)
              setProgress(0)
              // short notification for break start
              try {
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                  new Notification('Break time', { body: 'Take a short break!' })
                }
              } catch (e) {}
              return breakSecs
            }
            // If we're in break or not pomodoro, complete session
            completeTimer()
            return 0
          }
          const next = prev - 1
          const elapsed = initialSeconds - next
          const denom = initialSeconds
          const newProgress = denom > 0 ? (elapsed / denom) * 100 : 0
          setProgress(Math.min(Math.max(newProgress, 0), 100))
          return next
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
  }, [isRunning, initialSeconds, pomodoro, breakMinutes, inBreak])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (status === 'completed') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-600 dark:text-green-400">Completed</span>
      </div>
    )
  }

  return (
    <div className={`${className ?? ''} flex flex-col sm:flex-row sm:items-center gap-3`}> 
      {/* Timer Display and Controls Row */}
      <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono font-semibold tabular-nums">
            {formatTime(remaining)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {formatTime(duration * 60)}
          </span>
        </div>
        <div className="flex gap-2">
          {(!isRunning && status !== 'in-progress') && (
            <Button size="sm" onClick={startTimer} className="px-3">
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
          {(isRunning || status === 'in-progress') && (
            <>
              {isRunning ? (
                <Button size="sm" variant="outline" onClick={pauseTimer} className="px-3">
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button size="sm" onClick={startTimer} className="px-3">
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={resetTimer} className="px-3">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={completeTimer} className="px-3">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(status === 'in-progress' || progress > 0) && (
        <div className={`space-y-1 ${justCompleted ? 'animate-pulse' : ''}`}>
          {/* Single timeline progress bar that represents both elapsed time and percentage */}
          <Progress
            value={progress}
            className="h-3 transition-all duration-1000 ease-linear"
          />

          {/* Timeline labels: left = 0:00, right = total time + percentage */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>0:00</span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums">{formatTime(duration * 60)}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}