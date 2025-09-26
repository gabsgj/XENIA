'use client'

// This file contains the main content areas for the Tasks page
// It should be integrated with the main Tasks page

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EnhancedStudyTimer } from '@/components/ui/enhanced-study-timer'
import RecommendationsPanel from '@/components/RecommendationsPanel'
import { 
  PlayCircle, 
  PauseCircle, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  MoreVertical,
  Filter,
  Clock,
  Target,
  Calendar,
  BookOpen,
  Timer,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function TasksMainContent({ 
  filteredTasks,
  availableSubjects,
  selectedFilter,
  setSelectedFilter,
  selectedSubject,
  setSelectedSubject,
  activeTaskId,
  timerStatus,
  processingIds,
  handleStartTask,
  handleCompleteTask,
  handleDeleteTask,
  handleTimerStatusChange,
  handleTimerComplete,
  isTimerRunning,
  todaysTopics,
  quickLogTopic,
  setQuickLogTopic,
  quickLogMinutes,
  setQuickLogMinutes,
  quickLogStatus,
  handleQuickLogSession,
  sessionStats
}: any) {
  
  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'Low': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  // Status color mapping
  const getStatusColor = (status: string, completed: boolean) => {
    if (completed || status === 'completed') return 'success'
    if (status === 'in-progress') return 'default'
    return 'secondary'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Tasks List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Today's Tasks
                </CardTitle>
                <CardDescription>
                  Your study tasks for today
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 mb-6">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              {availableSubjects.length > 0 && (
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {availableSubjects.map((subject: string) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task: any) => (
                  <Card key={task.id} className={cn(
                    "hover:shadow-md transition-all duration-200",
                    activeTaskId === task.id && "ring-2 ring-primary"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1 line-clamp-1">
                                {task.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.subject} • {task.estimatedMinutes || task.duration_minutes || 30} min
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                {task.priority}
                              </Badge>
                              <Badge variant={getStatusColor(task.status, task.completed)}>
                                {task.completed || task.status === 'completed' ? 'Completed' : 
                                 task.status === 'in-progress' ? 'In Progress' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                          
                          {task.progress !== undefined && task.progress > 0 && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{Math.round(task.progress)}%</span>
                              </div>
                              <Progress value={task.progress} className="h-2" />
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {activeTaskId === task.id ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="default" className="text-xs">
                                <Timer className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCompleteTask(task)}
                                disabled={processingIds.has(task.id)}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {!task.completed && task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartTask(task)}
                                  disabled={processingIds.has(task.id) || !!activeTaskId}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {processingIds.has(task.id) ? (
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <PlayCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Start
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteTask(task)}
                                disabled={processingIds.has(task.id)}
                              >
                                {processingIds.has(task.id) ? (
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTask(task)}
                                disabled={processingIds.has(task.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground">
                    {selectedFilter !== 'all' || selectedSubject !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Create your first task to get started'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Study Timer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Study Timer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTaskId ? (
              <EnhancedStudyTimer
                duration={((): number => {
                  const task = filteredTasks.find((t: any) => t.id === activeTaskId)
                  return task?.estimatedMinutes || task?.duration_minutes || 30
                })()}
                status={timerStatus}
                onStatusChange={handleTimerStatusChange}
                onComplete={handleTimerComplete}
                taskId={activeTaskId}
                taskTitle={filteredTasks.find((t: any) => t.id === activeTaskId)?.title}
                subject={filteredTasks.find((t: any) => t.id === activeTaskId)?.subject}
                compact={false}
                showTaskInfo={true}
              />
            ) : (
              <div className="text-center py-8">
                <Timer className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Select a task to start the timer</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Log Session */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Log Session</CardTitle>
            <CardDescription>Log a completed study session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quickTopic">Topic</Label>
              <Input
                id="quickTopic"
                placeholder="e.g., Math Review"
                value={quickLogTopic}
                onChange={(e) => setQuickLogTopic(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quickDuration">Duration (minutes)</Label>
              <Input
                id="quickDuration"
                type="number"
                min="1"
                max="300"
                value={quickLogMinutes}
                onChange={(e) => setQuickLogMinutes(parseInt(e.target.value) || 25)}
              />
            </div>
            
            <Button 
              onClick={handleQuickLogSession} 
              className="w-full"
              disabled={!quickLogTopic.trim()}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Log Session
            </Button>
            
            {quickLogStatus && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">{quickLogStatus}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {sessionStats.sessionsToday}
                </div>
                <div className="text-xs text-muted-foreground">Sessions</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {sessionStats.totalTimeToday}
                </div>
                <div className="text-xs text-muted-foreground">Minutes</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Goal</span>
                <span>{sessionStats.totalTimeToday}/120 min</span>
              </div>
              <Progress 
                value={Math.min(100, (sessionStats.totalTimeToday / 120) * 100)} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Recommended Resources
            </CardTitle>
            <CardDescription>AI-powered suggestions for today's topics</CardDescription>
          </CardHeader>
          <CardContent>
            <RecommendationsPanel 
              topics={todaysTopics} 
              maxItems={5}
              compact={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}