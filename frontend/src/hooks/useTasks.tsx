"use client"
import { useState, useEffect } from 'react'

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
}

export function useTasks(){
  const [today, setToday] = useState<Task[]>([])
  const [upcoming, setUpcoming] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchToday(){
    setLoading(true)
    try{
      const res = await fetch('/api/tasks/daily')
      if (!res.ok) throw new Error('Failed')
      const j = await res.json()
      setToday(j.tasks || [])
    }catch(e:any){
      setError(String(e))
    }finally{setLoading(false)}
  }

  async function fetchUpcoming(){
    try{
      const res = await fetch('/api/tasks/upcoming')
      if (!res.ok) throw new Error('Failed')
      const j = await res.json()
      setUpcoming(j.tasks || [])
    }catch(e:any){
      setError(String(e))
    }
  }

  useEffect(()=>{ fetchToday(); fetchUpcoming() }, [])

  async function completeTask(taskId: string){
    await fetch('/api/tasks/complete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ task_id: taskId })})
    // refresh
    await fetchToday(); await fetchUpcoming()
  }

  return { today, upcoming, loading, error, fetchToday, fetchUpcoming, completeTask }
}
