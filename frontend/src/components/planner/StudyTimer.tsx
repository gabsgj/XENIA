'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Square, CheckCircle, Clock, Target } from 'lucide-react';
import { api, getUserId } from '@/lib/api';

interface StudyTimerProps {
  task: {
    id: string;
    title: string;
    topic: string;
    date: string;
    estimatedMinutes: number;
    status: 'pending' | 'in-progress' | 'completed';
  };
  onComplete: (taskId: string, actualTime: number) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  className?: string;
}

export function StudyTimer({ task, onComplete, onStatusChange, className }: StudyTimerProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const totalSeconds = task.estimatedMinutes * 60;

  // Initialize timer state based on task status
  useEffect(() => {
    if (task.status === 'completed') {
      setProgress(100);
      setIsPaused(true);
    } else if (task.status === 'in-progress') {
      setIsPaused(false);
    }
  }, [task.status]);

  // Timer logic
  useEffect(() => {
    if (!isPaused && task.status !== 'completed') {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          const newProgress = Math.min((newTime / totalSeconds) * 100, 100);
          setProgress(newProgress);
          
          // Auto-complete when estimated time is reached
          if (newTime >= totalSeconds && task.status !== 'completed') {
            handleComplete();
          }
          
          // Update progress in database every 30 seconds
          if (newTime % 30 === 0) {
            updateProgressInDB(newProgress);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, task.status, totalSeconds]);

  const updateProgressInDB = useCallback(async (progressPercentage: number) => {
    if (!sessionId) return;
    
    try {
      await api('/api/study-sessions/progress', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          progress_percentage: progressPercentage,
          time_elapsed: timeElapsed
        })
      });
    } catch (error) {
      console.error('Failed to update progress in database:', error);
    }
  }, [sessionId, timeElapsed]);

  const logStudySession = useCallback(async (action: 'start' | 'pause' | 'resume' | 'complete', taskId: string) => {
    try {
      const userId = getUserId();
      const response = await api('/api/study-sessions/log', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          task_id: taskId,
          action,
          timestamp: new Date().toISOString(),
          topic: task.topic,
          estimated_duration: task.estimatedMinutes,
          actual_duration: action === 'complete' ? Math.round(timeElapsed / 60) : null
        })
      });
      
      if (action === 'start' && response.session_id) {
        setSessionId(response.session_id);
      }
    } catch (error) {
      console.error('Failed to log study session:', error);
    }
  }, [task, timeElapsed]);

  const calculateXP = useCallback((task: any, timeSpent: number) => {
    const baseXP = 50; // Base XP for completing a task
    const timeBonus = Math.min(20, Math.floor(timeSpent / 60)); // 1 XP per minute, max 20
    const efficiencyBonus = timeSpent <= task.estimatedMinutes * 60 ? 30 : 0; // Bonus for finishing on time
    return baseXP + timeBonus + efficiencyBonus;
  }, []);

  const awardXP = useCallback(async (xp: number) => {
    try {
      const userId = getUserId();
      await api('/api/gamification/award-xp', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          xp_amount: xp,
          reason: `Completed study session: ${task.topic}`,
          task_id: task.id
        })
      });
      setXpEarned(xp);
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  }, [task]);

  const handleStart = useCallback(() => {
    setIsPaused(false);
    startTimeRef.current = new Date();
    logStudySession('start', task.id);
    onStatusChange?.(task.id, 'in-progress');
  }, [task.id, logStudySession, onStatusChange]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    logStudySession('pause', task.id);
  }, [task.id, logStudySession]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    logStudySession('resume', task.id);
  }, [task.id, logStudySession]);

  const handleComplete = useCallback(async () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const actualMinutes = Math.round(timeElapsed / 60);
    
    // Log completion
    await logStudySession('complete', task.id);
    
    // Award XP
    const earnedXP = calculateXP(task, timeElapsed);
    await awardXP(earnedXP);
    
    // Update task status
    onStatusChange?.(task.id, 'completed');
    onComplete(task.id, actualMinutes);
    
    setProgress(100);
  }, [task, timeElapsed, logStudySession, calculateXP, awardXP, onStatusChange, onComplete]);

  const handleStop = useCallback(() => {
    setIsPaused(true);
    setTimeElapsed(0);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onStatusChange?.(task.id, 'pending');
  }, [task.id, onStatusChange]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgressColor = useCallback(() => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-yellow-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-primary';
  }, [progress]);

  const getStatusBadge = useCallback(() => {
    switch (task.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✅ Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">🔄 In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">⏳ Pending</Badge>;
      default:
        return null;
    }
  }, [task.status]);

  return (
    <Card className={`study-timer ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              <p className="text-sm text-muted-foreground">{task.topic}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Timer Display */}
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div className="text-3xl font-mono font-bold">
                {formatTime(timeElapsed)}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>Target: {task.estimatedMinutes} min</span>
            </div>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3" />
              <div 
                className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ease-out ${getProgressColor()}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress >= 100 && (
              <div className="text-center text-sm text-green-600 font-medium">
                🎉 Time goal reached!
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center">
            {task.status === 'completed' ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Session Completed!</span>
                {xpEarned > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    +{xpEarned} XP
                  </Badge>
                )}
              </div>
            ) : (
              <>
                {isPaused ? (
                  <Button 
                    onClick={timeElapsed === 0 ? handleStart : handleResume} 
                    className="flex-1"
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {timeElapsed === 0 ? 'Start Session' : 'Resume'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePause} 
                    variant="outline" 
                    className="flex-1"
                    size="lg"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                {timeElapsed > 0 && (
                  <>
                    <Button 
                      onClick={handleComplete} 
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                    
                    <Button 
                      onClick={handleStop} 
                      variant="outline"
                      size="lg"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Session Stats */}
          {timeElapsed > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-center">
              <div>
                <div className="text-sm font-semibold">{Math.round(timeElapsed / 60)}min</div>
                <div className="text-xs text-muted-foreground">Elapsed</div>
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {timeElapsed <= totalSeconds ? 'On Track' : 'Over Time'}
                </div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
