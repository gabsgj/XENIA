'use client'

import React from 'react'
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecommendationsPanelErrorBoundaryProps {
  children: React.ReactNode
  topics?: string[]
  compact?: boolean
}

const RecommendationsErrorFallback = ({ topics, compact }: { topics?: string[], compact?: boolean }) => (
  <div className={`p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 rounded-lg ${compact ? 'text-sm' : ''}`}>
    <div className="flex items-start gap-3">
      <AlertCircle className={`w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 ${compact ? 'w-4 h-4' : ''}`} />
      <div className="flex-1">
        <h4 className={`font-medium text-orange-700 dark:text-orange-300 ${compact ? 'text-sm' : ''}`}>
          Recommendations Unavailable
        </h4>
        <p className={`text-orange-600 dark:text-orange-400 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          Unable to load AI-powered content recommendations right now.
        </p>
        
        {topics && topics.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className={`text-orange-600 dark:text-orange-400 ${compact ? 'text-xs' : 'text-sm'}`}>
              Try these manual search options:
            </p>
            <div className="flex flex-wrap gap-2">
              {topics.slice(0, 3).map((topic, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  className={`border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20 ${compact ? 'text-xs h-7 px-2' : ''}`}
                  onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`, '_blank')}
                >
                  <Lightbulb className={`mr-1 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          className={`mt-3 text-orange-700 hover:text-orange-800 hover:bg-orange-100 dark:text-orange-300 dark:hover:text-orange-200 dark:hover:bg-orange-900/20 ${compact ? 'text-xs h-7 px-2' : ''}`}
          onClick={() => window.location.reload()}
        >
          <RefreshCw className={`mr-1 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
          Retry
        </Button>
      </div>
    </div>
  </div>
)

export function RecommendationsPanelErrorBoundary({ children, topics, compact }: RecommendationsPanelErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary fallback={<RecommendationsErrorFallback topics={topics} compact={compact} />}>
      {children}
    </EnhancedErrorBoundary>
  )
}