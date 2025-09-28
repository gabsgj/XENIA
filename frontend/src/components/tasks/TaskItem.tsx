'use client'

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Calendar, Clock, MoreVertical, Edit, Trash2, CheckCircle2, PlayCircle, Timer } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Task } from '@/hooks/useTasks'

export type TaskItemProps = {
  task: Task & { fromPlan?: boolean; __plan?: any }
  activeTaskId: string | null
  processingIds: Set<string>
  onStart: (task: Task) => void | Promise<void>
  onComplete: (task: Task) => void | Promise<void>
  onDelete: (task: Task) => void | Promise<void>
  onEdit: (task: Task) => void
}

export default function TaskItem({ task, activeTaskId, processingIds, onStart, onComplete, onDelete, onEdit }: TaskItemProps){
  const isActive = activeTaskId === task.id
  const isCompleted = Boolean(task.completed || task.status === 'completed')
  const isProcessing = processingIds.has(task.id)

  const dueStr = (task.dueDate || (task as any).due_date) as string | undefined
  const dueLabel = useMemo(() => {
    if (!dueStr) return null
    try {
      const d = new Date(dueStr)
      const today = new Date()
      const dayOnly = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
      const deltaDays = Math.round((dayOnly(d) - dayOnly(today)) / (1000 * 60 * 60 * 24))
      if (deltaDays === 0) return 'Due Today'
      if (deltaDays === 1) return 'Due Tomorrow'
      if (deltaDays < 0) return 'Overdue'
      return `Due ${d.toLocaleDateString()}`
    } catch {
      return `Due ${dueStr}`
    }
  }, [dueStr])

  const priorityAccent = useMemo(() => {
    const p = (task.priority || 'Medium') as any
    if (p === 'High') return 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/10 to-transparent'
    if (p === 'Low') return 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/10 to-transparent'
    return 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/10 to-transparent'
  }, [task.priority])

  const statusBadge = () => {
    const s = (task.status || (isCompleted ? 'completed' : 'pending')) as any
    if (s === 'completed') return <Badge className="text-xs bg-green-600 text-white dark:bg-green-500">Completed</Badge>
    if (s === 'in-progress') return <Badge className="text-xs bg-blue-600 text-white dark:bg-blue-500">In Progress</Badge>
    return <Badge variant="secondary" className="text-xs">Pending</Badge>
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200',
        priorityAccent,
        isActive && 'ring-2 ring-primary/70 border-primary/70',
        isCompleted && 'opacity-80'
      )}
      aria-live="polite"
    >
      {/* subtle hover sheen */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-transparent" />
      <div className="relative p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Header: subject + status */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-xs truncate max-w-[180px]">{task.subject || 'General'}</Badge>
                {statusBadge()}
              </div>
              {isCompleted && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </div>
              )}
            </div>

            {/* Title */}
            <h4 className="font-semibold text-lg leading-snug line-clamp-2">{task.title}</h4>

            {/* Description (optional) */}
            {(task as any).description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{(task as any).description}</p>
            )}

            {/* Progress (optional) */}
            {typeof task.progress === 'number' && task.progress > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{Math.round(task.progress)}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>
            )}

            {/* Meta + Actions */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Metadata */}
              <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                {dueStr && (
                  <span className={cn('flex items-center gap-1.5', dueLabel === 'Overdue' && 'text-red-600 dark:text-red-400', dueLabel === 'Due Today' && 'text-amber-600 dark:text-amber-400')}>
                    <Calendar className="w-3.5 h-3.5" />
                    {dueLabel}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {(task.estimatedMinutes || (task as any).duration_minutes || 30)} min
                </span>
                {task.priority && (
                  <Badge variant="secondary" className="text-xs">
                    {task.priority} Priority
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:justify-end">
                {isActive ? (
                  <>
                    <Badge variant="default" className="text-xs">
                      <Timer className="w-3 h-3 mr-1" />
                      Timer Running
                    </Badge>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline"
                      aria-label="Mark task complete"
                      onClick={() => { Promise.resolve(onComplete(task)).catch(() => {}) }}
                      disabled={isProcessing}
                    >
                      Mark Complete
                    </Button>
                  </>
                ) : (
                  <>
                    {!isCompleted && (
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        aria-label="Start task"
                        onClick={() => { Promise.resolve(onStart(task)).catch(() => {}) }}
                        disabled={isProcessing || (Boolean(activeTaskId) && activeTaskId !== task.id)}
                      >
                        {isProcessing ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                    )}
                    {isCompleted ? (
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label="Complete task"
                        onClick={() => { Promise.resolve(onComplete(task)).catch(() => {}) }}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Complete
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}

                {/* Inline compact action menu for consistency: Edit | Complete | Delete */}
                {!task.fromPlan && (
                  <div className="hidden sm:flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label="Edit task"
                      onClick={() => { try { onEdit(task as Task) } catch {} }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {!isCompleted && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label="Mark as complete"
                        onClick={() => { Promise.resolve(onComplete(task as Task)).catch(() => {}) }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark as Complete
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      aria-label="Delete task"
                      onClick={() => { Promise.resolve(onDelete(task as Task)).catch(() => {}) }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
