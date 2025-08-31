"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useErrorContext } from "@/lib/error-context";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { MainLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Target, 
  BookOpen, 
  Award,
  Play,
  Plus,
  ArrowRight
} from "lucide-react";

export default function DashboardPage(){
  const [data, setData] = useState<any>(null);
  const { pushError } = useErrorContext();
  
  useEffect(()=>{ 
    (async()=>{
      try{ 
        setData(await api('/api/analytics/student?user_id=demo-user')) 
      }
      catch(e:any){ 
        pushError({ 
          errorCode: e?.errorCode||'CONTENT_API_FAIL', 
          errorMessage: e?.errorMessage, 
          details: e
        }) 
      }
    })() 
  },[pushError])

  const todaysTasks = [
    { id: 1, subject: "Organic Chemistry", topic: "Molecular Structures", duration: 45, progress: 60, status: "in-progress" },
    { id: 2, subject: "Calculus", topic: "Derivatives", duration: 30, progress: 30, status: "pending" },
    { id: 3, subject: "Physics", topic: "Kinematics", duration: 60, progress: 0, status: "pending" },
  ];

  const recentAchievements = [
    { title: "Study Streak", description: "7 days in a row!", icon: Award },
    { title: "Quick Learner", description: "Completed 5 topics this week", icon: TrendingUp },
    { title: "Consistent", description: "Met daily goals", icon: Target },
  ];

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome back, Student!</h1>
            <p className="text-muted-foreground">Keep your streak alive and level up your learning.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/planner">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Study Session
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-3xl font-bold">{data ? (data.tasks||[]).filter((t:any)=> t.status==='done').length : '12'}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Time</p>
                  <p className="text-3xl font-bold">{data ? (data.sessions||[]).reduce((a:number,b:any)=> a+(b.duration_min||0),0) : '245'}<span className="text-lg font-normal">min</span></p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-3xl font-bold">{data?.profile?.streak_days || '7'}<span className="text-lg font-normal">days</span></p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level Progress</p>
                  <p className="text-3xl font-bold">85<span className="text-lg font-normal">%</span></p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Study Plan */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Today's Study Plan
                    </CardTitle>
                    <CardDescription>
                      Your personalized schedule for today
                    </CardDescription>
                  </div>
                  <Badge variant="success">On Track</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{task.subject}</h4>
                        <p className="text-sm text-muted-foreground">{task.topic}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{task.duration} min</span>
                        {task.status === "in-progress" ? (
                          <Button size="sm">
                            <Play className="w-3 h-3 mr-1" />
                            Continue
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  </div>
                ))}
                <Link href="/planner">
                  <Button variant="outline" className="w-full">
                    View Full Plan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Study Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Study Progress</CardTitle>
                <CardDescription>Your daily study minutes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.sessions?.map((s:any)=> ({ 
                      date: s.created_at?.slice(0,10), 
                      minutes: s.duration_min 
                    })) || [
                      { date: '2024-01-01', minutes: 45 },
                      { date: '2024-01-02', minutes: 60 },
                      { date: '2024-01-03', minutes: 30 },
                      { date: '2024-01-04', minutes: 75 },
                      { date: '2024-01-05', minutes: 90 },
                      { date: '2024-01-06', minutes: 45 },
                      { date: '2024-01-07', minutes: 120 },
                    ]}>
                      <XAxis dataKey='date' />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type='monotone' 
                        dataKey='minutes' 
                        stroke='hsl(var(--primary))' 
                        fill='hsl(var(--primary) / 0.2)' 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/tutor">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ask AI Tutor
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Materials
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>Your latest milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <achievement.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Subject Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Time spent by subject this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Math', value: 35, color: chartColors[0] },
                          { name: 'Science', value: 30, color: chartColors[1] },
                          { name: 'English', value: 20, color: chartColors[2] },
                          { name: 'History', value: 15, color: chartColors[3] },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {[
                          { name: 'Math', value: 35, color: chartColors[0] },
                          { name: 'Science', value: 30, color: chartColors[1] },
                          { name: 'English', value: 20, color: chartColors[2] },
                          { name: 'History', value: 15, color: chartColors[3] },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { name: 'Math', value: 35, color: chartColors[0] },
                    { name: 'Science', value: 30, color: chartColors[1] },
                    { name: 'English', value: 20, color: chartColors[2] },
                    { name: 'History', value: 15, color: chartColors[3] },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled study sessions for the week</CardDescription>
              </div>
              <Link href="/planner">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { subject: "Mathematics", topic: "Linear Algebra", date: "Tomorrow", time: "2:00 PM", duration: "60 min" },
                { subject: "Physics", topic: "Thermodynamics", date: "Wed", time: "10:00 AM", duration: "45 min" },
                { subject: "Chemistry", topic: "Organic Reactions", date: "Thu", time: "3:00 PM", duration: "90 min" },
              ].map((session, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{session.subject}</h4>
                    <Badge variant="outline">{session.duration}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{session.topic}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{session.date}</span>
                    <span>{session.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

