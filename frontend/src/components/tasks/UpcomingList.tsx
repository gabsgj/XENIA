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
          {tasks.map((task) => (
            <div key={task.id} className="group flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors bg-card">
              <div>
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-muted-foreground">
                  {task.subject} • Due {new Date((task.dueDate || (task as any).due_date) as string).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{(task.estimatedMinutes || (task as any).duration_minutes || 30)}min</Badge>
                {!((task as any).fromPlan) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        aria-label="Upcoming task actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {!(task.completed || task.status === 'completed') && (
                        <DropdownMenuItem onClick={() => onComplete(task)} className="cursor-pointer">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(task)} className="cursor-pointer text-red-600 dark:text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
