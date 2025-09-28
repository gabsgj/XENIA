'use client'

import React from 'react'
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

  return (
    <div
      className={cn(
        'group relative p-5 rounded-lg border bg-card hover:shadow-md transition-all duration-200',
        isActive && 'ring-2 ring-primary border-primary',
        isCompleted ? 'opacity-60' : ''
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Header: title + subject */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base leading-tight truncate">{task.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{task.subject}</p>
              </div>
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 ml-3" />
              )}
            </div>
          </div>

          {/* Description (optional) */}
          {(task as any).description && (
            <p className="text-sm text-muted-foreground mb-3">
              {(task as any).description}
            </p>
          )}

          {/* Progress (optional) */}
          {typeof task.progress === 'number' && task.progress > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-2">
                <span>Progress</span>
                <span>{Math.round(task.progress)}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          )}

          {/* Baseline row: metadata (left) + actions (right) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Metadata */}
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              {(task.dueDate || (task as any).due_date) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Due {new Date((task.dueDate || (task as any).due_date) as string).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {(task.estimatedMinutes || (task as any).duration_minutes || 30)} min
              </span>
              {task.priority && (
                <Badge className={cn(
                  'text-xs',
                  task.priority === 'High' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                  task.priority === 'Medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
                  task.priority === 'Low' && 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                )} variant="secondary">
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

              {/* More menu aligned with actions */}
              {!task.fromPlan && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      className="h-9 w-9"
                      aria-label="Task actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => { try { onEdit(task as Task) } catch {} }} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!isCompleted && (
                      <DropdownMenuItem onClick={() => { Promise.resolve(onComplete(task as Task)).catch(() => {}) }} className="cursor-pointer">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as Complete
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => { Promise.resolve(onDelete(task as Task)).catch(() => {}) }} 
                      className="cursor-pointer text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
