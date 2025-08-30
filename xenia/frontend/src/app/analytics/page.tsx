'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function AnalyticsPage(){
  const [data, setData] = useState<any>(null)
  useEffect(()=>{ (async()=>{ setData(await api('/api/analytics/student?user_id=demo-user')) })() },[])
  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h2 className='text-2xl font-semibold mb-4'>Analytics</h2>
      <pre className='whitespace-pre-wrap break-all'>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
