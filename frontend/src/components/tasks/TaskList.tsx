'use client'

import React from 'react'
import TaskItem from './TaskItem'
import type { Task } from '@/hooks/useTasks'

export type TaskListProps = {
  tasks: (Task & { fromPlan?: boolean; __plan?: any })[]
  activeTaskId: string | null
  processingIds: Set<string>
  onStart: (task: Task) => void | Promise<void>
  onComplete: (task: Task) => void | Promise<void>
  onDelete: (task: Task) => void | Promise<void>
  onEdit: (task: Task) => void
}

export default function TaskList({ tasks, activeTaskId, processingIds, onStart, onComplete, onDelete, onEdit }: TaskListProps){
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          activeTaskId={activeTaskId}
          processingIds={processingIds}
          onStart={onStart}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
