'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function ParentPage(){
  const [data, setData] = useState<any>(null)
  useEffect(()=>{ (async()=>{ setData(await api('/api/parent/overview?parent_id=demo-parent')) })() },[])
  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h2 className='text-2xl font-semibold mb-4'>Parent Overview</h2>
      <pre className='whitespace-pre-wrap break-all'>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
