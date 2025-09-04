"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useErrorContext } from "@/lib/error-context";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { MainLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingButton, SkeletonCard } from "@/components/ui/loading";
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
  const [plan, setPlan] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { pushError } = useErrorContext();
  
  const fetchData = async () => {
    setLoading(true)
    try{ 
      const [analytics, currentPlan, topicResp, resResp] = await Promise.all([
        api('/api/analytics/student').catch(()=> null),
        api('/api/plan/current').catch(()=> null),
        api('/api/resources/topics').catch(()=> ({topics:[]})),
        api('/api/resources/list').catch(()=> ({resources:[]}))
      ])
      if(analytics) setData(analytics)
      if(currentPlan) setPlan(currentPlan)
      setTopics((topicResp as any)?.topics||[])
      setResources((resResp as any)?.resources||[])
    } catch(e:any){ 
      pushError({ errorCode: e?.errorCode||'CONTENT_API_FAIL', errorMessage: e?.errorMessage, details: e }) 
    } finally { setLoading(false) }
  }

  useEffect(()=>{ 
    fetchData() 
  },[pushError])

  // Add window focus listener to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      fetchData()
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        fetchData()
      }
    })
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  const markSessionComplete = async (date: string, topic: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      const resp = await api('/api/resources/progress', {
        method: 'POST',
        body: JSON.stringify({ sessions: [{ date, topic, status: newStatus }] })
      })
      if (resp.ok && resp.plan) {
        setPlan(resp.plan)
        // Refresh all data to update analytics
        setTimeout(fetchData, 500) // Small delay to ensure backend processing completes
      }
    } catch(e:any){
      pushError({ errorCode: e?.errorCode||'PLAN_PROGRESS_FAIL', errorMessage: e?.errorMessage, details: e })
    }
  }

  const todaysTasks = useMemo(()=>{
    if(!plan) return []
    const today = new Date().toISOString().slice(0,10)
    return (plan.sessions||[]).filter((s:any)=> s.date === today).map((s:any, idx:number)=> ({
      id: idx+1,
      subject: s.topic.split(':')[0] || s.topic,
      topic: s.topic,
      date: s.date,
      duration: s.duration_min || 45,
      progress: s.status==='completed'? 100 : s.status==='in-progress'? 50 : 0,
      status: s.status||'pending'
    }))
  },[plan])

  const upcomingSessions = useMemo(()=>{
    if(!plan) return []
    const todayStr = new Date().toISOString().slice(0,10)
    return (plan.sessions||[])
      .filter((s:any)=> s.date >= todayStr)
      .sort((a:any,b:any)=> a.date.localeCompare(b.date))
      .slice(0,9)
  },[plan])

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
    
    // Use plan data if available, fallback to analytics
    const sessionsCompleted = plan?.progress?.sessions_completed ?? completedPlanSessions.length
    
    // Calculate total study time from completed plan sessions + analytics sessions
    const planStudyTime = completedPlanSessions.reduce((total:number, session:any) => total + (session.duration_min || 0), 0)
    const analyticsStudyTime = analyticsSessions.reduce((total:number, session:any) => total + (session.duration_min || 0), 0)
    const totalStudyTime = Math.max(planStudyTime, analyticsStudyTime) // Use whichever is higher
    
    // Enhanced streak calculation
    const streakDays = data?.profile?.streak_days || (completedPlanSessions.length > 0 ? 1 : 0)
    
    return {
      sessionsCompleted,
      totalStudyTime,
      streakDays
    }
  }, [plan, data])

  const recentAchievements = useMemo(()=>{
    return [
      { title: 'Study Streak', description: `${enhancedStats.streakDays} days in a row`, icon: Award },
      { title: 'Completed Sessions', description: `${enhancedStats.sessionsCompleted} finished`, icon: TrendingUp },
      { title: 'Active Topics', description: `${topics.length} topics tracked`, icon: Target }
    ]
  },[enhancedStats, topics])

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
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
                  <p className="text-sm text-muted-foreground">Topic Status</p>
                  <p className="text-3xl font-bold">{topicStatusCounts.completed}/{topics.length}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-muted-foreground/60" /> Pending {topicStatusCounts['pending']}</div>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress {topicStatusCounts['in-progress']}</div>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-green-500" /> Completed {topicStatusCounts['completed']}</div>
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
                {todaysTasks.map((task: any) => (
                  <div key={task.id} className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{task.subject}</h4>
                        <p className="text-sm text-muted-foreground">{task.topic}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{task.duration} min</span>
                        {task.status === "completed" ? (
                          <Button size="sm" variant="outline" onClick={() => markSessionComplete(task.date, task.topic, task.status)}>
                            ✓ Done
                          </Button>
                        ) : task.status === "in-progress" ? (
                          <Button size="sm" onClick={() => markSessionComplete(task.date, task.topic, task.status)}>
                            <Play className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => markSessionComplete(task.date, task.topic, task.status)}>
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
                        data={Object.values((data?.sessions||[]).reduce((acc:any, s:any)=> { const k = s.topic||'General'; acc[k] = acc[k]||{ name:k, value:0, color: chartColors[Object.keys(acc).length % chartColors.length] }; acc[k].value += s.duration_min||0; return acc; }, {})) as any}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {(Object.values((data?.sessions||[]).reduce((acc:any, s:any)=> { const k = s.topic||'General'; acc[k] = acc[k]||{ name:k, value:0, color: chartColors[Object.keys(acc).length % chartColors.length] }; acc[k].value += s.duration_min||0; return acc; }, {})) as any).map((entry:any, index:number) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {(Object.values((data?.sessions||[]).reduce((acc:any, s:any)=> { const k = s.topic||'General'; acc[k] = acc[k]||{ name:k, value:0, color: chartColors[Object.keys(acc).length % chartColors.length] }; acc[k].value += s.duration_min||0; return acc; }, {})) as any).map((item:any) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{item.value}m</span>
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
      </div>
    </MainLayout>
  );
}

