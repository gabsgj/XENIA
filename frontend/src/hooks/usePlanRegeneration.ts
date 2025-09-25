import { useState } from 'react'

export function usePlanRegeneration() {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const regenerate = async (config: any) => {
    setIsRegenerating(true)
    try {
      const resp = await fetch('/api/plan/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(`Regeneration failed: ${txt}`)
      }
      const data = await resp.json()
      return data
    } finally {
      setIsRegenerating(false)
    }
  }

  return { isRegenerating, regenerate }
}
