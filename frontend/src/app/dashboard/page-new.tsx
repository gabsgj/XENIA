"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useErrorContext } from "@/lib/error-context";
import { MainLayout } from "@/components/navigation";
import { 
  StatsCard, 
  LevelProgressCard, 
  StreakCard, 
  QuickActionsCard, 
  InsightCard, 
  RecentActivityCard,
  AchievementCard 
} from "@/components/ui/dashboard-cards";
import { 
  WeeklyProgressChart, 
  SubjectPerformanceChart, 
  StudyTimeDistribution 
} from "@/components/ui/analytics-charts";
import { SkeletonCard } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Target, 
  BookOpen, 
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  Zap
} from "lucide-react";

interface DashboardData {
  profile: {
    xp: number;
    level: number;
    progress: number;
    to_next: number;
    total_next: number;
    streak_days: number;
  };
  stats: {
    total_sessions: number;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    total_study_hours: number;
    recent_study_hours: number;
    streak_days: number;
    avg_session_length: number;
  };
  insights: string[];
  achievements: any[];
  weekly_progress: any[];
  subject_performance: any[];
  sessions: any[];
  tasks: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushError } = useErrorContext();
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api('/api/analytics/student');
      setData(response);
    } catch (error: any) {
      pushError({ 
        errorCode: error?.errorCode || 'DASHBOARD_LOAD_FAILED', 
        errorMessage: error?.errorMessage || 'Failed to load dashboard data',
        details: error 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    router.push('/planner');
  };

  const handleViewPlan = () => {
    router.push('/planner');
  };

  const handleAskTutor = () => {
    router.push('/tutor');
  };

  const handleUploadFile = () => {
    router.push('/upload');
  };

  // Generate recent activity from sessions and tasks
  const generateRecentActivity = () => {
    if (!data) return [];
    
    const activities: any[] = [];
    
    // Add recent sessions
    data.sessions.slice(0, 3).forEach(session => {
      activities.push({
        type: 'session',
        title: `Study session: ${session.topic}`,
        time: new Date(session.created_at).toLocaleDateString(),
        duration: session.duration_min,
        status: session.status || 'completed'
      });
    });
    
    // Add recent tasks
    data.tasks.slice(0, 2).forEach(task => {
      activities.push({
        type: 'task',
        title: `Task: ${task.topic}`,
        time: new Date(task.created_at).toLocaleDateString(),
        status: task.status
      });
    });
    
    // Add achievements
    data.achievements.forEach(achievement => {
      activities.push({
        type: 'achievement',
        title: `Unlocked: ${achievement.title}`,
        time: new Date(achievement.unlocked_at).toLocaleDateString()
      });
    });
    
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  // Generate study time distribution data for pie chart
  const generateStudyTimeDistribution = () => {
    if (!data?.subject_performance) return [];
    
    return data.subject_performance.map(subject => ({
      subject: subject.subject,
      time: subject.sessions * subject.avg_time,
      sessions: subject.sessions
    })).filter(item => item.time > 0);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} className="h-[400px]" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Unable to load dashboard</h2>
            <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
            <button 
              onClick={loadDashboardData} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back! 👋
            </h1>
            <p className="text-muted-foreground">
              Ready to continue your learning journey? Let's see how you're doing.
            </p>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Sessions Completed"
            value={data.stats.total_sessions}
            subtitle={`${data.stats.avg_session_length} min average`}
            icon={<BookOpen className="w-8 h-8" />}
            trend={{
              value: 12,
              label: "this week",
              positive: true
            }}
          />
          
          <StatsCard
            title="Study Hours"
            value={`${data.stats.total_study_hours}h`}
            subtitle={`${data.stats.recent_study_hours}h this week`}
            icon={<Clock className="w-8 h-8" />}
            trend={{
              value: 8,
              label: "from last week",
              positive: true
            }}
          />
          
          <StatsCard
            title="Completion Rate"
            value={`${data.stats.completion_rate}%`}
            subtitle={`${data.stats.completed_tasks}/${data.stats.total_tasks} tasks`}
            icon={<Target className="w-8 h-8" />}
            trend={{
              value: 5,
              label: "improvement",
              positive: true
            }}
          />
          
          <StatsCard
            title="Current Level"
            value={data.profile.level}
            subtitle={`${data.profile.xp} total XP`}
            icon={<Award className="w-8 h-8" />}
            trend={{
              value: 15,
              label: "XP gained today",
              positive: true
            }}
          />
        </div>

        {/* Level Progress and Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LevelProgressCard
            level={data.profile.level}
            xp={data.profile.xp}
            progress={data.profile.progress}
            toNext={data.profile.to_next}
            totalNext={data.profile.total_next}
          />
          
          <StreakCard
            streakDays={data.profile.streak_days}
            longestStreak={30} // Could come from backend
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WeeklyProgressChart data={data.weekly_progress} />
              </div>
              <QuickActionsCard
                onNewSession={handleNewSession}
                onViewPlan={handleViewPlan}
                onAskTutor={handleAskTutor}
                onUploadFile={handleUploadFile}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubjectPerformanceChart data={data.subject_performance} />
              <StudyTimeDistribution data={generateStudyTimeDistribution()} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubjectPerformanceChart data={data.subject_performance} />
              <StudyTimeDistribution data={generateStudyTimeDistribution()} />
            </div>
            <WeeklyProgressChart data={data.weekly_progress} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivityCard activities={generateRecentActivity()} />
              </div>
              <AchievementCard achievements={data.achievements} />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InsightCard insights={data.insights} />
              </div>
              <QuickActionsCard
                onNewSession={handleNewSession}
                onViewPlan={handleViewPlan}
                onAskTutor={handleAskTutor}
                onUploadFile={handleUploadFile}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}