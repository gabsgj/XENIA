"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StudyTimer } from '@/components/ui/study-timer'

export interface Task {
  id: string
  title: string
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedMinutes: number
  priority: 'High' | 'Medium' | 'Low'
  phase: 'Foundation' | 'Core' | 'Advanced' | 'Application'
  completed: boolean
  dueDate: string
}

export function TaskCard({ task, onStart, onComplete, onToggle, draggable }: { task: Task, onStart: (t: Task)=>void, onComplete: (t: Task)=>void, onToggle: (t: Task)=>void, draggable?: boolean }){
  const color = task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
  return (
    <div draggable={draggable} className={`p-3 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex items-start justify-between gap-4`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{task.title}</h3>
          <Badge className={color}>{task.priority}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">{task.subject} • {task.difficulty} • {task.phase}</div>
        <div className="text-xs text-muted-foreground mt-2">Est: {task.estimatedMinutes} min • Due: {task.dueDate}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div>
          <Button size="sm" onClick={() => onStart(task)}>Start</Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onToggle(task)}>{task.completed ? 'Reopen' : 'Complete'}</Button>
        </div>
      </div>
    </div>
  )
}

export default function TaskList({ tasks, onStart, onComplete, onToggle, onReorder }: { tasks: Task[], onStart: (t: Task)=>void, onComplete: (t: Task)=>void, onToggle: (t: Task)=>void, onReorder?: (order: string[])=>void }){
  if (!tasks || tasks.length === 0) return <div className="p-4 text-sm text-muted-foreground">No tasks</div>
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id || id === targetId) return
    const currentIndex = tasks.findIndex(t=>t.id===id)
    const targetIndex = tasks.findIndex(t=>t.id===targetId)
    if (currentIndex === -1 || targetIndex === -1) return
    const newTasks = [...tasks]
    const [moved] = newTasks.splice(currentIndex,1)
    newTasks.splice(targetIndex, 0, moved)
    // Notify parent
    const order = newTasks.map(t=>t.id)
    if (onReorder) onReorder(order)
  }

  const allowDrop = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }

  return (
    <div className="space-y-3">
      {tasks.map(t => (
        <div key={t.id} onDragStart={(e)=>handleDragStart(e,t.id)} onDragOver={allowDrop} onDrop={(e)=>handleDrop(e,t.id)}>
          <TaskCard task={t} onStart={onStart} onComplete={onComplete} onToggle={onToggle} draggable />
        </div>
      ))}
    </div>
  )
}
