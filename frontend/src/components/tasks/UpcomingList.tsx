'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, CheckCircle2, Trash2 } from 'lucide-react'
import type { Task } from '@/hooks/useTasks'

export type UpcomingListProps = {
  tasks: Task[]
  onEdit: (task: Task) => void
  onComplete: (task: Task) => void | Promise<void>
  onDelete: (task: Task) => void | Promise<void>
}

export default function UpcomingList({ tasks, onEdit, onComplete, onDelete }: UpcomingListProps){
  if (!tasks || tasks.length === 0) return null
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <CardDescription>Tasks scheduled for future dates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const due = (task.dueDate || (task as any).due_date) as string | undefined
            const label = (() => {
              if (!due) return 'Due —'
              try {
                const d = new Date(due)
                const today = new Date(); today.setHours(0,0,0,0)
                const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
                const td = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
                const delta = Math.round((dd - td) / (1000*60*60*24))
                if (delta === 0) return 'Due Today'
                if (delta === 1) return 'Due Tomorrow'
                if (delta < 0) return 'Overdue'
                return `Due ${d.toLocaleDateString()}`
              } catch { return `Due ${due}` }
            })()
            return (
              <div key={task.id} className="group p-3 border rounded-lg hover:bg-muted/50 transition-colors bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate" title={task.title}>{task.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{label}</span>
                      <span>•</span>
                      <span>{(task.estimatedMinutes || (task as any).duration_minutes || 30)} min</span>
                      {task.priority && (
                        <>
                          <span>•</span>
                          <span>{task.priority} Priority</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!((task as any).fromPlan) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => onEdit(task)} aria-label="Edit task">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {!(task.completed || task.status === 'completed') && (
                        <Button size="sm" variant="outline" onClick={() => onComplete(task)} aria-label="Mark as complete">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark as Complete
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => onDelete(task)} aria-label="Delete task">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
