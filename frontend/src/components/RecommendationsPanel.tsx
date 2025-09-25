"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

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
        const res = await fetch(`/api/ai/get-resources?topics=${encodeURIComponent(topics.join(','))}&max=8`)
        if (!res.ok) throw new Error('Failed')
        const j = await res.json()
        let r = j.resources || []
        // re-rank by combining relevanceScore * (1/duration) to prefer short high-relevance
        r = r.map((it:any)=> ({ ...it, score: (it.relevanceScore || 0) * (1 / (Math.max(1, it.duration || 10))) }))
        r.sort((a:any,b:any)=> b.score - a.score)
        setItems(r)
      }catch(e){
        console.warn('Recommendations failed', e)
        // Provide fallback recommendations
        const fallbackItems = topics.slice(0, 3).map((topic, idx) => ({
          type: 'article',
          title: `Learn ${topic}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(topic + ' tutorial')}`,
          duration: 30,
          difficulty: 'intermediate',
          relevanceScore: 7,
          topic: topic
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
        <div key={idx} className="p-2 rounded border bg-surface/50 flex items-center justify-between">
          <div>
            <div className="font-medium text-sm truncate">{it.title}</div>
            <div className="text-xs text-muted-foreground">{it.type} • {it.topic} • {it.duration} min</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <a href={it.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-300 text-xs">Open</a>
            <Button size="sm" variant="ghost" onClick={()=> window.open(it.url, '_blank')}>Open</Button>
          </div>
        </div>
      ))}
    </div>
  )
}
