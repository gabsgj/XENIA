'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary'
import { TaskErrorBoundary } from '@/components/tasks/TaskErrorBoundary'
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary'
import { PlannerErrorBoundary } from '@/components/planner/PlannerErrorBoundary'
import { RecommendationsPanelErrorBoundary } from '@/components/RecommendationsPanelErrorBoundary'
import { TimerErrorBoundary } from '@/components/ui/timer-error-boundary'
import { AlertTriangle, Bug } from 'lucide-react'

// Component that intentionally throws an error
function ErrorComponent({ type }: { type: string }) {
  throw new Error(`Test error from ${type} component`)
}

interface ErrorBoundaryTestProps {
  className?: string
}

export function ErrorBoundaryTest({ className }: ErrorBoundaryTestProps) {
  const [activeTest, setActiveTest] = useState<string | null>(null)

  const testCases = [
    { 
      id: 'enhanced', 
      label: 'Enhanced Error Boundary', 
      component: EnhancedErrorBoundary,
      description: 'General-purpose error boundary with detailed error info'
    },
    { 
      id: 'task', 
      label: 'Task Error Boundary', 
      component: TaskErrorBoundary,
      description: 'Task-specific error handling with fallback UI'
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard Error Boundary', 
      component: DashboardErrorBoundary,
      description: 'Dashboard-specific error handling'
    },
    { 
      id: 'planner', 
      label: 'Planner Error Boundary', 
      component: PlannerErrorBoundary,
      description: 'Planner-specific error handling'
    },
    { 
      id: 'recommendations', 
      label: 'Recommendations Error Boundary', 
      component: (props: any) => (
        <RecommendationsPanelErrorBoundary topics={['React', 'TypeScript']}>
          {props.children}
        </RecommendationsPanelErrorBoundary>
      ),
      description: 'AI recommendations error handling with fallback resources'
    },
    { 
      id: 'timer', 
      label: 'Timer Error Boundary', 
      component: (props: any) => (
        <TimerErrorBoundary taskTitle="Test Task">
          {props.children}
        </TimerErrorBoundary>
      ),
      description: 'Timer component error handling'
    }
  ]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Error Boundary Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Click any button below to test the corresponding error boundary. This will intentionally trigger an error to demonstrate the fallback UI.
            </div>
            
            <div className="grid gap-3">
              {testCases.map(testCase => {
                const Boundary = testCase.component
                
                return (
                  <div key={testCase.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{testCase.label}</h4>
                        <p className="text-sm text-muted-foreground">{testCase.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTest(activeTest === testCase.id ? null : testCase.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {activeTest === testCase.id ? 'Reset' : 'Test Error'}
                      </Button>
                    </div>
                    
                    {activeTest === testCase.id && (
                      <div className="border border-dashed border-gray-300 rounded-lg p-4">
                        <Boundary>
                          <ErrorComponent type={testCase.label} />
                        </Boundary>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Testing Notes:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Each error boundary has a custom fallback UI appropriate for its context</li>
                <li>• Error boundaries catch JavaScript errors during rendering, lifecycle methods, and constructors</li>
                <li>• They do not catch errors in event handlers, async code, or server-side rendering</li>
                <li>• Use the browser's developer console to see detailed error logs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}