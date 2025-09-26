'use client'

import React from 'react'
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlannerErrorBoundaryProps {
  children: React.ReactNode
}

const PlannerErrorFallback = () => (
  <div className="container mx-auto py-8">
    <Card className="max-w-md mx-auto border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <AlertTriangle className="w-5 h-5" />
          Planner Loading Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <Calendar className="w-12 h-12 text-yellow-400 dark:text-yellow-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-yellow-600 dark:text-yellow-400">
            Unable to load your study plan right now.
          </p>
          <p className="text-sm text-yellow-500 dark:text-yellow-500">
            There was an error loading your schedule and planner data. This might be a temporary issue.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
          >
            Refresh Planner
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

export function PlannerErrorBoundary({ children }: PlannerErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary fallback={<PlannerErrorFallback />}>
      {children}
    </EnhancedErrorBoundary>
  )
}