"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Recommendation {
  type: string
  title: string
  url: string
  duration?: number
  difficulty?: string
  relevanceScore?: number
  topic?: string
}

export default function RecommendationsPanel({ topics }: { topics: string[] }){
  const [items, setItems] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (!topics || topics.length === 0) return
    const load = async ()=>{
      setLoading(true)
      try{
        const topic = topics[0]
        const j = await api(`/api/resources/recommendations/${encodeURIComponent(topic)}?learning_style=balanced&difficulty=intermediate&free_only=true`)
        let r: any[] = []
        
        // Flatten the backend response into a single list
        if (j.grouped_recommendations) {
          const order = ['youtube_videos','topic_specific','subject_resources','ocw_courses','documentation','ai_generated','hugging_face']
          order.forEach((k) => {
            const grp = (j.grouped_recommendations as any)[k]
            if (Array.isArray(grp)) r = r.concat(grp)
          })
          // Include any unlisted groups too
          Object.entries(j.grouped_recommendations as any).forEach(([k,v]: any) => {
            if (!order.includes(k) && Array.isArray(v)) r = r.concat(v)
          })
        } else if (Array.isArray(j.resources)) {
          r = j.resources
        }
        
        // Normalize to UI shape and score
        const normalized: Recommendation[] = r.map((it: any) => {
          const source = it.source || it.type || 'other'
          const score = (it.recommendation_score ?? it.quality_score ?? it.relevanceScore ?? 5)
          const kind = source === 'youtube' ? 'YouTube' :
                       source === 'topic_specific' ? 'Topic' :
                       source === 'subject_specific' ? 'Subject' :
                       source === 'ocw' ? 'Course' :
                       source === 'wikipedia' || source === 'documentation' ? 'Reference' : 'Resource'
          const duration = it.duration || it.metadata?.videoDuration || 10
          const title = it.title || it.name || 'Resource'
          const url = it.url || it.link || '#'
          return {
            type: kind,
            title,
            url,
            duration,
            difficulty: it.metadata?.difficulty || 'intermediate',
            relevanceScore: score + (source === 'youtube' ? 5 : 0), // prefer YouTube
            topic
          }
        })
        
        // Rank: prefer higher score, shorter duration
        const ranked = normalized
          .map(it => ({
            ...it,
            score: (it.relevanceScore || 0) * (1 / Math.max(1, it.duration || 10))
          }))
          .sort((a:any,b:any)=> b.score - a.score)
          .slice(0, 10)
          .map(({ score, ...rest }) => rest as Recommendation)
        
        setItems(ranked)
      }catch(e){
        console.warn('Recommendations failed', e)
        // Provide fallback recommendations
        const fallbackItems = topics.slice(0, 3).map((topic) => ({
          type: 'YouTube',
          title: `Best ${topic} tutorials on YouTube`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
          duration: 10,
          difficulty: 'intermediate',
          relevanceScore: 7,
          topic
        }))
        setItems(fallbackItems)
      }finally{setLoading(false)}
    }
    load()
  }, [topics.join(',')])

  if (!topics || topics.length === 0) return (
    <div className="text-sm text-muted-foreground">No topics yet. Start a task to get recommendations.</div>
  )

  return (
    <div className="space-y-3">
      {loading && <div className="text-sm text-muted-foreground">Loading recommendations…</div>}
      {items.map((it, idx) => (
        <div key={idx} className="p-2 rounded border bg-muted/10 flex items-center justify-between">
          <div>
            <div className="font-medium text-sm truncate" title={it.title}>{it.title}</div>
            <div className="text-xs text-muted-foreground">{it.type} • {it.topic} {it.duration ? `• ${it.duration} min` : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <a href={it.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-300 text-xs">Open</a>
            <Button size="sm" variant="ghost" onClick={()=> window.open(it.url, '_blank')}>Open</Button>
          </div>
        </div>
      ))}
    </div>
  )
}
