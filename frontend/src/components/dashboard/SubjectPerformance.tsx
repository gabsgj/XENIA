'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { api, getUserId } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, AlertCircle } from 'lucide-react';

interface SubjectData {
  subject: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  study_time: number;
  avg_score: number;
  status: 'excellent' | 'good' | 'needs_improvement';
}

interface SubjectPerformanceProps {
  className?: string;
}

export function SubjectPerformance({ className }: SubjectPerformanceProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      
      // Fetch current plan and progress data
      const [planResponse, progressResponse] = await Promise.all([
        api('/api/plan/current').catch(() => null),
        api(`/api/progress/user/${userId}`).catch(() => ({ progress: {} }))
      ]);

      if (planResponse && planResponse.sessions) {
        // Group sessions by subject
        const subjectMap = new Map<string, {
          total_tasks: number;
          completed_tasks: number;
          study_time: number;
          scores: number[];
        }>();

        planResponse.sessions.forEach((session: any) => {
          const subject = session.topic.split(':')[0] || session.topic;
          const existing = subjectMap.get(subject) || {
            total_tasks: 0,
            completed_tasks: 0,
            study_time: 0,
            scores: []
          };

          existing.total_tasks += 1;
          if (session.status === 'completed') {
            existing.completed_tasks += 1;
            existing.study_time += session.duration_min || 0;
          }

          subjectMap.set(subject, existing);
        });

        // Add quiz scores from progress data
        const progressData = progressResponse.progress || {};
        Object.entries(progressData).forEach(([topic, stats]: [string, any]) => {
          const subject = topic.split(':')[0] || topic;
          const existing = subjectMap.get(subject);
          if (existing && stats.last_score) {
            existing.scores.push(stats.last_score * 100);
          }
        });

        // Convert to array and calculate performance metrics
        const subjectData: SubjectData[] = Array.from(subjectMap.entries()).map(([subject, data]) => {
          const completion_rate = data.total_tasks > 0 ? (data.completed_tasks / data.total_tasks) * 100 : 0;
          const avg_score = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
          
          let status: 'excellent' | 'good' | 'needs_improvement' = 'needs_improvement';
          if (completion_rate >= 80 && avg_score >= 80) {
            status = 'excellent';
          } else if (completion_rate >= 50 && avg_score >= 60) {
            status = 'good';
          }

          return {
            subject,
            total_tasks: data.total_tasks,
            completed_tasks: data.completed_tasks,
            completion_rate: Math.round(completion_rate),
            study_time: data.study_time,
            avg_score: Math.round(avg_score),
            status
          };
        });

        // Sort by completion rate descending
        subjectData.sort((a, b) => b.completion_rate - a.completion_rate);
        setSubjects(subjectData);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error('Failed to fetch subject performance:', err);
      setError('Failed to load subject data');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectData();
    
    // Set up real-time updates
    const interval = setInterval(fetchSubjectData, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981'; // green
      case 'good': return '#f59e0b'; // yellow
      case 'needs_improvement': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Excellent</Badge>;
      case 'good': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Good</Badge>;
      case 'needs_improvement': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Needs Work</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const chartData = useMemo(() => {
    return subjects.map(subject => ({
      ...subject,
      color: getStatusColor(subject.status)
    }));
  }, [subjects]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">Completion: {data.completion_rate}%</p>
          <p className="text-sm">Tasks: {data.completed_tasks}/{data.total_tasks}</p>
          <p className="text-sm">Study Time: {data.study_time} min</p>
          {data.avg_score > 0 && <p className="text-sm">Avg Score: {data.avg_score}%</p>}
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
            <BookOpen className="w-5 h-5" />
            Subject Performance
          </CardTitle>
          <CardDescription>Completion rates by subject</CardDescription>
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
          <BookOpen className="w-5 h-5" />
          Subject Performance
        </CardTitle>
        <CardDescription>
          Completion rates and performance by subject
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{error}</p>
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No subject data available</p>
              <p className="text-sm">Complete some study sessions to see performance metrics</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis 
                    dataKey="subject" 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completion_rate" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Detailed Breakdown
              </h4>
              {subjects.map((subject, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{subject.subject}</h5>
                    {getStatusBadge(subject.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{subject.completion_rate}%</span>
                    </div>
                    <Progress value={subject.completion_rate} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-2">
                      <div>Tasks: {subject.completed_tasks}/{subject.total_tasks}</div>
                      <div>Time: {subject.study_time}min</div>
                      {subject.avg_score > 0 && (
                        <>
                          <div>Avg Score: {subject.avg_score}%</div>
                          <div></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
