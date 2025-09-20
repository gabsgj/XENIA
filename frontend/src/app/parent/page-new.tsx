"use client";

import { useEffect, useState } from "react";
import { api, getUserId } from "@/lib/api";
import { useErrorContext } from "@/lib/error-context";
import { MainLayout } from "@/components/navigation";
import { 
  ChildOverviewCard,
  SubjectProgressCard,
  RecentActivityCard,
  InsightsCard,
  UpcomingAssessmentsCard,
  ParentActionsCard
} from "@/components/ui/parent-dashboard-cards";
import { WeeklyProgressChart } from "@/components/ui/analytics-charts";
import { SkeletonCard } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Calendar,
  Bell,
  TrendingUp,
  Star,
  Clock
} from "lucide-react";

interface ParentDashboardData {
  children: Array<{
    user_id: string;
    name: string;
    grade?: string;
    age?: number;
    current_gpa?: number;
    level: number;
    xp: number;
    streak_days: number;
    total_study_hours: number;
    recent_study_hours: number;
    completion_rate: number;
    sessions_completed: number;
    subjects: any[];
    weekly_progress: any[];
    recent_activity: any[];
    upcoming_assessments?: any[];
    teacher_feedback?: any[];
    achievements?: any[];
    learning_insights?: string[];
  }>;
  parent_insights: string[];
  recommendations: any[];
}

export default function ParentPage() {
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const { pushError } = useErrorContext();

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    setLoading(true);
    try {
      const parentId = getUserId();
      const response = await api(`/api/parent/overview?parent_id=${parentId}`);
      setData(response);
      if (response.children && response.children.length > 0) {
        setSelectedChild(response.children[0].user_id);
      }
    } catch (error: any) {
      pushError({ 
        errorCode: error?.errorCode || 'PARENT_LOAD_FAILED', 
        errorMessage: error?.errorMessage || 'Failed to load parent dashboard data',
        details: error 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = () => {
    // Implementation for scheduling teacher meeting
    alert('Teacher meeting scheduling feature would be implemented here');
  };

  const handleDownloadReport = () => {
    // Implementation for downloading detailed report
    alert('Report download feature would be implemented here');
  };

  const handleSetupAlerts = () => {
    // Implementation for setting up progress alerts
    alert('Alert setup feature would be implemented here');
  };

  const handleViewProgress = () => {
    // Implementation for viewing detailed analytics
    alert('Detailed analytics view would be implemented here');
  };

  const getSelectedChild = () => {
    if (!data?.children || !selectedChild) return null;
    return data.children.find(child => child.user_id === selectedChild);
  };

  const getOverallPerformance = () => {
    if (!data?.children || data.children.length === 0) return null;
    
    const totalChildren = data.children.length;
    const avgCompletion = data.children.reduce((sum, child) => sum + child.completion_rate, 0) / totalChildren;
    const totalStreakDays = data.children.reduce((sum, child) => sum + child.streak_days, 0);
    const avgStudyHours = data.children.reduce((sum, child) => sum + child.recent_study_hours, 0) / totalChildren;
    
    return {
      avgCompletion: Math.round(avgCompletion),
      totalStreakDays,
      avgStudyHours: Math.round(avgStudyHours * 10) / 10,
      totalChildren
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data || !data.children || data.children.length === 0) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Children Found</h2>
            <p className="text-muted-foreground mb-4">
              No children are linked to this parent account yet.
            </p>
            <Button onClick={loadParentData}>
              <Users className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const selectedChildData = getSelectedChild();
  const overallPerf = getOverallPerformance();

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Parent Dashboard 👨‍👩‍👧‍👦
            </h1>
            <p className="text-muted-foreground">
              Monitor your {data.children.length === 1 ? "child's" : "children's"} learning progress and achievements
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button onClick={handleScheduleMeeting}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Overall Family Performance Summary */}
        {overallPerf && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Children</p>
                  <p className="text-2xl font-bold text-blue-800">{overallPerf.totalChildren}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Avg Completion</p>
                  <p className="text-2xl font-bold text-green-800">{overallPerf.avgCompletion}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600">Total Streak Days</p>
                  <p className="text-2xl font-bold text-orange-800">{overallPerf.totalStreakDays}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Avg Weekly Hours</p>
                  <p className="text-2xl font-bold text-purple-800">{overallPerf.avgStudyHours}h</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Children Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Children Overview</h2>
          <div className="grid gap-6">
            {data.children.map((child) => (
              <ChildOverviewCard
                key={child.user_id}
                child={child}
                onViewDetails={() => setSelectedChild(child.user_id)}
                onDownloadReport={() => handleDownloadReport()}
              />
            ))}
          </div>
        </div>

        {/* Child Selection Tabs */}
        {data.children.length > 1 && (
          <Tabs value={selectedChild || ""} onValueChange={setSelectedChild} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              {data.children.map((child) => (
                <TabsTrigger key={child.user_id} value={child.user_id}>
                  {child.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Detailed Child Analytics */}
        {selectedChildData && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <WeeklyProgressChart data={selectedChildData.weekly_progress || []} />
                </div>
                <ParentActionsCard
                  onScheduleMeeting={handleScheduleMeeting}
                  onDownloadReport={handleDownloadReport}
                  onSetupAlerts={handleSetupAlerts}
                  onViewProgress={handleViewProgress}
                />
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-6">
              <SubjectProgressCard subjects={selectedChildData.subjects || []} />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivityCard activities={selectedChildData.recent_activity || []} />
                <UpcomingAssessmentsCard assessments={selectedChildData.upcoming_assessments || []} />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InsightsCard 
                    insights={[...data.parent_insights, ...(selectedChildData.learning_insights || [])]}
                    recommendations={data.recommendations || []}
                  />
                </div>
                <ParentActionsCard
                  onScheduleMeeting={handleScheduleMeeting}
                  onDownloadReport={handleDownloadReport}
                  onSetupAlerts={handleSetupAlerts}
                  onViewProgress={handleViewProgress}
                />
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Teacher Feedback</h3>
                {selectedChildData.teacher_feedback && selectedChildData.teacher_feedback.length > 0 ? (
                  <div className="space-y-4">
                    {selectedChildData.teacher_feedback.map((feedback: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{feedback.teacher}</h4>
                            <p className="text-sm text-muted-foreground">{feedback.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={feedback.priority === 'high' ? 'destructive' : 
                                      feedback.priority === 'medium' ? 'default' : 'secondary'}
                            >
                              {feedback.priority} priority
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(feedback.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm">{feedback.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No teacher feedback available yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Parent Insights Summary */}
        {data.parent_insights && data.parent_insights.length > 0 && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Key Insight:</strong> {data.parent_insights[0]}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </MainLayout>
  );
}