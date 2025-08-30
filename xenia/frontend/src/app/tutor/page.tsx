'use client'
import { useState } from 'react'
import { API_BASE } from '@/lib/api'

export default function TutorPage(){
  const [question, setQuestion] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [resp, setResp] = useState('')
  async function ask(){
    if (file){
      const form = new FormData(); form.append('file', file); form.append('user_id','demo-user');
      const r = await fetch(`${API_BASE}/api/tutor/ask`, { method:'POST', body: form }); setResp(JSON.stringify(await r.json()))
    } else {
      const r = await fetch(`${API_BASE}/api/tutor/ask`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question, user_id:'demo-user' }) });
      setResp(JSON.stringify(await r.json()))
    }
  }
  return (
    <div className='max-w-xl mx-auto p-6 space-y-4'>
      <h2 className='text-2xl font-semibold'>AI Tutor</h2>
      <textarea className='border p-2 rounded w-full' rows={4} value={question} onChange={e=> setQuestion(e.target.value)} />
      <input type='file' accept='.png,.jpg,.jpeg' onChange={e=> setFile(e.target.files?.[0]||null)} />
      <button className='border rounded px-3 py-1' onClick={ask}>Ask</button>
      {resp && <pre className='whitespace-pre-wrap break-all'>{resp}</pre>}
    </div>
  )
}
