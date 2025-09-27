"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api, getUserId } from "@/lib/api";
import { useErrorContext } from "@/lib/error-context";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { MainLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NoDataPlaceholder } from "@/components/ui/no-data-placeholder";
import MinimalTimer from "@/components/ui/minimal-timer";
import EnhancedRecommendationsPanel from "@/components/EnhancedRecommendationsPanel";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Target, 
  BookOpen, 
  Award,
  Plus,
  ArrowRight
} from "lucide-react";

export default function DashboardPage(){
  const [data, setData] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const { pushError } = useErrorContext();
  const [dashSessionStatus, setDashSessionStatus] = useState<Record<string, 'pending' | 'in-progress' | 'completed'>>({})
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    try{ 
      const [analytics, currentPlan, topicResp, progressResp, dashboardResp] = await Promise.all([
        api('/api/analytics/student').catch(()=> null),
        api('/api/plan/current').catch(()=> null),
        api('/api/resources/topics').catch(()=> ({topics:[]})),
        api('/api/progress/user/' + getUserId()).catch(()=> ({progress:{}})),
        api('/api/dashboard').catch(()=> null)
      ])
      if(analytics) setData(analytics)
      if(currentPlan) setPlan(currentPlan)
      setTopics((topicResp as any)?.topics||[])
      setProgress((progressResp as any)?.progress||{})
      // Prefer weekly from dashboard, fallback to analytics
      const weeklyFromDash = (dashboardResp && (dashboardResp.weeklyProgress || dashboardResp.weekly_progress)) || []
      setWeekly(weeklyFromDash.length ? weeklyFromDash : (analytics?.weekly_progress || []))
    } catch(e:any){ 
      pushError({ errorCode: e?.errorCode||'CONTENT_API_FAIL', errorMessage: e?.errorMessage, details: e }) 
    } finally { setLoading(false) }
  }, [pushError])

  useEffect(()=>{ 
    fetchData() 
  },[fetchData])

  // Add window focus listener to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      fetchData()
    }
    
    window.addEventListener('focus', handleFocus)
    const onVisibility = () => {
      if (!document.hidden) {
        fetchData()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchData])

  const updateSessionStatus = async (date: string, topic: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    try {
      const key = `${date}-${topic}`
      // Optimistic local status update for instant UI feedback
      setDashSessionStatus(prev => ({ ...prev, [key]: newStatus }))
      setPlan((prev: any) => {
        if (!prev?.sessions) return prev
        return {
          ...prev,
          sessions: prev.sessions.map((s: any) => s.date === date && s.topic === topic ? { ...s, status: newStatus } : s)
        }
      })
      const resp = await api('/api/resources/progress', {
        method: 'POST',
        body: JSON.stringify({ sessions: [{ date, topic, status: newStatus }] })
      })
      if (resp.ok) {
        if ((resp as any).plan) setPlan((resp as any).plan)
        setTimeout(fetchData, 600)
      }
    } catch(e:any){
      pushError({ errorCode: e?.errorCode||'PLAN_PROGRESS_FAIL', errorMessage: e?.errorMessage, details: e })
    }
  }

  const markSessionComplete = async (date: string, topic: string, actualTime: number) => {
    try {
      const key = `${date}-${topic}`
      // Optimistic local update
      setDashSessionStatus(prev => ({ ...prev, [key]: 'completed' }))
      setPlan((prev: any) => {
        if (!prev?.sessions) return prev
        return {
          ...prev,
          sessions: prev.sessions.map((s: any) => s.date === date && s.topic === topic ? { ...s, status: 'completed', duration_min: actualTime } : s)
        }
      })
      // Update the session status to completed and adjust the duration
      const resp = await api('/api/resources/progress', {
        method: 'POST',
        body: JSON.stringify({ sessions: [{ date, topic, status: 'completed', duration_min: actualTime }] })
      })
      // Also mark topic as completed in syllabus (best-effort)
      try {
        await api('/api/resources/topics/status', {
          method: 'POST',
          body: JSON.stringify({ topic, status: 'completed', user_id: getUserId() })
        })
      } catch {}
      if (resp.ok) {
        if ((resp as any).plan) setPlan((resp as any).plan)
        setTimeout(fetchData, 600)
      }
    } catch(e:any){
      pushError({ errorCode: e?.errorCode||'PLAN_PROGRESS_FAIL', errorMessage: e?.errorMessage, details: e })
    }
  }

  const todaysTasks = useMemo(()=>{
    if(!plan) return []
    const today = new Date().toISOString().slice(0,10)
    return (plan.sessions||[]).filter((s:any)=> s.date === today).map((s:any, idx:number)=> {
      const key = `${s.date}-${s.topic}`
      const effectiveStatus = dashSessionStatus[key] || s.status || 'pending'
      return ({
        id: idx+1,
        subject: s.topic.split(':')[0] || s.topic,
        topic: s.topic,
        date: s.date,
        duration: s.duration_min || 45,
        progress: effectiveStatus==='completed'? 100 : effectiveStatus==='in-progress'? 50 : 0,
        status: effectiveStatus
      })
    })
  },[plan, dashSessionStatus])

  const upcomingSessions = useMemo(()=>{
    if(!plan) return []
    const todayStr = new Date().toISOString().slice(0,10)
    return (plan.sessions||[])
      .filter((s:any)=> s.date >= todayStr)
      .sort((a:any,b:any)=> a.date.localeCompare(b.date))
      .slice(0,9)
  },[plan])

  // Next 3 days plan grouped by date
  const next3Days = useMemo(() => {
    const start = new Date();
    start.setHours(0,0,0,0)
    const days = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d.toISOString().slice(0,10)
    })
    const sessionsByDate: Record<string, any[]> = {}
    days.forEach(date => {
      sessionsByDate[date] = (plan?.sessions || []).filter((s:any) => s.date === date)
    })
    return { days, sessionsByDate }
  }, [plan])

  // Low-data fallbacks for charts
  const fallbackStudy7 = useMemo(() => {
    const end = new Date(); end.setHours(0,0,0,0)
    const items = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end); d.setDate(end.getDate() - (6 - i))
      const key = d.toISOString().slice(0,10)
      const analyticsMins = (data?.sessions || [])
        .filter((s:any) => (s.created_at || '').slice(0,10) === key)
        .reduce((sum:number, s:any) => sum + Number(s.duration_min || 0), 0)
      const planMins = (plan?.sessions || [])
        .filter((s:any) => s.date === key)
        .reduce((sum:number, s:any) => sum + Number(s.duration_min || 0), 0)
      const minutes = Math.max(analyticsMins, planMins)
      return { date: key, minutes }
    })
    const max = Math.max(1, ...items.map(x => x.minutes))
    const total = items.reduce((a,b)=> a + b.minutes, 0)
    return { items, max, total }
  }, [data, plan])

  const subjectFallback = useMemo(() => {
    const combined = [...(plan?.sessions || []), ...(data?.sessions || [])]
    const bySubject: Record<string, number> = {}
    combined.forEach((s:any) => {
      const subject = (s.topic || 'General').toString().split(':')[0]
      const minutes = Number(s.duration_min || 0)
      bySubject[subject] = (bySubject[subject] || 0) + minutes
    })
    return Object.entries(bySubject).sort((a,b)=> b[1]-a[1]).slice(0,5)
  }, [plan, data])

  const planTopicsForRecs = useMemo(() => {
    return Array.from(new Set((plan?.sessions || []).map((s:any) => s.topic).filter(Boolean))) as string[]
  }, [plan])

  const topicStatusCounts = useMemo(()=>{
    const counts: Record<string, number> = { pending:0, 'in-progress':0, completed:0 }
    topics.forEach(t=> { counts[t.status||'pending'] = (counts[t.status||'pending']||0)+1 })
    return counts
  },[topics])

  const percentComplete = plan?.progress?.percent_complete ?? (()=>{ const s = plan?.sessions||[]; const c = s.filter((x:any)=> x.status==='completed').length; return s.length? Math.round(c/s.length*100):0 })()

  // Enhanced calculations using both plan and analytics data
  const enhancedStats = useMemo(()=>{
    const planSessions = plan?.sessions || []
    const completedPlanSessions = planSessions.filter((s:any) => s.status === 'completed')
    const analyticsSessions = data?.sessions || []
    const analyticsTasks = data?.tasks || []
    
    // Use plan data if available, fallback to analytics
    const sessionsCompleted = plan?.progress?.sessions_completed ?? completedPlanSessions.length
    
    // Calculate total study time from completed plan sessions + analytics sessions
    const planStudyTime = completedPlanSessions.reduce((total:number, session:any) => total + (session.duration_min || 0), 0)
    const analyticsStudyTime = analyticsSessions.reduce((total:number, session:any) => total + (session.duration_min || 0), 0)
    const totalStudyTime = Math.max(planStudyTime, analyticsStudyTime) // Use whichever is higher
    
    // Enhanced streak calculation using analytics profile data
    const streakDays = data?.profile?.streak_days || (completedPlanSessions.length > 0 ? 1 : 0)
    
    // Calculate quiz performance: prefer server-provided analytics (quizzesTaken) when available
    const topicsWithQuizzes = Object.values(progress || {}).filter((topic: any) => (topic.quizzes_taken || 0) > 0)
    const totalQuizzesFromProgress = topicsWithQuizzes.reduce((sum: number, topic: any) => sum + (topic.quizzes_taken || 0), 0)
    const avgScoreFromProgress = topicsWithQuizzes.length > 0 
      ? topicsWithQuizzes.reduce((sum: number, topic: any) => sum + (topic.last_score || 0), 0) / topicsWithQuizzes.length
      : 0

    // Server analytics may include an authoritative quizzesTaken count (dashboard API)
    const serverQuizzes = (data && data.stats && typeof data.stats.quizzesTaken === 'number') ? data.stats.quizzesTaken : 0
    const totalQuizzes = serverQuizzes > 0 ? serverQuizzes : totalQuizzesFromProgress
    const avgScore = topicsWithQuizzes.length > 0 ? avgScoreFromProgress : 0
    
    return {
      sessionsCompleted,
      totalStudyTime,
      streakDays,
      totalQuizzes: totalQuizzes || 0,
      avgScore: isNaN(avgScore) ? 0 : Math.round(avgScore * 100)
    }
  }, [plan, data, progress])

  // Normalize data for charts to ensure numeric fields and consistent keys
  const studyChartData = useMemo(() => {
    const sessions = data?.sessions || [];
    return sessions.map((s: any) => ({
      date: (s.created_at || '').slice(0,10),
      minutes: Number(s.duration_min || 0),
      topic: s.topic || 'General'
    }));
  }, [data]);

  const weeklyChartData = useMemo(() => {
    // backend sends weekly_progress as [{week, study_time, completion, sessions}]
    const w = (data?.weekly_progress || weekly || []) as any[];
    return w.map(item => ({
      week: item.week || item.date || '',
      study_time: Number(item.study_time || 0),
      completion: Number(item.completion || 0),
      sessions: Number(item.sessions || 0)
    }));
  }, [data, weekly]);

  const recentAchievements = useMemo(()=>{
    const achievements = [
      { title: 'Study Streak', description: `${enhancedStats.streakDays} days in a row`, icon: Award },
      { title: 'Completed Sessions', description: `${enhancedStats.sessionsCompleted} finished`, icon: TrendingUp },
      { title: 'Active Topics', description: `${topics.length} topics tracked`, icon: Target }
    ]
    
    if (enhancedStats.totalQuizzes > 0) {
      achievements.push({
        title: 'Quiz Performance', 
        description: `${enhancedStats.totalQuizzes} quizzes, ${enhancedStats.avgScore}% avg`, 
        icon: BookOpen 
      })
    }
    
    return achievements
  },[enhancedStats, topics])

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <DashboardErrorBoundary>
      <MainLayout>
        <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome back!</h1>
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
                  <p className="text-sm text-muted-foreground">Sessions Completed</p>
                  <p className="text-3xl font-bold">{enhancedStats.sessionsCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              {plan && (
                <div className="mt-4 space-y-1">
                  <Progress value={percentComplete} className="h-2" />
                  <p className="text-xs text-muted-foreground">{percentComplete}% complete</p>
                </div>) }
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Study Time</p>
                  <p className="text-3xl font-bold">{enhancedStats.totalStudyTime}<span className="text-lg font-normal">min</span></p>
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
                  <p className="text-3xl font-bold">{enhancedStats.streakDays}<span className="text-lg font-normal">days</span></p>
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
                  <p className="text-sm text-muted-foreground">Topics Tracked</p>
                  <p className="text-3xl font-bold">{topics.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quizzes Taken</p>
                  <p className="text-3xl font-bold">{enhancedStats.totalQuizzes > 0 ? enhancedStats.totalQuizzes : '—'}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              {enhancedStats.totalQuizzes > 0 ? (
                enhancedStats.avgScore > 0 && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    Avg Score: {enhancedStats.avgScore}%
                  </div>
                )
              ) : (
                <div className="mt-4 text-xs text-muted-foreground">No quizzes taken yet</div>
              )}
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
                      3-Day Study Plan
                    </CardTitle>
                    <CardDescription>
                      Today and the next two days at a glance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {next3Days.days.map((d) => {
                    const dateObj = new Date(d)
                    const today = new Date(); today.setHours(0,0,0,0)
                    const diff = Math.round((dateObj.getTime()-today.getTime())/(1000*60*60*24))
                    const label = diff===0 ? 'Today' : diff===1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US',{ weekday:'short' })
                    const items = next3Days.sessionsByDate[d] || []
                    return (
                      <div key={d} className="border rounded-lg p-3 bg-muted/30">
                        <div className="font-semibold text-sm mb-2 flex items-center justify-between">
                          <span>{label}</span>
                          <Badge variant="outline">{items.length} task{items.length!==1?'s':''}</Badge>
                        </div>
                        <div className="space-y-2">
                          {items.length ? items.slice(0,4).map((s:any, idx:number) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-background border">
                              <span className="truncate mr-2" title={s.topic}>{s.topic.split(':')[0]}</span>
                              <span className="text-muted-foreground">{s.duration_min}m</span>
                            </div>
                          )) : (
                            <div className="text-xs text-muted-foreground p-2">No sessions</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Today's Study Plan */}
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
                {todaysTasks.length > 0 ? (
                  todaysTasks.map((task: any) => (
                    <div key={task.id} className="bg-muted/50 p-4 sm:p-5 rounded-lg">
                      <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold truncate" title={task.subject}>{task.subject}</h4>
                          <p className="text-sm text-muted-foreground truncate" title={task.topic}>{task.topic}</p>
                        </div>
                        <div className="w-full md:w-auto md:flex-shrink-0">
                          <MinimalTimer
                            className="w-full max-w-[280px]"
                            duration={task.duration}
                            status={task.status}
                            noAutoStart={true}
                            onStatusChange={(newStatus) => updateSessionStatus(task.date, task.topic, newStatus)}
                            onComplete={(actualTime) => markSessionComplete(task.date, task.topic, actualTime)}
                            externalProgress={task.progress}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tasks scheduled for today.</p>
                  </div>
                )}
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
{loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : studyChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={studyChartData}>
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
                  ) : (
                    <div className="flex flex-col justify-end h-full">
                      <div className="flex items-end gap-1 h-40 px-2">
                        {fallbackStudy7.items.map(item => (
                          <div key={item.date} className="flex-1 bg-primary/20 rounded" style={{ height: `${Math.max(4, (item.minutes / fallbackStudy7.max) * 100)}%` }} title={`${item.date}: ${item.minutes}m`} />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-2">{fallbackStudy7.total} minutes over last 7 days</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Weekly Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>Study time and completion over the last 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 160 }}>
{loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : weeklyChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyChartData}>
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="study_time" stroke="#8884d8" fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-end gap-1 h-full px-2">
                      {fallbackStudy7.items.map(item => (
                        <div key={item.date} className="flex-1 bg-blue-300/40 dark:bg-blue-400/30 rounded" style={{ height: `${Math.max(6, (item.minutes / fallbackStudy7.max) * 100)}%` }} title={`${item.date}: ${item.minutes}m`} />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topic Mastery */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Completion rates by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 200 }}>
{loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : data?.subject_performance?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(data?.subject_performance || []).map((s: any) => ({
                        subject: s.subject,
                        completion: Number(s.completion || 0)
                      }))}>
                        <XAxis dataKey="subject" hide={false} interval={0} angle={-30} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="completion" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="space-y-3">
                      {subjectFallback.map(([subject, minutes]) => (
                        <div key={subject} className="flex items-center gap-2">
                          <div className="w-24 text-xs text-muted-foreground truncate">{subject}</div>
                          <div className="flex-1 h-2 bg-muted rounded">
                            <div className="h-2 bg-emerald-500 rounded" style={{ width: `${Math.min(100, (Number(minutes) / Math.max(1, Number(subjectFallback[0]?.[1] || 1))) * 100)}%` }} />
                          </div>
                          <div className="w-10 text-right text-xs text-muted-foreground">{minutes}m</div>
                        </div>
                      ))}
                      {subjectFallback.length === 0 && (
                        <div className="text-xs text-muted-foreground">No subject data yet.</div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                <Link href="/quiz">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Take a Quiz
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

            {/* Content Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Resources</CardTitle>
                <CardDescription>Based on your current plan</CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedRecommendationsPanel topics={planTopicsForRecs.slice(0,6)} maxItems={6} compact={true} />
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
                <CardDescription>{upcomingSessions.length ? 'Your next scheduled sessions' : 'No future sessions yet'}</CardDescription>
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
              {upcomingSessions.map((s:any, idx:number)=> {
                const dateObj = new Date(s.date)
                const today = new Date(); today.setHours(0,0,0,0)
                let label = dateObj.toLocaleDateString('en-US',{ month:'short', day:'numeric'})
                const diff = (dateObj.getTime()-today.getTime())/(1000*60*60*24)
                if(diff===0) label = 'Today'
                else if (diff===1) label = 'Tomorrow'
                return (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-muted/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold truncate max-w-[160px]" title={s.topic}>{s.topic.split(':')[0]}</h4>
                      <Badge variant="outline">{s.duration_min} min</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{s.focus}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{label}</span>
                      <span>{dateObj.toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
              {!upcomingSessions.length && !loading && (
                <div className="col-span-full text-sm text-muted-foreground">Generate a plan to see upcoming sessions.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle>Study Progress</CardTitle>
            <CardDescription>Quizzes and topic mastery</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading progress data...</div>
            ) : !progress || Object.keys(progress).length === 0 ? (
              <div className="p-6">
                <NoDataPlaceholder message="You haven't taken any quizzes or logged progress. Take a quiz to start tracking mastery." />
                <div className="mt-4">
                  <Link href="/quiz"><Button>Take Your First Quiz</Button></Link>
                </div>
              </div>
            ) : (
                <div className="max-w-xl mx-auto">
                <table className="w-full border border-border">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-2 text-sm text-muted-foreground">Topic</th>
                      <th className="p-2 text-sm text-muted-foreground">Quizzes Taken</th>
                      <th className="p-2 text-sm text-muted-foreground">Correct</th>
                      <th className="p-2 text-sm text-muted-foreground">Wrong</th>
                      <th className="p-2 text-sm text-muted-foreground">Last Score</th>
                      <th className="p-2 text-sm text-muted-foreground">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(progress).map(([topic, stats]: any) => (
                      <tr key={topic} className="odd:bg-white even:bg-muted/5 dark:odd:bg-transparent dark:even:bg-muted/10">
                        <td className="p-2 font-semibold text-foreground dark:text-foreground">{topic}</td>
                        <td className="p-2 text-sm text-muted-foreground">{stats.quizzes_taken}</td>
                        <td className="p-2 text-sm text-muted-foreground">{stats.correct}</td>
                        <td className="p-2 text-sm text-muted-foreground">{stats.wrong}</td>
                        <td className="p-2 text-sm text-muted-foreground">{(stats.last_score * 100).toFixed(0)}%</td>
<td className="p-2 text-sm text-muted-foreground">{stats.last_updated ? new Date(stats.last_updated).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </MainLayout>
    </DashboardErrorBoundary>
  );
}

