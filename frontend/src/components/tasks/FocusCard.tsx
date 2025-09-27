'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Target, PlayCircle } from 'lucide-react'
import type { Task } from '@/hooks/useTasks'

export type FocusCardProps = {
  task: Task
  onStart: (task: Task) => void | Promise<void>
  processing?: boolean
  activeTaskId?: string | null
}

export default function FocusCard({ task, onStart, processing, activeTaskId }: FocusCardProps){
  return (
<Card className="border shadow-sm rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Today's Focus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <h3 className="font-semibold text-xl mb-4">{task.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {task.subject}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {(task.estimatedMinutes || (task as any).duration_minutes || 30)} min
            </span>
            <Badge variant="secondary" className="text-xs">
              {(task as any).priority || 'Medium'} Priority
            </Badge>
          </div>
          <Button 
            onClick={() => onStart(task)}
            disabled={Boolean(processing) || (Boolean(activeTaskId) && activeTaskId !== task.id)}
            className="w-full bg-primary hover:bg-primary/90 font-medium py-5"
            size="lg"
          >
            {processing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Start This Task
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
