"use client"
import { useState } from 'react'

export function useStudySession(){
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  async function startSession({ taskId, durationMin, userId }: { taskId: string, durationMin?: number, userId?: string }){
    setLoading(true)
    try{
      const res = await fetch('/api/tasks/session/start', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ task_id: taskId, user_id: userId, duration_min: durationMin })})
      const j = await res.json()
      setActiveSession(j.session || null)
      return j
    }finally{setLoading(false)}
  }

  async function endSession({ sessionId, taskId, actualMinutes, completed, userId }: { sessionId: string, taskId?: string, actualMinutes?: number, completed?: boolean, userId?: string }){
    setLoading(true)
    try{
      const res = await fetch('/api/tasks/session/end', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ session_id: sessionId, task_id: taskId, actual_minutes: actualMinutes, completed: completed, user_id: userId })})
      const j = await res.json()
      setActiveSession(null)
      return j
    }finally{setLoading(false)}
  }

  return { activeSession, loading, startSession, endSession }
}
