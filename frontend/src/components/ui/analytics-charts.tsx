"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Target, BookOpen } from "lucide-react";

interface WeeklyProgressChartProps {
  data: Array<{
    week: string;
    study_time: number;
    completion: number;
    sessions: number;
  }>;
}

export function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Weekly Progress
        </CardTitle>
        <CardDescription>Your study time and completion rate over the past weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="week" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="time"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}m`}
              />
              <YAxis 
                yAxisId="completion"
                orientation="right"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <div className="space-y-1 mt-2">
                          <p className="text-sm text-blue-600">
                            Study Time: {payload[0]?.value} minutes
                          </p>
                          <p className="text-sm text-green-600">
                            Completion: {payload[1]?.value}%
                          </p>
                          <p className="text-sm text-purple-600">
                            Sessions: {payload[0]?.payload?.sessions}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                yAxisId="time"
                type="monotone"
                dataKey="study_time"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Line
                yAxisId="completion"
                type="monotone"
                dataKey="completion"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface SubjectPerformanceChartProps {
  data: Array<{
    subject: string;
    sessions: number;
    avg_time: number;
    completion: number;
    difficulty: string;
  }>;
}

export function SubjectPerformanceChart({ data }: SubjectPerformanceChartProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "#10b981";
      case "medium": return "#f59e0b";
      case "hard": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Subject Performance
        </CardTitle>
        <CardDescription>Your performance across different subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                domain={[0, 100]}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="category"
                dataKey="subject"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <div className="space-y-1 mt-2">
                          <p className="text-sm">
                            Completion: {data?.completion}%
                          </p>
                          <p className="text-sm">
                            Sessions: {data?.sessions}
                          </p>
                          <p className="text-sm">
                            Avg Time: {data?.avg_time} min
                          </p>
                          <Badge 
                            variant="outline" 
                            style={{ backgroundColor: getDifficultyColor(data?.difficulty) + "20" }}
                          >
                            {data?.difficulty}
                          </Badge>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="completion" 
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface StudyTimeDistributionProps {
  data: Array<{
    subject: string;
    time: number;
    sessions: number;
  }>;
}

export function StudyTimeDistribution({ data }: StudyTimeDistributionProps) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const total = data.reduce((sum, item) => sum + item.time, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Study Time Distribution
        </CardTitle>
        <CardDescription>How you spend your study time across subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center">
          <div className="w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="time"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      const percentage = ((data?.time / total) * 100).toFixed(1);
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data?.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {data?.time} minutes ({percentage}%)
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data?.sessions} sessions
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-4">
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.time}m • {item.sessions} sessions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {((item.time / total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressTrendChartProps {
  data: Array<{
    date: string;
    xp: number;
    level: number;
    sessions: number;
    study_time: number;
  }>;
}

export function ProgressTrendChart({ data }: ProgressTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Progress Trend
        </CardTitle>
        <CardDescription>Your learning progress over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                yAxisId="xp"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} XP`}
              />
              <YAxis 
                yAxisId="sessions"
                orientation="right"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">
                          {label ? new Date(label).toLocaleDateString() : ''}
                        </p>
                        <div className="space-y-1 mt-2">
                          <p className="text-sm text-blue-600">
                            XP: {data?.xp}
                          </p>
                          <p className="text-sm text-green-600">
                            Level: {data?.level}
                          </p>
                          <p className="text-sm text-purple-600">
                            Sessions: {data?.sessions}
                          </p>
                          <p className="text-sm text-orange-600">
                            Study Time: {data?.study_time}m
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                yAxisId="xp"
                type="monotone"
                dataKey="xp"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="sessions"
                type="monotone"
                dataKey="sessions"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}