'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Flame } from 'lucide-react'

export type DailyProgressCardProps = {
  completionRate: number
  totalTasks: number
  completedTasks: number
  totalTimeToday: number
  sessionsToday: number
  streakDays?: number
}

export default function DailyProgressCard({ completionRate, totalTasks, completedTasks, totalTimeToday, sessionsToday, streakDays = 0 }: DailyProgressCardProps){
  return (
    <Card className="shadow-sm rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-medium">Daily Goal</span>
              <span className="text-sm text-muted-foreground">{completedTasks} / {totalTasks} Tasks</span>
            </div>
            <Progress value={completionRate} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground text-right">{completionRate}% Complete</p>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Study Time</span>
              <span className="text-sm text-muted-foreground">{totalTimeToday}m / 180m</span>
            </div>
            <Progress value={Math.min(100, (totalTimeToday / 180) * 100)} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground text-right">{Math.round((totalTimeToday / 180) * 100)}% of target</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="text-lg font-semibold">{sessionsToday}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="text-lg font-semibold">
                <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
                {streakDays}
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
