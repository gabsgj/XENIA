'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

export default function TeacherPage(){
  const [topic, setTopic] = useState('')
  const [tag, setTag] = useState('')
  const [status, setStatus] = useState('')
  async function tagIt(){ setStatus(JSON.stringify(await api('/api/teacher/tag',{ method:'POST', body: JSON.stringify({ user_id:'demo-user', teacher_id:'demo-teacher', topic, tag }) }))) }
  return (
    <div className='max-w-xl mx-auto p-6 space-y-4'>
      <h2 className='text-2xl font-semibold'>Teacher Tagging</h2>
      <input className='border p-2 rounded w-full' placeholder='Topic' value={topic} onChange={e=> setTopic(e.target.value)} />
      <input className='border p-2 rounded w-full' placeholder='Tag' value={tag} onChange={e=> setTag(e.target.value)} />
      <button className='border rounded px-3 py-1' onClick={tagIt}>Tag</button>
      {status && <pre className='whitespace-pre-wrap break-all'>{status}</pre>}
    </div>
  )
}
