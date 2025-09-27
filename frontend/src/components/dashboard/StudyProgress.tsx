'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, getUserId } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Flame, Zap, TrendingUp } from 'lucide-react';

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
}

interface StudyProgressProps {
  className?: string;
}

export function StudyProgress({ className }: StudyProgressProps) {
  const [progress, setProgress] = useState<ProgressData>({
    total_tasks: 0,
    completed_tasks: 0,
    completion_percentage: 0,
    streak_days: 0,
    total_xp: 0,
    level: 1,
    xp_to_next_level: 100,
    sessions_today: 0,
    time_studied_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      
      // Fetch multiple data sources
      const [planResponse, analyticsResponse, profileResponse] = await Promise.all([
        api('/api/plan/current').catch(() => null),
        api('/api/analytics/student').catch(() => null),
        api(`/api/progress/user/${userId}`).catch(() => null)
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
        time_studied_today: 0
      };

      // Calculate task progress from plan
      if (planResponse && planResponse.sessions) {
        const sessions = planResponse.sessions;
        progressData.total_tasks = sessions.length;
        progressData.completed_tasks = sessions.filter((s: any) => s.status === 'completed').length;
        progressData.completion_percentage = progressData.total_tasks > 0 
          ? Math.round((progressData.completed_tasks / progressData.total_tasks) * 100) 
          : 0;
      }

      // Get analytics data
      if (analyticsResponse) {
        progressData.streak_days = analyticsResponse.profile?.streak_days || 0;
        progressData.total_xp = analyticsResponse.profile?.total_xp || 0;
        
        // Calculate level from XP (100 XP per level, with increasing requirements)
        let level = 1;
        let totalXpNeeded = 0;
        let xpForCurrentLevel = 100;
        
        while (totalXpNeeded + xpForCurrentLevel <= progressData.total_xp) {
          totalXpNeeded += xpForCurrentLevel;
          level++;
          xpForCurrentLevel = Math.floor(100 * Math.pow(1.2, level - 1)); // Increasing XP requirements
        }
        
        progressData.level = level;
        progressData.xp_to_next_level = (totalXpNeeded + xpForCurrentLevel) - progressData.total_xp;

        // Today's sessions
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = analyticsResponse.sessions?.filter((s: any) => 
          s.created_at?.startsWith(today)
        ) || [];
        
        progressData.sessions_today = todaySessions.length;
        progressData.time_studied_today = todaySessions.reduce((total: number, session: any) => 
          total + (session.duration_min || 0), 0
        );
      }

      setProgress(progressData);
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
    
    // Set up real-time updates
    const interval = setInterval(fetchProgressData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStreakBadge = (days: number) => {
    if (days >= 30) return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">🔥 Fire Streak!</Badge>;
    if (days >= 14) return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">🚀 Hot Streak!</Badge>;
    if (days >= 7) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">⚡ Good Streak!</Badge>;
    if (days >= 3) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">📈 Building!</Badge>;
    return null;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const xpProgress = progress.total_xp > 0 ? 
    ((progress.total_xp - (progress.total_xp - progress.xp_to_next_level - (100 * Math.pow(1.2, progress.level - 2)))) / 
     (100 * Math.pow(1.2, progress.level - 1))) * 100 : 0;

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
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Study Progress
        </CardTitle>
        <CardDescription>Your overall learning progress and achievements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <div className="text-center text-muted-foreground py-8">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Main Progress Ring */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted-foreground/20"
                  />
                  {/* Progress circle */}
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
                <span>{progress.completed_tasks}/{progress.total_tasks}</span>
              </div>
              <Progress value={progress.completion_percentage} className="h-3" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Streak */}
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Flame className="w-5 h-5 text-orange-500 mr-1" />
                  <span className="text-2xl font-bold">{progress.streak_days}</span>
                </div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
                {getStreakBadge(progress.streak_days) && (
                  <div className="mt-1">{getStreakBadge(progress.streak_days)}</div>
                )}
              </div>

              {/* Level & XP */}
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-5 h-5 text-yellow-500 mr-1" />
                  <span className="text-2xl font-bold">{progress.level}</span>
                </div>
                <div className="text-xs text-muted-foreground">Level</div>
                <div className="mt-1">
                  <Progress value={Math.max(0, Math.min(100, xpProgress))} className="h-1" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {progress.xp_to_next_level} XP to next
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Today's Activity
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-sm">{progress.sessions_today}</div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <Target className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-semibold text-sm">{progress.time_studied_today}min</div>
                    <div className="text-xs text-muted-foreground">Studied</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            {progress.completion_percentage > 0 && (
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <div className="text-sm font-medium text-primary">
                  {progress.completion_percentage >= 80 ? "🎉 Excellent progress! You're almost there!" :
                   progress.completion_percentage >= 60 ? "🚀 Great work! Keep up the momentum!" :
                   progress.completion_percentage >= 40 ? "💪 Good progress! You're getting there!" :
                   progress.completion_percentage >= 20 ? "📈 Nice start! Keep building your streak!" :
                   "🌟 Every expert was once a beginner. You've got this!"}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
