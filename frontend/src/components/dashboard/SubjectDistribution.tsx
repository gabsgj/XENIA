'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { api, getUserId } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart as PieChartIcon, Clock, BookOpen } from 'lucide-react';

interface SubjectTimeData {
  name: string;
  value: number; // time in minutes
  hours: number;
  percentage: number;
  sessions: number;
  color: string;
}

interface SubjectDistributionProps {
  className?: string;
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280'  // gray
];

export function SubjectDistribution({ className }: SubjectDistributionProps) {
  const [data, setData] = useState<SubjectTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  const fetchSubjectDistribution = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      
      // Fetch study sessions data
      const response = await api(`/api/analytics/student`);
      
      if (response && response.sessions) {
        // Group sessions by subject and calculate time spent
        const subjectMap = new Map<string, {
          totalTime: number;
          sessions: number;
        }>();

        response.sessions.forEach((session: any) => {
          const subject = session.topic?.split(':')[0] || session.topic || 'General';
          const duration = session.duration_min || 0;
          
          const existing = subjectMap.get(subject) || { totalTime: 0, sessions: 0 };
          existing.totalTime += duration;
          existing.sessions += 1;
          
          subjectMap.set(subject, existing);
        });

        // Calculate total time for percentages
        const total = Array.from(subjectMap.values()).reduce((sum, data) => sum + data.totalTime, 0);
        setTotalTime(total);

        // Convert to chart data format
        const chartData: SubjectTimeData[] = Array.from(subjectMap.entries())
          .map(([subject, data], index) => ({
            name: subject,
            value: data.totalTime,
            hours: Math.round((data.totalTime / 60) * 10) / 10, // Round to 1 decimal
            percentage: total > 0 ? Math.round((data.totalTime / total) * 100) : 0,
            sessions: data.sessions,
            color: CHART_COLORS[index % CHART_COLORS.length]
          }))
          .filter(item => item.value > 0) // Only include subjects with study time
          .sort((a, b) => b.value - a.value); // Sort by time spent (descending)

        setData(chartData);
      } else {
        setData([]);
        setTotalTime(0);
      }
    } catch (err) {
      console.error('Failed to fetch subject distribution:', err);
      setError('Failed to load time distribution data');
      setData([]);
      setTotalTime(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectDistribution();
    
    // Set up real-time updates
    const interval = setInterval(fetchSubjectDistribution, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const totalHours = useMemo(() => {
    return Math.round((totalTime / 60) * 10) / 10;
  }, [totalTime]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Time: {data.hours}h ({data.value}min)</p>
          <p className="text-sm">Sessions: {data.sessions}</p>
          <p className="text-sm">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Subject Distribution
          </CardTitle>
          <CardDescription>Time spent by subject this week</CardDescription>
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
          <PieChartIcon className="w-5 h-5" />
          Subject Distribution
        </CardTitle>
        <CardDescription>
          Time spent by subject
          {totalHours > 0 && (
            <span className="ml-2 text-primary font-semibold">
              • {totalHours}h total
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{error}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No study time recorded yet</p>
              <p className="text-sm">Complete some study sessions to see time distribution</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pie Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={70}
                    innerRadius={25}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with detailed stats */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Time Breakdown</h4>
              <div className="grid grid-cols-1 gap-2">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.hours}h</div>
                      <div className="text-xs text-muted-foreground">
                        {item.sessions} sessions • {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            {totalHours > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{totalHours}h</div>
                    <div className="text-xs text-muted-foreground">Total Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{data.length}</div>
                    <div className="text-xs text-muted-foreground">Subjects</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
