"use client"

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { 
  ExternalLink, 
  Play, 
  BookOpen, 
  FileText, 
  Globe,
  Star,
  Clock,
  Lightbulb,
  Filter,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Recommendation {
  type: string
  title: string
  url: string
  duration?: number
  difficulty?: string
  relevanceScore?: number
  topic?: string
  description?: string
  source?: string
  thumbnail?: string
  rating?: number
}

interface RecommendationsPanelProps {
  topics: string[]
  maxItems?: number
  showFilters?: boolean
  compact?: boolean
  className?: string
}

export default function RecommendationsPanel({ 
  topics, 
  maxItems = 8, 
  showFilters = false,
  compact = false,
  className 
}: RecommendationsPanelProps) {
  const [items, setItems] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState<number>(Math.max(1, maxItems))

  const loadRecommendations = async (forceRefresh = false) => {
    if (!topics || topics.length === 0) return
    
    setLoading(true)
    setError(null)
    
    try {
      const results = await Promise.allSettled(
        topics.slice(0, 5).map(async (topic) => {
          const response = await api(
            `/api/resources/recommendations/${encodeURIComponent(topic)}?learning_style=balanced&difficulty=intermediate&free_only=true${
              forceRefresh ? '&refresh=true' : ''
            }`
          )
          return { topic, response }
        })
      )

      let allRecommendations: Recommendation[] = []

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { topic, response } = result.value
          let topicRecs: any[] = []

          // Process grouped recommendations
          if (response.grouped_recommendations) {
            const order = [
              'youtube_videos',
              'topic_specific', 
              'subject_resources',
              'ocw_courses',
              'documentation',
              'ai_generated',
              'hugging_face'
            ]
            
            order.forEach((key) => {
              const group = response.grouped_recommendations[key]
              if (Array.isArray(group)) {
                topicRecs = topicRecs.concat(group.map((item: any) => ({ ...item, group: key })))
              }
            })

            // Add any additional groups not in the order
            Object.entries(response.grouped_recommendations).forEach(([key, group]: [string, any]) => {
              if (!order.includes(key) && Array.isArray(group)) {
                topicRecs = topicRecs.concat(group.map((item: any) => ({ ...item, group: key })))
              }
            })
          } else if (Array.isArray(response.resources)) {
            topicRecs = response.resources
          }

          // Normalize recommendations
          const normalized = topicRecs.map((item: any) => {
            const source = item.source || item.type || item.group || 'other'
            const score = item.recommendation_score ?? item.quality_score ?? item.relevanceScore ?? 5
            
            const typeMapping: Record<string, { label: string; icon: any; color: string }> = {
              youtube: { label: 'YouTube', icon: Play, color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
              youtube_videos: { label: 'YouTube', icon: Play, color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
              topic_specific: { label: 'Topic Guide', icon: Lightbulb, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
              subject_specific: { label: 'Subject Guide', icon: BookOpen, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
              ocw: { label: 'Course', icon: BookOpen, color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' },
              ocw_courses: { label: 'Course', icon: BookOpen, color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' },
              documentation: { label: 'Reference', icon: FileText, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300' },
              wikipedia: { label: 'Reference', icon: Globe, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' },
              ai_generated: { label: 'AI Content', icon: Lightbulb, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' }
            }
            
            const typeInfo = typeMapping[source] || { label: 'Resource', icon: FileText, color: 'bg-gray-100 text-gray-700' }
            
            const isYouTubeSource = ['youtube', 'youtube_videos', 'youtube_fallback', 'youtube_search'].includes(source?.toString?.().toLowerCase?.() || '')
            return {
              type: typeInfo.label,
              title: item.title || item.name || 'Untitled Resource',
              url: item.url || item.link || '#',
              duration: item.duration || item.metadata?.videoDuration || (source.includes('youtube') ? 15 : 10),
              difficulty: item.metadata?.difficulty || item.difficulty || 'intermediate',
              relevanceScore: score + (isYouTubeSource ? 6 : 0), // Prefer video content more strongly
              topic,
              description: item.description || item.metadata?.description || '',
              source,
              thumbnail: item.thumbnail || item.metadata?.thumbnail,
              rating: item.rating || item.metadata?.rating,
              icon: typeInfo.icon,
              colorClass: typeInfo.color
            } as Recommendation & { icon: any; colorClass: string }
          })

          allRecommendations = allRecommendations.concat(normalized)
        }
      })

          // Add fallback YouTube searches if no YouTube content found or YouTube API failed
          const hasYouTube = allRecommendations.some(r => 
            r.source?.includes('youtube') || r.type?.toLowerCase().includes('youtube')
          )
          
          if (!hasYouTube || allRecommendations.length === 0) {
            topics.slice(0, 5).forEach(topic => {
              // Add multiple YouTube search fallbacks for better coverage
              const searchQueries = [
                `${topic} tutorial`,
                `${topic} explained`,
                `learn ${topic}`,
                `${topic} for beginners`,
                `${topic} crash course`
              ]
              
              searchQueries.forEach((query, index) => {
                allRecommendations.push({
                  type: 'YouTube',
                  title: `${topic} - ${index === 0 ? 'Tutorial' : index === 1 ? 'Explained' : 'Learn'}`,
                  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                  duration: 15 + (index * 5),
                  difficulty: 'intermediate',
                  relevanceScore: 8 - index, // Higher score for first results
                  topic,
                  description: `Search YouTube for ${query}`,
                  source: 'youtube_fallback',
                  icon: Play,
                  colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                } as Recommendation & { icon: any; colorClass: string })
              })
            })
          }
          
          // Ensure we always have some fallback content
          if (allRecommendations.length === 0) {
            topics.slice(0, 3).forEach(topic => {
              allRecommendations.push({
                type: 'Web Search',
                title: `Search for ${topic} Resources`,
                url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' study guide tutorial')}`,
                duration: 10,
                difficulty: 'intermediate',
                relevanceScore: 5,
                topic,
                description: `Find online resources for ${topic}`,
                source: 'web_fallback',
                icon: Globe,
                colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
              } as Recommendation & { icon: any; colorClass: string })
            })
          }

      // Sort by relevance score and limit
      const sorted = allRecommendations
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, maxItems)

      setItems(sorted)
      
    } catch (err: any) {
      console.warn('Recommendations failed', err)
      setError('Failed to load recommendations')
      
      // Fallback recommendations
      const fallbackItems = topics.slice(0, 5).map((topic) => ({
        type: 'YouTube',
        title: `${topic} - Learn Online`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
        duration: 15,
        difficulty: 'intermediate',
        relevanceScore: 7,
        topic,
        description: `Search for ${topic} tutorials`,
        source: 'fallback',
        icon: Play,
        colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      } as Recommendation & { icon: any; colorClass: string }))
      
      setItems(fallbackItems)
    } finally {
      setLoading(false)
    }
  }

  // Filter items based on selected filters
  const filteredItems = useMemo(() => {
    let filtered = items
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type.toLowerCase() === selectedType.toLowerCase())
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(item => item.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase())
    }
    
    return filtered
  }, [items, selectedType, selectedDifficulty])

  // Get unique types and difficulties for filters
  const availableTypes = useMemo(() => {
    const types = [...new Set(items.map(item => item.type))]
    return types.sort()
  }, [items])

  const availableDifficulties = useMemo(() => {
    const difficulties = [...new Set(items.map(item => item.difficulty).filter(Boolean))]
    return difficulties.sort()
  }, [items])

  useEffect(() => {
    setVisibleCount(Math.max(1, maxItems))
    loadRecommendations()
  }, [topics.join(','), maxItems])

  if (!topics || topics.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Start a task to get personalized recommendations</p>
      </div>
    )
  }

  const RecommendationCard = ({ item, index }: { item: Recommendation & { icon?: any; colorClass?: string }, index: number }) => {
    const Icon = item.icon || FileText
    const isYoutube = (item.source || '').toString().toLowerCase().includes('youtube') || (item.type || '').toString().toLowerCase().includes('youtube')
    
    return (
      <Card key={index} className={cn("hover:shadow-md transition-all duration-200 cursor-pointer group", isYoutube && 'border-l-4 border-l-red-500')} 
            onClick={() => window.open(item.url, '_blank')}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              item.colorClass || "bg-gray-100 text-gray-700"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
              
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {item.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {item.type}
                </Badge>
                
                {item.duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {item.duration}min
                  </div>
                )}
                
                {item.difficulty && (
                  <Badge variant="outline" className="text-xs">
                    {item.difficulty}
                  </Badge>
                )}
                
                {item.rating && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-current text-yellow-500" />
                    {item.rating}
                  </div>
                )}
              </div>
            </div>
          </div>
          {isYoutube && (
            <div className="mt-3">
              <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => window.open(item.url, '_blank')}>
                <Play className="w-3 h-3 mr-1" />
                Watch on YouTube
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}
        
        {!loading && error && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button size="sm" variant="outline" onClick={() => loadRecommendations(true)}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
        
        {!loading && !error && (
          <div className="space-y-2">
            {filteredItems.slice(0, visibleCount).map((item, index) => (
              <RecommendationCard key={index} item={item} index={index} />
            ))}
            {filteredItems.length > visibleCount && (
              <div className="pt-1">
                <Button size="sm" variant="outline" onClick={() => setVisibleCount(c => c + Math.max(4, Math.floor(maxItems / 2)))} disabled={loading}>
                  Show more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recommended Resources</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => loadRecommendations(true)}
            disabled={loading}
          >
            <RefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && availableTypes.length > 1 && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
          <Filter className="w-4 h-4 text-muted-foreground" />
          
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            <option value="all">All Types</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {availableDifficulties.length > 1 && (
            <select 
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="all">All Levels</option>
              {availableDifficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
{(difficulty ?? '').charAt(0).toUpperCase() + (difficulty ?? '').slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => loadRecommendations(true)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No recommendations found for the selected filters.</p>
            </div>
          ) : (
            <div>
              <div className="grid gap-3">
                {filteredItems.slice(0, visibleCount).map((item, index) => (
                  <RecommendationCard key={index} item={item} index={index} />
                ))}
              </div>
              {filteredItems.length > visibleCount && (
                <div className="pt-1">
                  <Button size="sm" variant="outline" onClick={() => setVisibleCount(c => c + Math.max(6, Math.floor(maxItems / 2)))} disabled={loading}>
                    Show more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Topics Info */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Showing recommendations for: {topics.slice(0, 3).join(', ')}
          {topics.length > 3 && ` and ${topics.length - 3} more`}
        </p>
      </div>
    </div>
  )
}
