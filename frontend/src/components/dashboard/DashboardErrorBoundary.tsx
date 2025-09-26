'use client'

import React from 'react'
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardErrorBoundaryProps {
  children: React.ReactNode
}

const DashboardErrorFallback = () => (
  <div className="container mx-auto py-8">
    <Card className="max-w-md mx-auto border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertTriangle className="w-5 h-5" />
          Dashboard Loading Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <BarChart3 className="w-12 h-12 text-red-400 dark:text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-red-600 dark:text-red-400">
            Unable to load your dashboard right now.
          </p>
          <p className="text-sm text-red-500 dark:text-red-500">
            There was an error loading your analytics and progress data. This might be a temporary issue.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
          >
            Refresh Dashboard
          </Button>
          <Button
            onClick={() => window.location.href = '/tasks'}
            size="sm"
            variant="ghost"
          >
            Go to Tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)

export function DashboardErrorBoundary({ children }: DashboardErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary fallback={<DashboardErrorFallback />}>
      {children}
    </EnhancedErrorBoundary>
  )
}