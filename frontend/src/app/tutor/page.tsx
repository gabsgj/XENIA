'use client'
import { useState } from 'react'
import { API_BASE } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { Button } from '@/components/ui/button'

export default function TutorPage(){
  const [question, setQuestion] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [resp, setResp] = useState('')
  const { pushError } = useErrorContext()
  async function ask(){
    if (file){
      const form = new FormData(); form.append('file', file); form.append('user_id','demo-user');
      const r = await fetch(`${API_BASE}/api/tutor/ask`, { method:'POST', body: form });
      const j = await r.json().catch(()=> null)
      if(!r.ok){ pushError({ errorCode: 'TUTOR_API_DOWN', errorMessage: j?.error || 'Tutor failed', details: j }); return }
      setResp(JSON.stringify(j))
    } else {
      const r = await fetch(`${API_BASE}/api/tutor/ask`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question, user_id:'demo-user' }) });
      const j = await r.json().catch(()=> null)
      if(!r.ok){ pushError({ errorCode:'TUTOR_TIMEOUT', errorMessage: j?.error || 'Tutor timed out', details:j}); return }
      setResp(JSON.stringify(j))
    }
  }
  return (
    <div className='max-w-xl mx-auto p-6 space-y-4'>
      <h2 className='text-2xl font-semibold'>AI Tutor</h2>
      <textarea className='border p-2 rounded w-full' rows={4} aria-label='Question' value={question} onChange={e=> setQuestion(e.target.value)} />
      <input type='file' accept='.png,.jpg,.jpeg' onChange={e=> setFile(e.target.files?.[0]||null)} />
      <Button onClick={ask}>Ask</Button>
      {resp && <pre className='whitespace-pre-wrap break-all'>{resp}</pre>}
    </div>
  )
}
