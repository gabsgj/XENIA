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
}

export function StudyTimer({ duration, status, onStatusChange, onComplete }: StudyTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60) // convert to seconds
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration * 60)
    setIsRunning(false)
    setStartTime(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [duration])

  // Handle status changes from parent
  useEffect(() => {
    if (status === 'completed') {
      setIsRunning(false)
      setTimeLeft(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else if (status === 'pending') {
      setTimeLeft(duration * 60)
      setIsRunning(false)
      setStartTime(null)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, duration])

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
          return prev - 1
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
  }, [isRunning, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

  if (status === 'completed') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-600 dark:text-green-400">Completed</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{formatTime(timeLeft)}</span>
        <div className="flex gap-1">
          {status === 'pending' && (
            <Button size="sm" onClick={startTimer}>
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
          {status === 'in-progress' && (
            <>
              {isRunning ? (
                <Button size="sm" variant="outline" onClick={pauseTimer}>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button size="sm" onClick={startTimer}>
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={resetTimer}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={completeTimer}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Button>
            </>
          )}
        </div>
      </div>
      {status === 'in-progress' && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  )
}