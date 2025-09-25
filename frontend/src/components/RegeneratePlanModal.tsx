import React, { useEffect, useState } from 'react'
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/modal'

const formatDate = (d: Date) => d.toISOString().split('T')[0]
const addDays = (d: Date, n: number) => { const nd = new Date(d); nd.setDate(nd.getDate()+n); return nd }

export interface RegenerateConfig {
  newDeadline: Date
  preserveProgress: boolean
  priorityAdjustment: 'focus_weak_areas' | 'balanced' | 'speed_run'
  learningPace: 'relaxed' | 'moderate' | 'intensive'
  excludedTopics: string[]
}

interface Props {
  currentPlan: any
  currentProgress: any
  isOpen: boolean
  onClose: () => void
  onRegenerate: (config: RegenerateConfig) => Promise<void>
}

const RegeneratePlanModal: React.FC<Props> = ({ currentPlan, currentProgress, isOpen, onClose, onRegenerate }) => {
  const [config, setConfig] = useState<RegenerateConfig>({
    newDeadline: currentPlan?.deadline ? new Date(currentPlan.deadline) : addDays(new Date(), 14),
    preserveProgress: true,
    priorityAdjustment: 'balanced',
    learningPace: 'moderate',
    excludedTopics: []
  })

  // Keep config in sync when modal opens and currentPlan changes
  useEffect(() => {
    if (!isOpen) return
    setConfig(prev => ({
      ...prev,
      newDeadline: currentPlan?.deadline ? new Date(currentPlan.deadline) : addDays(new Date(), 14)
    }))
  }, [isOpen, currentPlan])

  const [feasibilityCheck, setFeasibilityCheck] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const validateDeadline = async () => {
      if (!config.newDeadline) return
      setIsValidating(true)
      try {
        const resp = await fetch('/api/plan/check-deadline-feasibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: currentPlan?.id, new_deadline: formatDate(config.newDeadline) })
        })
        if (resp.ok) {
          const data = await resp.json()
          setFeasibilityCheck(data)
        }
      } catch (err) {
        console.warn('Deadline check failed', err)
      } finally {
        setIsValidating(false)
      }
    }

    const timer = setTimeout(validateDeadline, 400)
    return () => clearTimeout(timer)
  }, [config.newDeadline, isOpen])

  const handleSubmit = async () => {
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      await onRegenerate(config)
    } catch (err) {
      // swallow - parent will handle errors; log for debugging
      // eslint-disable-next-line no-console
      console.error('Regenerate failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalContent className="space-y-6">
        <ModalHeader>
          <h2 className="text-2xl font-bold">Regenerate Study Plan</h2>
          <p className="text-gray-600">Adjust your timeline and preferences</p>
        </ModalHeader>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Progress</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Completed:</span>
              <div className="font-bold">{currentProgress?.completedTasks || 0}/{currentProgress?.totalTasks || 0} tasks</div>
            </div>
            <div>
              <span className="text-gray-600">Time Spent:</span>
              <div className="font-bold">{(currentProgress?.totalHours || 0).toFixed(1)} hours</div>
            </div>
            <div>
              <span className="text-gray-600">Remaining Horizon:</span>
              <div className="font-bold">{currentProgress?.estimatedDaysLeft || 0} days</div>
            </div>
          </div>

          {currentProgress?.weakTopics && currentProgress.weakTopics.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="text-gray-600">Struggling Topics</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentProgress.weakTopics.slice(0,6).map((t:any, idx:number)=> (
                  <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">{t.topic}</span>
                ))}
              </div>
            </div>
          )}

          {currentProgress?.completedTopics && currentProgress.completedTopics.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="text-gray-600">Recently completed</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentProgress.completedTopics.slice(0,6).map((t:any, idx:number)=> (
                  <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">New Deadline</label>

          <input type="date" value={formatDate(config.newDeadline)} onChange={(e)=> setConfig(prev=> ({ ...prev, newDeadline: new Date(e.target.value) }))} min={formatDate(addDays(new Date(),1))} className="w-full p-3 border rounded-lg" />

          {isValidating && (
            <div className="mt-2 text-sm text-gray-500">Checking feasibility...</div>
          )}

          {feasibilityCheck && (
            <div className={`mt-2 p-3 rounded text-sm ${feasibilityCheck.feasible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {feasibilityCheck.feasible ? (
                <div>✅ Timeline looks good! Estimated {feasibilityCheck.estimated_hours_per_day} hours/day</div>
              ) : (
                <div>⚠️ Timeline is tight. Consider extending to {new Date(feasibilityCheck.suggested_deadline).toLocaleDateString()}</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Learning Pace</label>
          <div className="grid grid-cols-3 gap-2">
            {(['relaxed','moderate','intensive'] as const).map((pace)=> (
              <button key={pace} onClick={()=> setConfig(prev=> ({ ...prev, learningPace: pace }))} className={`p-3 rounded-lg border text-center capitalize ${config.learningPace===pace? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'}`}>
                <div className="font-medium">{pace}</div>
                <div className="text-xs text-gray-600">{pace==='relaxed' && '1-2 hrs/day'}{pace==='moderate' && '2-4 hrs/day'}{pace==='intensive' && '4+ hrs/day'}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Focus Area</label>
          <select value={config.priorityAdjustment} onChange={(e)=> setConfig(prev=> ({ ...prev, priorityAdjustment: e.target.value as any }))} className="w-full p-3 border rounded-lg">
            <option value="balanced">Balanced approach</option>
            <option value="focus_weak_areas">Focus on weak areas</option>
            <option value="speed_run">Cover everything quickly</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <input id="preserveProgress" type="checkbox" checked={config.preserveProgress} onChange={(e)=> setConfig(prev=> ({ ...prev, preserveProgress: e.target.checked }))} />
          <label htmlFor="preserveProgress" className="text-sm">Keep my current progress and completed tasks</label>
        </div>

        <ModalFooter>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
          {/*
            Only disable the regenerate button when we have an explicit feasibility result
            that marks the timeline as infeasible and the selected pace isn't 'intensive'.
            Previously the button was disabled while the feasibility check was still null,
            which made the button unclickable immediately after opening the modal.
          */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (feasibilityCheck && !feasibilityCheck.feasible && config.learningPace !== 'intensive')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isSubmitting ? 'Regenerating...' : (feasibilityCheck && !feasibilityCheck.feasible && config.learningPace !== 'intensive') ? 'Timeline infeasible — adjust deadline or choose intensive pace' : undefined}
          >
            {isSubmitting ? 'Regenerating...' : 'Regenerate Plan'}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default RegeneratePlanModal
