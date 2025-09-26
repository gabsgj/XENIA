'use client'

import React from 'react'
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary'
import { Card, CardContent } from '@/components/ui/card'
import { Timer, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TimerErrorBoundaryProps {
  children: React.ReactNode
  taskTitle?: string
  compact?: boolean
}

const TimerErrorFallback = ({ taskTitle, compact }: { taskTitle?: string; compact?: boolean }) => (
  <div className={`p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg ${compact ? 'text-sm' : ''}`}>
    <div className="flex items-center gap-3">
      <AlertCircle className={`w-5 h-5 text-yellow-600 dark:text-yellow-400 ${compact ? 'w-4 h-4' : ''}`} />
      <div className="flex-1">
        <h4 className={`font-medium text-yellow-700 dark:text-yellow-300 ${compact ? 'text-sm' : ''}`}>
          Timer Error
        </h4>
        <p className={`text-yellow-600 dark:text-yellow-400 ${compact ? 'text-xs' : 'text-sm'}`}>
          {taskTitle ? `Unable to start timer for "${taskTitle}"` : 'Timer component encountered an error'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Timer className={`text-yellow-500 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span className={`text-yellow-600 dark:text-yellow-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            Try refreshing or continue without the timer
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className={`mt-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/20 ${compact ? 'text-xs h-6 px-2' : ''}`}
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    </div>
  </div>
)

export function TimerErrorBoundary({ children, taskTitle, compact }: TimerErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary fallback={<TimerErrorFallback taskTitle={taskTitle} compact={compact} />}>
      {children}
    </EnhancedErrorBoundary>
  )
}