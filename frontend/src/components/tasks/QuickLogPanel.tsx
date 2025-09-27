'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

export type QuickLogPanelProps = {
  topic: string
  onTopicChange: (v: string) => void
  minutes: number
  onMinutesChange: (v: number) => void
  onSubmit: () => void | Promise<void>
  status?: string
}

export default function QuickLogPanel({ topic, onTopicChange, minutes, onMinutesChange, onSubmit, status }: QuickLogPanelProps){
  return (
    <Card className="shadow-sm rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Log Session</CardTitle>
        <CardDescription className="text-xs">Log a completed study session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quickTopic" className="text-sm">Topic</Label>
          <Input
            id="quickTopic"
            placeholder="e.g., Math Review"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quickDuration" className="text-sm">Duration (minutes)</Label>
          <Input
            id="quickDuration"
            type="number"
            min="1"
            max="300"
            value={minutes}
            onChange={(e) => onMinutesChange(parseInt(e.target.value) || 25)}
            className="h-9"
          />
        </div>
        <Button onClick={onSubmit} className="w-full bg-primary hover:bg-primary/90" disabled={!topic.trim()}>
          <BookOpen className="w-4 h-4 mr-2" />
          Log Session
        </Button>
        {status && (
          <div className="p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-xs text-green-800 dark:text-green-200">{status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
