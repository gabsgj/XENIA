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
}

export function StudyTimer({ duration, status, onStatusChange, onComplete, externalProgress }: StudyTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60) // convert to seconds
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [progress, setProgress] = useState<number>(() => externalProgress ?? 0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration * 60)
    setProgress(externalProgress ?? 0)
    setIsRunning(false)
    setStartTime(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [duration, externalProgress])

  // Handle status changes from parent
  useEffect(() => {
    if (status === 'completed') {
      setIsRunning(false)
      setTimeLeft(0)
      setProgress(100)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else if (status === 'pending') {
      setTimeLeft(duration * 60)
      setProgress(externalProgress ?? 0)
      setIsRunning(false)
      setStartTime(null)
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
    setStartTime(Date.now())
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
    setTimeLeft(duration * 60)
    setProgress(0)
    setStartTime(null)
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
    const actualTime = startTime ? Math.round((Date.now() - startTime) / 60000) : duration
    setIsRunning(false)
    setTimeLeft(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    onStatusChange('completed')
    onComplete(actualTime)
  }

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeTimer()
            return 0
          }
          const newTimeLeft = prev - 1
          // Update progress based on time elapsed
          const elapsed = (duration * 60) - newTimeLeft
          const newProgress = (elapsed / (duration * 60)) * 100
          setProgress(Math.min(newProgress, 100))
          return newTimeLeft
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
      }
    }
  }, [isRunning, timeLeft, duration])

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
    <div className="flex flex-col gap-3 min-w-[240px]">
      {/* Timer Display and Controls Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono font-semibold tabular-nums">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {formatTime(duration * 60)}
          </span>
        </div>
        <div className="flex gap-2">
          {status === 'pending' && (
            <Button size="sm" onClick={startTimer} className="px-3">
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
          {status === 'in-progress' && (
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
      {status === 'in-progress' && (
        <div className="space-y-1">
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