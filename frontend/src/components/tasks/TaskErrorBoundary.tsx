'use client'

import React from 'react'
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskErrorBoundaryProps {
  children: React.ReactNode
}

const TaskErrorFallback = () => (
  <div className="container mx-auto py-8">
    <Card className="max-w-md mx-auto border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <AlertTriangle className="w-5 h-5" />
          Task Component Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <ClipboardList className="w-12 h-12 text-orange-400 dark:text-orange-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-orange-600 dark:text-orange-400">
            Unable to load your tasks right now.
          </p>
          <p className="text-sm text-orange-500 dark:text-orange-500">
            This might be a temporary issue. Try refreshing the page or check back later.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
          >
            Refresh Page
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            size="sm"
            variant="ghost"
          >
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)

export function TaskErrorBoundary({ children }: TaskErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary fallback={<TaskErrorFallback />}>
      {children}
    </EnhancedErrorBoundary>
  )
}