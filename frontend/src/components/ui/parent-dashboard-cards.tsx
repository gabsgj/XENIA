"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, Target, User, Award, TrendingUp, Download, Calendar, Bell, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChildOverviewCardProps {
  child: {
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
  };
  onViewDetails: () => void;
  onDownloadReport: () => void;
}

export function ChildOverviewCard({ child, onViewDetails, onDownloadReport }: ChildOverviewCardProps) {
  const getStreakColor = (days: number) => {
    if (days >= 14) return "text-orange-500";
    if (days >= 7) return "text-yellow-500";
    if (days >= 3) return "text-green-500";
    return "text-gray-500";
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 85) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="hover:shadow-lg transition-all bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{child.name}</h3>
                {child.grade && (
                  <p className="text-muted-foreground">
                    {child.grade} {child.age && `• Age ${child.age}`}
                  </p>
                )}
                {child.current_gpa && (
                  <p className="text-sm font-medium mt-1">
                    Current GPA: {child.current_gpa}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Level {child.level}</Badge>
                <Badge variant="outline">{child.xp} XP</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Award className={cn("w-4 h-4", getStreakColor(child.streak_days))} />
                  <span className="font-bold text-lg">{child.streak_days}</span>
                </div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-lg">{child.total_study_hours}h</span>
                </div>
                <p className="text-xs text-muted-foreground">Total Study</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className={cn("w-4 h-4", getCompletionColor(child.completion_rate))} />
                  <span className="font-bold text-lg">{child.completion_rate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-lg">{child.sessions_completed}</span>
                </div>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {child.recent_study_hours}h this week
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onDownloadReport}>
                  <Download className="w-3 h-3 mr-1" />
                  Report
                </Button>
                <Button size="sm" onClick={onViewDetails}>
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SubjectProgressCardProps {
  subjects: Array<{
    name: string;
    grade?: string;
    progress: number;
    study_time: number;
    completion_rate: number;
    weak_topics?: string[];
    recent_scores?: number[];
  }>;
}

export function SubjectProgressCard({ subjects }: SubjectProgressCardProps) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 85) return 'bg-green-500';
    if (progress >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Subject Performance
        </CardTitle>
        <CardDescription>Detailed breakdown by subject</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.map((subject, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{subject.name}</h4>
              <div className="flex items-center gap-2">
                {subject.grade && (
                  <Badge className={getGradeColor(subject.grade)}>
                    {subject.grade}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {subject.study_time}min study time
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{subject.progress}%</span>
              </div>
              <Progress 
                value={subject.progress} 
                className="h-2"
                indicatorClassName={getProgressColor(subject.progress)}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Completion Rate: {subject.completion_rate}%</span>
              {subject.recent_scores && subject.recent_scores.length > 0 && (
                <span>Recent Avg: {Math.round(subject.recent_scores.reduce((a, b) => a + b, 0) / subject.recent_scores.length)}</span>
              )}
            </div>
            
            {subject.weak_topics && subject.weak_topics.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-600 flex items-center gap-1 mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  Areas needing attention:
                </p>
                <div className="flex flex-wrap gap-1">
                  {subject.weak_topics.map((topic, idx) => (
                    <Badge key={idx} variant="destructive" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface RecentActivityCardProps {
  activities: Array<{
    date: string;
    activity: string;
    type: string;
    duration?: number;
    subject?: string;
    score?: number;
  }>;
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'study_session': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'assignment': return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'assessment': return <Target className="w-4 h-4 text-purple-500" />;
      case 'task_completion': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study_session': return 'Study';
      case 'assignment': return 'Assignment';
      case 'assessment': return 'Assessment';
      case 'task_completion': return 'Task';
      default: return 'Activity';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest study sessions and achievements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No recent activity to display
          </p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.activity}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(activity.date).toLocaleDateString()}</span>
                  {activity.subject && (
                    <>
                      <span>•</span>
                      <span>{activity.subject}</span>
                    </>
                  )}
                  {activity.duration && (
                    <>
                      <span>•</span>
                      <span>{activity.duration} min</span>
                    </>
                  )}
                  {activity.score && (
                    <>
                      <span>•</span>
                      <span className={activity.score >= 85 ? "text-green-600" : activity.score >= 70 ? "text-yellow-600" : "text-red-600"}>
                        {activity.score}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(activity.type)}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface InsightsCardProps {
  insights: string[];
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
}

export function InsightsCard({ insights, recommendations }: InsightsCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          AI Insights & Recommendations
        </CardTitle>
        <CardDescription>Personalized insights based on learning patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Insights Section */}
        <div>
          <h4 className="font-semibold mb-3">Key Insights</h4>
          <div className="space-y-2">
            {insights.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                More insights will appear as your child continues studying
              </p>
            ) : (
              insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        <div>
          <h4 className="font-semibold mb-3">Recommendations</h4>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No recommendations at this time
              </p>
            ) : (
              recommendations.map((rec, index) => (
                <div key={index} className={cn("p-3 border rounded-lg", getPriorityColor(rec.priority))}>
                  <div className="flex items-start gap-2">
                    {getPriorityIcon(rec.priority)}
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{rec.title}</h5>
                      <p className="text-xs mt-1">{rec.description}</p>
                      <Badge variant="outline" className="text-xs mt-2">
                        {rec.priority} priority
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface UpcomingAssessmentsCardProps {
  assessments: Array<{
    subject: string;
    title: string;
    date: string;
    type: string;
    preparation_status: string;
  }>;
}

export function UpcomingAssessmentsCard({ assessments }: UpcomingAssessmentsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'well_prepared': return 'bg-green-100 text-green-800';
      case 'on_track': return 'bg-blue-100 text-blue-800';
      case 'needs_work': return 'bg-yellow-100 text-yellow-800';
      case 'at_risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'well_prepared': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'on_track': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'needs_work': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'at_risk': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'well_prepared': return 'Well Prepared';
      case 'on_track': return 'On Track';
      case 'needs_work': return 'Needs Work';
      case 'at_risk': return 'At Risk';
      default: return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Assessments
        </CardTitle>
        <CardDescription>Tests and quizzes coming up</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {assessments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No upcoming assessments
          </p>
        ) : (
          assessments.map((assessment, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{assessment.title}</h4>
                  <p className="text-sm text-muted-foreground">{assessment.subject}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {assessment.type}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {new Date(assessment.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(assessment.preparation_status)}
                  <Badge className={getStatusColor(assessment.preparation_status)}>
                    {getStatusLabel(assessment.preparation_status)}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface ParentActionsCardProps {
  onScheduleMeeting: () => void;
  onDownloadReport: () => void;
  onSetupAlerts: () => void;
  onViewProgress: () => void;
}

export function ParentActionsCard({ 
  onScheduleMeeting, 
  onDownloadReport, 
  onSetupAlerts, 
  onViewProgress 
}: ParentActionsCardProps) {
  const actions = [
    { 
      icon: Calendar, 
      label: "Schedule Teacher Meeting", 
      action: onScheduleMeeting, 
      color: "bg-blue-500",
      description: "Set up a meeting with teachers"
    },
    { 
      icon: Download, 
      label: "Download Report", 
      action: onDownloadReport, 
      color: "bg-green-500",
      description: "Get detailed progress report"
    },
    { 
      icon: Bell, 
      label: "Setup Alerts", 
      action: onSetupAlerts, 
      color: "bg-orange-500",
      description: "Configure progress notifications"
    },
    { 
      icon: TrendingUp, 
      label: "View Analytics", 
      action: onViewProgress, 
      color: "bg-purple-500",
      description: "Detailed analytics dashboard"
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parent Actions</CardTitle>
        <CardDescription>Quick actions to support your child's learning</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start gap-3 h-auto p-4"
            onClick={action.action}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", action.color)}>
              <action.icon className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className="font-medium">{action.label}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}