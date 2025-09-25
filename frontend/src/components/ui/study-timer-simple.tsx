'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, CheckCircle } from 'lucide-react'

interface StudyTimerSimpleProps {
  duration: number // minutes
  status: 'pending' | 'in-progress' | 'completed'
  onStatusChange: (newStatus: 'pending' | 'in-progress' | 'completed') => void
  onComplete: (actualTime: number) => void
  externalProgress?: number
  className?: string
}

export function StudyTimerSimple({
  duration,
  status,
  onStatusChange,
  onComplete,
  externalProgress,
  className = ''
}: StudyTimerSimpleProps) {
  const totalSeconds = Math.max(1, duration) * 60
  const [remaining, setRemaining] = useState(() => Math.max(0, totalSeconds * (1 - (externalProgress ?? 0) / 100)))
  const [isRunning, setIsRunning] = useState(status === 'in-progress')
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setIsRunning(status === 'in-progress')
    if (status === 'completed') setRemaining(0)
    if (status === 'pending') setRemaining(totalSeconds)
  }, [status, totalSeconds])

  useEffect(() => {
    if (externalProgress !== undefined && !isRunning) {
      setRemaining(Math.max(0, totalSeconds * (1 - externalProgress / 100)))
    }
  }, [externalProgress, isRunning, totalSeconds])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setRemaining(r => {
          const n = r - 1
          if (n <= 0) {
            clearInterval(intervalRef.current ?? undefined)
            intervalRef.current = null
            setIsRunning(false)
            onStatusChange('completed')
            const minutes = Math.max(1, Math.round(totalSeconds / 60))
            onComplete(minutes)
            return 0
          }
          return n
        })
      }, 1000)
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

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const complete = useCallback(() => {
    setIsRunning(false)
    setRemaining(0)
    onStatusChange('completed')
    onComplete(Math.max(1, Math.round((totalSeconds) / 60)))
  }, [onComplete, onStatusChange, totalSeconds])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100))

  return (
    <div className={`${className} w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatTime(remaining)}</div>
          <div className="text-xs text-gray-500 truncate">of {formatTime(totalSeconds)}</div>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && (
            <Button size="sm" onClick={start} className="bg-black text-white hover:opacity-90">
              <Play className="w-3 h-3 mr-2" /> Start
            </Button>
          )}
          {isRunning && (
            <Button size="sm" variant="outline" onClick={pause} className="border-gray-300">
              <Pause className="w-3 h-3 mr-2" /> Pause
            </Button>
          )}
          <Button size="sm" onClick={complete} className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-2" /> Done
          </Button>
        </div>
      </div>

      {/* Black progress bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
          <div
            className="h-3 bg-black rounded"
            style={{ width: `${progressPercent}%`, transition: 'width 300ms linear' }}
            role="progressbar"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  )
}

export default StudyTimerSimple
