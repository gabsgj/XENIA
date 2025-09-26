"use client"
import { useState, useEffect } from 'react'
import { api, getUserId } from '@/lib/api'

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
      const j = await api('/api/tasks/daily')
      setToday((j as any).tasks || [])
    }catch(e:any){
      setError(String(e))
    }finally{setLoading(false)}
  }

  async function fetchUpcoming(){
    try{
      const j = await api('/api/tasks/upcoming')
      setUpcoming((j as any).tasks || [])
    }catch(e:any){
      setError(String(e))
    }
  }

  useEffect(()=>{ fetchToday(); fetchUpcoming() }, [])

  async function completeTask(taskId: string){
    await api('/api/tasks/complete', { 
      method: 'POST', 
      body: JSON.stringify({ task_id: taskId, user_id: getUserId() })
    })
    // refresh
    await fetchToday(); await fetchUpcoming()
  }

  return { today, upcoming, loading, error, fetchToday, fetchUpcoming, completeTask }
}
