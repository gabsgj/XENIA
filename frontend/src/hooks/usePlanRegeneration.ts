import { useState } from 'react'
import { api } from '@/lib/api'

export function usePlanRegeneration() {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const regenerate = async (config: any) => {
    setIsRegenerating(true)
    try {
      const resp = await api('/api/plan/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      // Normalize backend shape
      const regenerated = resp?.data?.regenerated_plan || resp?.regenerated_plan || resp?.plan || resp
      if (!regenerated || !regenerated.sessions) {
        throw new Error('Regeneration returned no plan payload')
      }
      return regenerated
    } finally {
      setIsRegenerating(false)
    }
  }

  return { isRegenerating, regenerate }
}
