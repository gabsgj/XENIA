"use client"
import { useState } from 'react'
import { getUserId } from '@/lib/api'

export function useStudySession(){
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-User-Id': getUserId()
  })

  async function startSession({ taskId, durationMin }: { taskId: string, durationMin?: number }){
    setLoading(true)
    try{
      const res = await fetch('/api/tasks/session/start', { 
        method: 'POST', 
        headers: getHeaders(), 
        body: JSON.stringify({ 
          task_id: taskId, 
          user_id: getUserId(), 
          duration_min: durationMin || 25 
        })
      })
      if (!res.ok) throw new Error('Failed to start session')
      const j = await res.json()
      setActiveSession(j.session || null)
      return j
    }catch(e){
      console.error('Failed to start session:', e)
      throw e
    }finally{setLoading(false)}
  }

  async function endSession({ sessionId, taskId, actualMinutes, completed }: { sessionId: string, taskId?: string, actualMinutes?: number, completed?: boolean }){
    setLoading(true)
    try{
      const res = await fetch('/api/tasks/session/end', { 
        method: 'PUT', 
        headers: getHeaders(), 
        body: JSON.stringify({ 
          session_id: sessionId, 
          task_id: taskId, 
          actual_minutes: actualMinutes, 
          completed: completed, 
          user_id: getUserId() 
        })
      })
      if (!res.ok) throw new Error('Failed to end session')
      const j = await res.json()
      setActiveSession(null)
      return j
    }catch(e){
      console.error('Failed to end session:', e)
      throw e
    }finally{setLoading(false)}
  }

  return { activeSession, loading, startSession, endSession }
}
