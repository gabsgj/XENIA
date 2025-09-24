'use client';

import { useState, useEffect } from 'react';
import { api, getUserId } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Zap, Target, Clock, Calendar, TrendingUp } from 'lucide-react';

interface IndicatorData {
  study_streak: number;
  total_xp: number;
  tasks_completed_today: number;
  time_studied_today: number;
  next_deadline: {
    task: string;
    date: string;
    days_remaining: number;
  } | null;
  weekly_goal_progress: number;
}

interface IndicatorsProps {
  className?: string;
}

export function Indicators({ className }: IndicatorsProps) {
  const [data, setData] = useState<IndicatorData>({
    study_streak: 0,
    total_xp: 0,
    tasks_completed_today: 0,
    time_studied_today: 0,
    next_deadline: null,
    weekly_goal_progress: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchIndicatorData = async () => {
    try {
      setLoading(true);
      
      const userId = getUserId();
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch multiple data sources in parallel
      const [analyticsResponse, planResponse] = await Promise.all([
        api('/api/analytics/student').catch(() => null),
        api('/api/plan/current').catch(() => null)
      ]);

      let indicatorData: IndicatorData = {
        study_streak: 0,
        total_xp: 0,
        tasks_completed_today: 0,
        time_studied_today: 0,
        next_deadline: null,
        weekly_goal_progress: 0
      };

      // Process analytics data
      if (analyticsResponse) {
        indicatorData.study_streak = analyticsResponse.profile?.streak_days || 0;
        indicatorData.total_xp = analyticsResponse.profile?.total_xp || 0;

        // Calculate today's activity
        const todaySessions = analyticsResponse.sessions?.filter((s: any) => 
          s.created_at?.startsWith(today)
        ) || [];
        
        indicatorData.tasks_completed_today = todaySessions.length;
        indicatorData.time_studied_today = todaySessions.reduce((total: number, session: any) => 
          total + (session.duration_min || 0), 0
        );

        // Calculate weekly goal progress (assuming 5 hours per week goal)
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        const thisWeekSessions = analyticsResponse.sessions?.filter((s: any) => 
          s.created_at >= weekStartStr
        ) || [];
        
        const weeklyMinutes = thisWeekSessions.reduce((total: number, session: any) => 
          total + (session.duration_min || 0), 0
        );
        
        indicatorData.weekly_goal_progress = Math.min(100, Math.round((weeklyMinutes / 300) * 100)); // 300 min = 5 hours
      }

      // Process plan data for deadlines
      if (planResponse && planResponse.sessions) {
        const upcomingSessions = planResponse.sessions
          .filter((s: any) => s.date >= today && s.status !== 'completed')
          .sort((a: any, b: any) => a.date.localeCompare(b.date));

        if (upcomingSessions.length > 0) {
          const nextSession = upcomingSessions[0];
          const deadlineDate = new Date(nextSession.date);
          const todayDate = new Date();
          const daysRemaining = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

          indicatorData.next_deadline = {
            task: nextSession.topic,
            date: nextSession.date,
            days_remaining: daysRemaining
          };
        }
      }

      setData(indicatorData);
    } catch (err) {
      console.error('Failed to fetch indicator data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicatorData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchIndicatorData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStreakColor = (days: number) => {
    if (days >= 30) return 'text-purple-600';
    if (days >= 14) return 'text-orange-600';
    if (days >= 7) return 'text-yellow-600';
    if (days >= 3) return 'text-green-600';
    return 'text-gray-600';
  };

  const getDeadlineUrgency = (days: number) => {
    if (days <= 1) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (days <= 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (days <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      {/* Study Streak */}
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${getStreakColor(data.study_streak)}`} />
            <div>
              <div className="text-2xl font-bold">{data.study_streak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total XP */}
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold">{data.total_xp}</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Today */}
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{data.tasks_completed_today}</div>
              <div className="text-xs text-muted-foreground">Tasks Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Today */}
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{data.time_studied_today}</div>
              <div className="text-xs text-muted-foreground">Min Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Deadline */}
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              {data.next_deadline ? (
                <>
                  <div className="text-2xl font-bold">{data.next_deadline.days_remaining}</div>
                  <div className="text-xs text-muted-foreground">Days Left</div>
                  <Badge 
                    className={`text-xs mt-1 ${getDeadlineUrgency(data.next_deadline.days_remaining)}`}
                    variant="outline"
                  >
                    {data.next_deadline.days_remaining <= 1 ? 'Due Soon!' : 
                     data.next_deadline.days_remaining <= 3 ? 'Urgent' : 
                     data.next_deadline.days_remaining <= 7 ? 'This Week' : 'Upcoming'}
                  </Badge>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">--</div>
                  <div className="text-xs text-muted-foreground">No Deadlines</div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goal */}
      <Card className="hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-2xl font-bold">{data.weekly_goal_progress}%</div>
              <div className="text-xs text-muted-foreground">Weekly Goal</div>
              {data.weekly_goal_progress >= 100 && (
                <Badge className="text-xs mt-1 bg-green-100 text-green-800">
                  🎉 Goal Met!
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
