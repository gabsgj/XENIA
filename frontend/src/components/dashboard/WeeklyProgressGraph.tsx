'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api, getUserId } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';

interface WeeklyProgressData {
  date: string;
  study_time: number;
  sessions: number;
  completion: number;
  tasks_completed: number;
}

interface WeeklyProgressGraphProps {
  className?: string;
}

export function WeeklyProgressGraph({ className }: WeeklyProgressGraphProps) {
  const [data, setData] = useState<WeeklyProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      // Fetch analytics data for the last 7 days
      const response = await api(`/api/analytics/weekly?user_id=${userId}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
      
      if (response && response.weekly_progress) {
        const processedData = response.weekly_progress.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          study_time: Number(item.study_time || 0),
          sessions: Number(item.sessions || 0),
          completion: Number(item.completion || 0),
          tasks_completed: Number(item.tasks_completed || 0)
        }));
        
        setData(processedData);
      } else {
        // Fallback: generate last 7 days with zero data
        const fallbackData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            study_time: 0,
            sessions: 0,
            completion: 0,
            tasks_completed: 0
          };
        });
        setData(fallbackData);
      }
    } catch (err) {
      console.error('Failed to fetch weekly progress:', err);
      setError('Failed to load progress data');
      
      // Generate fallback data on error
      const fallbackData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          study_time: 0,
          sessions: 0,
          completion: 0,
          tasks_completed: 0
        };
      });
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
    
    // Set up real-time updates when tasks are completed
    const interval = setInterval(fetchWeeklyData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const totalStudyTime = useMemo(() => {
    return data.reduce((sum, day) => sum + day.study_time, 0);
  }, [data]);

  const averageCompletion = useMemo(() => {
    const validDays = data.filter(day => day.completion > 0);
    if (validDays.length === 0) return 0;
    return Math.round(validDays.reduce((sum, day) => sum + day.completion, 0) / validDays.length);
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            Study Time: {payload[0]?.value || 0} minutes
          </p>
          <p className="text-green-600">
            Sessions: {payload[0]?.payload?.sessions || 0}
          </p>
          <p className="text-purple-600">
            Completion: {payload[0]?.payload?.completion || 0}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Progress
          </CardTitle>
          <CardDescription>Your study activity over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
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
          <TrendingUp className="w-5 h-5" />
          Weekly Progress
        </CardTitle>
        <CardDescription>
          Your study activity over the last 7 days
          {totalStudyTime > 0 && (
            <span className="ml-2 text-primary font-semibold">
              • {totalStudyTime} min total • {averageCompletion}% avg completion
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{error}</p>
            </div>
          </div>
        ) : data.length === 0 || data.every(d => d.study_time === 0) ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No study activity yet this week</p>
              <p className="text-sm">Start a study session to see your progress!</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="study_time"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
