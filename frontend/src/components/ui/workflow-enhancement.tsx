"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, Upload, BookOpen, Calendar, BarChart3, Play, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  completed: boolean;
  enabled: boolean;
  progress?: number;
}

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const workflowSteps: WorkflowStep[] = [
    {
      id: "upload",
      title: "Upload Study Material",
      description: "Start by uploading your syllabus or study documents",
      icon: Upload,
      href: "/upload",
      completed: false,
      enabled: true,
      progress: 0
    },
    {
      id: "filter",
      title: "AI Topic Filtering",
      description: "Let AI analyze and organize your topics",
      icon: BookOpen,
      href: "/upload",
      completed: false,
      enabled: false,
      progress: 0
    },
    {
      id: "plan",
      title: "Generate Study Plan",
      description: "Create a personalized learning schedule",
      icon: Calendar,
      href: "/planner",
      completed: false,
      enabled: false,
      progress: 0
    },
    {
      id: "study",
      title: "Start Studying",
      description: "Begin your learning journey with AI assistance",
      icon: Play,
      href: "/dashboard",
      completed: false,
      enabled: false,
      progress: 0
    },
    {
      id: "track",
      title: "Track Progress",
      description: "Monitor your performance and achievements",
      icon: BarChart3,
      href: "/analytics",
      completed: false,
      enabled: false,
      progress: 0
    }
  ];

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      setLoading(true);
      const response = await api('/api/analytics/student');
      setUserProgress(response);
      
      // Update workflow steps based on user progress
      const hasUploaded = response.sessions?.length > 0 || response.tasks?.length > 0;
      const hasPlan = response.stats?.total_sessions > 0;
      const hasStartedStudying = response.stats?.completed_tasks > 0;
      
      // Update step completion and enablement
      // This would be more sophisticated in a real implementation
      setCurrentStep(hasUploaded ? (hasPlan ? (hasStartedStudying ? 4 : 3) : 2) : 1);
      
    } catch (error) {
      console.error('Failed to load user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: WorkflowStep, index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Your Learning Journey
        </CardTitle>
        <CardDescription>
          Follow these steps to get the most out of XENIA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round((currentStep / workflowSteps.length) * 100)}%</span>
            </div>
            <Progress value={(currentStep / workflowSteps.length) * 100} className="h-2" />
          </div>
          <Badge variant="outline" className="font-medium">
            Step {currentStep + 1} of {workflowSteps.length}
          </Badge>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const status = getStepStatus(step, index);
            const isClickable = status === 'current' || status === 'completed';
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-all",
                  status === 'completed' && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
                  status === 'current' && "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
                  status === 'pending' && "bg-muted/30 border-muted",
                  isClickable && "hover:shadow-md cursor-pointer"
                )}
                onClick={() => isClickable && window.location.href = step.href}
              >
                {/* Step Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  status === 'completed' && "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
                  status === 'current' && "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
                  status === 'pending' && "bg-muted text-muted-foreground"
                )}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h4 className={cn(
                    "font-semibold",
                    status === 'completed' && "text-green-800 dark:text-green-200",
                    status === 'current' && "text-blue-800 dark:text-blue-200",
                    status === 'pending' && "text-muted-foreground"
                  )}>
                    {step.title}
                  </h4>
                  <p className={cn(
                    "text-sm",
                    status === 'completed' && "text-green-600 dark:text-green-300",
                    status === 'current' && "text-blue-600 dark:text-blue-300",
                    status === 'pending' && "text-muted-foreground"
                  )}>
                    {step.description}
                  </p>
                  
                  {/* Progress for current step */}
                  {status === 'current' && step.progress !== undefined && (
                    <div className="mt-2">
                      <Progress value={step.progress} className="h-1" />
                    </div>
                  )}
                </div>

                {/* Step Action */}
                <div>
                  {status === 'completed' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Complete
                    </Badge>
                  )}
                  {status === 'current' && (
                    <Button size="sm">
                      Continue
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  {status === 'pending' && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        {currentStep < workflowSteps.length && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">Next Step</h4>
            <p className="text-sm text-primary/80 mb-3">
              {workflowSteps[currentStep].description}
            </p>
            <Button 
              onClick={() => window.location.href = workflowSteps[currentStep].href}
              className="w-full"
            >
              {workflowSteps[currentStep].title}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Completion Message */}
        {currentStep >= workflowSteps.length && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              🎉 Congratulations!
            </h4>
            <p className="text-sm text-green-600 dark:text-green-300 mb-3">
              You've completed the onboarding process. Keep studying to unlock achievements and level up!
            </p>
            <Button 
              onClick={() => window.location.href = "/dashboard"}
              variant="outline" 
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SmartRecommendationsProps {
  userProgress: any;
}

export function SmartRecommendations({ userProgress }: SmartRecommendationsProps) {
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (!userProgress) return recommendations;
    
    // Based on completion rate
    if (userProgress.stats?.completion_rate < 70) {
      recommendations.push({
        type: "improvement",
        title: "Boost Your Completion Rate",
        description: "Try breaking down tasks into smaller, manageable chunks",
        action: { label: "View Tasks", href: "/tasks" },
        priority: "high"
      });
    }
    
    // Based on study streak
    if (userProgress.stats?.streak_days < 3) {
      recommendations.push({
        type: "habit",
        title: "Build a Study Streak",
        description: "Consistent daily study sessions improve retention by 40%",
        action: { label: "Start Session", href: "/planner" },
        priority: "medium"
      });
    }
    
    // Based on subject performance
    if (userProgress.subject_performance?.some((s: any) => s.completion < 60)) {
      const weakSubjects = userProgress.subject_performance.filter((s: any) => s.completion < 60);
      recommendations.push({
        type: "focus",
        title: "Focus on Weak Subjects",
        description: `Consider extra practice in ${weakSubjects[0]?.subject}`,
        action: { label: "Get Help", href: "/tutor" },
        priority: "high"
      });
    }
    
    return recommendations;
  };

  const recommendations = generateRecommendations();

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Smart Recommendations
        </CardTitle>
        <CardDescription>
          Personalized suggestions based on your learning patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg border-l-4",
              rec.priority === "high" && "bg-red-50 border-red-500 dark:bg-red-900/20",
              rec.priority === "medium" && "bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20",
              rec.priority === "low" && "bg-blue-50 border-blue-500 dark:bg-blue-900/20"
            )}
          >
            <h4 className="font-semibold mb-1">{rec.title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
            <Button size="sm" onClick={() => window.location.href = rec.action.href}>
              {rec.action.label}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}