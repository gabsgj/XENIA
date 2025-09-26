'use client'

import React from 'react'
import { RecommendationsPanelErrorBoundary } from './RecommendationsPanelErrorBoundary'
import RecommendationsPanel from './RecommendationsPanel'

interface EnhancedRecommendationsPanelProps {
  topics: string[]
  maxItems?: number
  showFilters?: boolean
  compact?: boolean
  className?: string
}

export function EnhancedRecommendationsPanel(props: EnhancedRecommendationsPanelProps) {
  return (
    <RecommendationsPanelErrorBoundary topics={props.topics} compact={props.compact}>
      <RecommendationsPanel {...props} />
    </RecommendationsPanelErrorBoundary>
  )
}

export default EnhancedRecommendationsPanel