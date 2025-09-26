'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, getUserId } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  Trophy, 
  Flame, 
  Zap, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressData {
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  streak_days: number;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  sessions_today: number;
  time_studied_today: number;
  weekly_goal: number;
  monthly_tasks: number;
  avg_session_time: number;
}

interface EnhancedStudyProgressProps {
  className?: string;
  showWeeklyGoal?: boolean;
  showLevel?: boolean;
  compact?: boolean;
}

export function EnhancedStudyProgress({ 
  className, 
  showWeeklyGoal = true, 
  showLevel = true,
  compact = false 
}: EnhancedStudyProgressProps) {
  const [progress, setProgress] = useState<ProgressData>({
    total_tasks: 0,
    completed_tasks: 0,
    completion_percentage: 0,
    streak_days: 0,
    total_xp: 0,
    level: 1,
    xp_to_next_level: 100,
    sessions_today: 0,
    time_studied_today: 0,
    weekly_goal: 420, // 7 hours per week
    monthly_tasks: 0,
    avg_session_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      
      // Fetch multiple data sources in parallel
      const [planResponse, analyticsResponse, tasksResponse] = await Promise.allSettled([
        api('/api/plan/current'),
        api('/api/analytics/student'),
        api('/api/tasks')
      ]);

      const progressData: ProgressData = {
        total_tasks: 0,
        completed_tasks: 0,
        completion_percentage: 0,
        streak_days: 0,
        total_xp: 0,
        level: 1,
        xp_to_next_level: 100,
        sessions_today: 0,
        time_studied_today: 0,
        weekly_goal: 420,
        monthly_tasks: 0,
        avg_session_time: 0
      };

      // Process plan data
      if (planResponse.status === 'fulfilled' && planResponse.value?.sessions) {
        const sessions = planResponse.value.sessions;
        progressData.total_tasks = sessions.length;
        progressData.completed_tasks = sessions.filter((s: any) => s.status === 'completed').length;
        progressData.completion_percentage = progressData.total_tasks > 0 
          ? Math.round((progressData.completed_tasks / progressData.total_tasks) * 100) 
          : 0;
      }

      // Process analytics data
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value) {
        const analytics = analyticsResponse.value;
        
        progressData.streak_days = analytics.profile?.streak_days || 0;
        progressData.total_xp = analytics.profile?.total_xp || 0;
        
        // Calculate level from XP
        let level = 1;
        let totalXpNeeded = 0;
        let xpForCurrentLevel = 100;
        
        while (totalXpNeeded + xpForCurrentLevel <= progressData.total_xp) {
          totalXpNeeded += xpForCurrentLevel;
          level++;
          xpForCurrentLevel = Math.floor(100 * Math.pow(1.1, level - 1));
        }
        
        progressData.level = level;
        progressData.xp_to_next_level = (totalXpNeeded + xpForCurrentLevel) - progressData.total_xp;

        // Today's sessions analysis
        if (analytics.sessions) {
          const today = new Date().toISOString().split('T')[0];
          const todaySessions = analytics.sessions.filter((s: any) => 
            s.created_at?.startsWith(today)
          );
          
          progressData.sessions_today = todaySessions.length;
          progressData.time_studied_today = todaySessions.reduce((total: number, session: any) => 
            total + (session.duration_min || 0), 0
          );
          
          // Calculate average session time
          progressData.avg_session_time = analytics.sessions.length > 0
            ? Math.round(analytics.sessions.reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0) / analytics.sessions.length)
            : 0;
        }
      }

      // Process tasks data
      if (tasksResponse.status === 'fulfilled' && tasksResponse.value?.tasks) {
        const tasks = tasksResponse.value.tasks;
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        progressData.monthly_tasks = tasks.filter((t: any) => {
          const taskDate = new Date(t.created_at || t.dueDate || t.due_date);
          return taskDate >= monthStart;
        }).length;
      }

      setProgress(progressData);
      setLastRefresh(new Date());
      
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
    
    // Set up automatic refresh
    const interval = setInterval(() => {
      // Refresh every 5 minutes if the page is visible
      if (!document.hidden) {
        fetchProgressData();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStreakBadge = (days: number) => {
    if (days >= 50) return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">🏆 Legend!</Badge>;
    if (days >= 30) return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">🔥 Fire Streak!</Badge>;
    if (days >= 14) return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">🚀 Hot Streak!</Badge>;
    if (days >= 7) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">⚡ Good Streak!</Badge>;
    if (days >= 3) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">📈 Building!</Badge>;
    return null;
  };

  const getLevelBadge = (level: number) => {
    if (level >= 50) return '🏆 Master';
    if (level >= 25) return '⭐ Expert';
    if (level >= 10) return '🚀 Advanced';
    if (level >= 5) return '📚 Intermediate';
    return '🌱 Beginner';
  };

  // Calculate XP progress for current level
  const currentLevelXp = progress.total_xp - (progress.total_xp - progress.xp_to_next_level - Math.floor(100 * Math.pow(1.1, progress.level - 2)));
  const levelXpRequirement = Math.floor(100 * Math.pow(1.1, progress.level - 1));
  const xpProgress = levelXpRequirement > 0 ? (currentLevelXp / levelXpRequirement) * 100 : 0;

  // Weekly goal progress
  const weeklyProgress = Math.min(100, (progress.time_studied_today * 7) / progress.weekly_goal * 100);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Study Progress
          </CardTitle>
          <CardDescription>Your overall learning progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn("hover:shadow-md transition-all", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Progress</span>
            </div>
            <span className="text-2xl font-bold text-primary">{progress.completion_percentage}%</span>
          </div>
          
          <Progress value={progress.completion_percentage} className="h-2 mb-3" />
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Tasks</div>
              <div className="font-semibold">{progress.completed_tasks}/{progress.total_tasks}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Streak</div>
              <div className="font-semibold">{progress.streak_days}d</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Level</div>
              <div className="font-semibold">{progress.level}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Study Progress
            </CardTitle>
            <CardDescription>Your overall learning journey and achievements</CardDescription>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProgressData}
            disabled={loading}
            className="opacity-60 hover:opacity-100"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error ? (
          <div className="text-center text-muted-foreground py-8">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="mb-2">{error}</p>
            <Button onClick={fetchProgressData} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Main Progress Ring */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress.completion_percentage / 100)}`}
                    className="text-primary transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {progress.completion_percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tasks Completed</span>
                <span className="font-semibold">{progress.completed_tasks}/{progress.total_tasks}</span>
              </div>
              <Progress value={progress.completion_percentage} className="h-3" />
              <div className="text-xs text-muted-foreground text-center">
                {progress.monthly_tasks} tasks created this month
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Streak */}
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="w-6 h-6 text-orange-500 mr-2" />
                  <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{progress.streak_days}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">Day Streak</div>
                {getStreakBadge(progress.streak_days)}
              </div>

              {/* Level & XP */}
              {showLevel && (
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
                  <div className="flex items-center justify-center mb-2">
                    <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                    <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{progress.level}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Level</div>
                  <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                    {getLevelBadge(progress.level)}
                  </div>
                  <Progress value={Math.max(0, Math.min(100, xpProgress))} className="h-1" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {progress.xp_to_next_level} XP to next
                  </div>
                </div>
              )}
            </div>

            {/* Today's Activity */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Today's Activity
              </h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div className="font-bold text-lg text-blue-600">{progress.sessions_today}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
                
                <div className="flex flex-col items-center gap-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div className="font-bold text-lg text-green-600">{progress.time_studied_today}</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </div>
                
                <div className="flex flex-col items-center gap-1 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                  <div className="font-bold text-lg text-purple-600">{progress.avg_session_time}</div>
                  <div className="text-xs text-muted-foreground">Avg/Session</div>
                </div>
              </div>
            </div>

            {/* Weekly Goal Progress */}
            {showWeeklyGoal && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Weekly Goal Progress
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <span>{Math.round(weeklyProgress)}% of goal</span>
                  </div>
                  <Progress value={weeklyProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    Goal: {Math.round(progress.weekly_goal / 60)} hours per week
                  </div>
                </div>
              </div>
            )}

            {/* Motivational Message */}
            {progress.completion_percentage > 0 && (
              <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border border-primary/20">
                <div className="text-sm font-medium text-primary">
                  {progress.completion_percentage >= 90 ? "🎉 Outstanding! You're crushing your goals!" :
                   progress.completion_percentage >= 75 ? "🌟 Excellent progress! Keep up the amazing work!" :
                   progress.completion_percentage >= 50 ? "🚀 Great momentum! You're more than halfway there!" :
                   progress.completion_percentage >= 25 ? "💪 Good progress! Stay consistent and you'll get there!" :
                   progress.streak_days >= 7 ? "🔥 Great streak! Consistency is key to success!" :
                   progress.sessions_today > 0 ? "📚 Great job studying today! Every session counts!" :
                   "🌟 Ready to start your learning journey? Every expert was once a beginner!"}
                </div>
              </div>
            )}

            {/* Last Update */}
            <div className="text-xs text-muted-foreground text-center">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}