'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TimerErrorBoundary } from '@/components/ui/timer-error-boundary'
import { EnhancedStudyTimer } from '@/components/ui/enhanced-study-timer'

export type ActiveTimerDockProps = {
  activeTaskId: string | null
  task?: any
  status: 'pending' | 'in-progress' | 'completed'
  onStatusChange: (s: 'pending' | 'in-progress' | 'completed') => void
  onComplete: (actualTime: number) => void | Promise<void>
}

export default function ActiveTimerDock({ activeTaskId, task, status, onStatusChange, onComplete }: ActiveTimerDockProps){
  if (!activeTaskId || !task) return null
  const duration = task?.estimatedMinutes || task?.duration_minutes || 30
  return (
    <TimerErrorBoundary taskTitle={task?.title} compact={false}>
      <Card className="shadow-sm w-full md:w-[420px]">
        <CardContent className="p-4">
          <EnhancedStudyTimer
            duration={duration}
            status={status}
            onStatusChange={onStatusChange}
            onComplete={onComplete}
            taskId={activeTaskId}
            taskTitle={task?.title}
            subject={task?.subject}
            compact={false}
            showTaskInfo={true}
          />
        </CardContent>
      </Card>
    </TimerErrorBoundary>
  )
}
