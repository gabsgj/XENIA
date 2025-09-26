"use client"
import { useState, useEffect } from 'react'
import { getUserId } from '@/lib/api'

export interface Task {
  id: string
  title: string
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedMinutes: number
  priority: 'High' | 'Medium' | 'Low'
  phase: string
  completed: boolean
  dueDate: string
  status?: string
  due_date?: string
  duration_minutes?: number
}

export function useTasks(){
  const [today, setToday] = useState<Task[]>([])
  const [upcoming, setUpcoming] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-User-Id': getUserId()
  })

  async function fetchToday(){
    setLoading(true)
    try{
      const res = await fetch('/api/tasks/daily', {
        headers: getHeaders()
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const j = await res.json()
      setToday(j.tasks || [])
    }catch(e:any){
      setError(String(e))
    }finally{setLoading(false)}
  }

  async function fetchUpcoming(){
    try{
      const res = await fetch('/api/tasks/upcoming', {
        headers: getHeaders()
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const j = await res.json()
      setUpcoming(j.tasks || [])
    }catch(e:any){
      setError(String(e))
    }
  }

  useEffect(()=>{ fetchToday(); fetchUpcoming() }, [])

  async function completeTask(taskId: string){
    await fetch('/api/tasks/complete', { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ task_id: taskId, user_id: getUserId() })
    })
    // refresh
    await fetchToday(); await fetchUpcoming()
  }

  return { today, upcoming, loading, error, fetchToday, fetchUpcoming, completeTask }
}
