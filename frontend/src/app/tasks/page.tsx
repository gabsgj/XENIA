'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useErrorContext } from '@/lib/error-context'

export default function TasksPage(){
  const [topic, setTopic] = useState('Algebra')
  const [minutes, setMinutes] = useState(30)
  const [status, setStatus] = useState('')
  const { pushError } = useErrorContext()
  async function track(){
    try {
      const res = await api('/api/tasks/track', { method:'POST', body: JSON.stringify({ user_id:'demo-user', topic, duration_min: minutes }) })
      setStatus(JSON.stringify(res))
    } catch(e:any){ pushError({ errorCode: e?.errorCode||'HTTP_500', errorMessage:e?.errorMessage, details:e}) }
  }
  return (
    <div className='max-w-xl mx-auto p-6 space-y-4'>
      <h2 className='text-2xl font-semibold'>Tasks & Sessions</h2>
      <input className='border p-2 rounded w-full' value={topic} onChange={e=> setTopic(e.target.value)} />
      <input className='border p-2 rounded w-full' type='number' value={minutes} onChange={e=> setMinutes(parseInt(e.target.value))} />
      <Button onClick={track}>Log Session</Button>
      {status && <pre className='whitespace-pre-wrap break-all'>{status}</pre>}
    </div>
  )
}
