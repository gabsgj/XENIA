'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Activity,
  Download
} from 'lucide-react'

export default function AnalyticsPage() {
  const { pushError } = useErrorContext()
  
  useEffect(() => {
    (async () => {
      try {
        await api('/api/analytics/student?user_id=demo-user')
      } catch (e: any) {
        pushError({
          errorCode: e?.errorCode || 'ANALYTICS_FAIL',
          errorMessage: e?.errorMessage,
          details: e
        })
      }
    })()
  }, [pushError])

  // Mock data for fallback visuals
  const mockData = {
    weeklyProgress: [
      { week: 'Week 1', completed: 85, target: 100 },
      { week: 'Week 2', completed: 92, target: 100 },
      { week: 'Week 3', completed: 78, target: 100 },
      { week: 'Week 4', completed: 95, target: 100 },
    ],
    subjectMastery: [
      { subject: 'Mathematics', mastery: 85, totalTopics: 20, completedTopics: 17 },
      { subject: 'Physics', mastery: 72, totalTopics: 15, completedTopics: 11 },
      { subject: 'Chemistry', mastery: 90, totalTopics: 18, completedTopics: 16 },
      { subject: 'Biology', mastery: 68, totalTopics: 22, completedTopics: 15 },
    ],
    studyTime: [
      { date: '2024-01-01', minutes: 45 },
      { date: '2024-01-02', minutes: 60 },
      { date: '2024-01-03', minutes: 30 },
      { date: '2024-01-04', minutes: 75 },
      { date: '2024-01-05', minutes: 90 },
      { date: '2024-01-06', minutes: 45 },
      { date: '2024-01-07', minutes: 120 },
    ],
    performanceMetrics: {
      totalStudyTime: 465,
      averageSessionLength: 66,
      streakDays: 7,
      completionRate: 85,
      weakTopics: ['Organic Chemistry', 'Calculus Integration', 'Quantum Physics'],
      strongTopics: ['Linear Algebra', 'Cell Biology', 'Thermodynamics']
    }


  // Derive metrics from data when available
  const totalStudyTime = data ? (data.sessions || []).reduce((a:number,b:any)=> a + (b.duration_min||0), 0) : mockData.performanceMetrics.totalStudyTime
  const completionRate = data ? Math.round(((data.tasks||[]).filter((t:any)=> t.status==='done').length / Math.max(1,(data.tasks||[]).length)) * 100) : mockData.performanceMetrics.completionRate
  const streakDays = data?.profile?.streak_days ?? mockData.performanceMetrics.streakDays
  const averageSessionLength = data && (data.sessions||[]).length ? Math.round(totalStudyTime / (data.sessions||[]).length) : mockData.performanceMetrics.averageSessionLength
  const studyTimeSeries = (data?.sessions||[]).map((s:any)=> ({ date: (s.created_at||'').slice(0,10), minutes: s.duration_min||0 }))

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your learning progress and performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Study Time</p>
                  <p className="text-3xl font-bold">{totalStudyTime}<span className="text-lg font-normal">min</span></p>
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
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold">{completionRate}<span className="text-lg font-normal">%</span></p>
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
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-3xl font-bold">{streakDays}<span className="text-lg font-normal">days</span></p>
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
                  <p className="text-sm text-muted-foreground">Avg Session</p>
                  <p className="text-3xl font-bold">{averageSessionLength}<span className="text-lg font-normal">min</span></p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="mastery">Mastery</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Progress</CardTitle>
                  <CardDescription>Completion rate vs targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockData.weeklyProgress}>
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="target" fill="hsl(var(--muted))" />
                        <Bar dataKey="completed" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Streak</CardTitle>
                  <CardDescription>Daily study consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studyTimeSeries.length?studyTimeSeries:mockData.studyTime}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="minutes" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mastery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Mastery</CardTitle>
                <CardDescription>Your progress across different subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockData.subjectMastery.map((subject) => (
                    <div key={subject.subject} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{subject.subject}</h4>
                        <Badge variant={subject.mastery >= 80 ? 'success' : subject.mastery >= 60 ? 'warning' : 'destructive'}>
                          {subject.mastery}%
                        </Badge>
                      </div>
                      <Progress value={subject.mastery} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{subject.completedTopics} of {subject.totalTopics} topics completed</span>
                        <span>{subject.totalTopics - subject.completedTopics} remaining</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Study Time Analysis</CardTitle>
                <CardDescription>Daily study minutes over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studyTimeSeries.length?studyTimeSeries:mockData.studyTime}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="minutes" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Strong Areas
                  </CardTitle>
                  <CardDescription>Topics you're excelling in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockData.performanceMetrics.strongTopics.map((topic) => (
                      <div key={topic} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{topic}</span>
                        <Badge variant="success" className="ml-auto">Strong</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    Areas for Improvement
                  </CardTitle>
                  <CardDescription>Topics that need more attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockData.performanceMetrics.weakTopics.map((topic) => (
                      <div key={topic} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="font-medium">{topic}</span>
                        <Badge variant="warning" className="ml-auto">Focus</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Personalized suggestions to improve your learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Increase Study Sessions</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Consider adding 15 more minutes to your daily sessions to improve retention.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Great Consistency!</h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      You've maintained a 7-day study streak. Keep up the excellent work!
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100">Focus on Weak Areas</h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Spend extra time on Organic Chemistry concepts to improve your overall performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}