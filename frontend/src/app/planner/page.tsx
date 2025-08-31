'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function PlannerPage() {
  const [plan, setPlan] = useState<any>(null)
  useEffect(()=>{ (async ()=>{ setPlan(await api('/api/plan/current?user_id=demo-user')) })() },[])
  async function regen(){ setPlan(await api('/api/plan/generate', { method:'POST', body: JSON.stringify({ user_id:'demo-user', horizon_days: 14 }) })) }
  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h2 className='text-2xl font-semibold mb-4'>Adaptive Plan</h2>
      <button className='border rounded px-3 py-1' onClick={regen}>Regenerate</button>
      <pre className='mt-4 whitespace-pre-wrap break-all'>{JSON.stringify(plan, null, 2)}</pre>
    </div>
  )
}
