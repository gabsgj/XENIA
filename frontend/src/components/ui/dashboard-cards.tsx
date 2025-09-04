"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Flame, 
  Clock, 
  Target, 
  BookOpen, 
  TrendingUp,
  Star,
  Award,
  CheckCircle,
  Play,
  ArrowRight,
  Zap,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-all", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                trend.positive ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className="w-3 h-3" />
                <span>{trend.positive ? "+" : ""}{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LevelProgressProps {
  level: number;
  xp: number;
  progress: number;
  toNext: number;
  totalNext: number;
}

export function LevelProgressCard({ level, xp, progress, toNext, totalNext }: LevelProgressProps) {
  const progressPercentage = (progress / totalNext) * 100;
  
  return (
    <Card className="hover:shadow-md transition-all bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold">Level {level}</h3>
              <Badge variant="secondary">{xp} XP</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {level + 1}</span>
                <span>{progress}/{totalNext} XP</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {toNext} XP needed for next level
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StreakCardProps {
  streakDays: number;
  longestStreak?: number;
}

export function StreakCard({ streakDays, longestStreak }: StreakCardProps) {
  const getStreakColor = (days: number) => {
    if (days >= 30) return "text-orange-500";
    if (days >= 14) return "text-red-500";
    if (days >= 7) return "text-yellow-500";
    return "text-blue-500";
  };

  const getStreakBadge = (days: number) => {
    if (days >= 30) return "🔥 Fire Streak!";
    if (days >= 14) return "⚡ Power Streak!";
    if (days >= 7) return "✨ Hot Streak!";
    if (days >= 3) return "🌟 Building Momentum";
    return "💪 Getting Started";
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Study Streak</p>
            <div className="flex items-center gap-2 mt-1">
              <Flame className={cn("w-8 h-8", getStreakColor(streakDays))} />
              <div>
                <p className="text-3xl font-bold">{streakDays}</p>
                <p className="text-xs text-muted-foreground">
                  {streakDays === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              {getStreakBadge(streakDays)}
            </Badge>
            {longestStreak && longestStreak > streakDays && (
              <p className="text-xs text-muted-foreground mt-1">
                Best: {longestStreak} days
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionsProps {
  onNewSession: () => void;
  onViewPlan: () => void;
  onAskTutor: () => void;
  onUploadFile: () => void;
}

export function QuickActionsCard({ onNewSession, onViewPlan, onAskTutor, onUploadFile }: QuickActionsProps) {
  const actions = [
    { icon: Play, label: "Start Session", action: onNewSession, color: "bg-green-500" },
    { icon: Calendar, label: "View Plan", action: onViewPlan, color: "bg-blue-500" },
    { icon: BookOpen, label: "Ask AI Tutor", action: onAskTutor, color: "bg-purple-500" },
    { icon: Target, label: "Upload File", action: onUploadFile, color: "bg-orange-500" },
  ];

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={action.action}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", action.color)}>
              <action.icon className="w-4 h-4" />
            </div>
            <span>{action.label}</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

interface InsightCardProps {
  insights: string[];
}

export function InsightCard({ insights }: InsightCardProps) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Complete more study sessions to get personalized insights!
          </p>
        ) : (
          insights.map((insight, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{insight}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface RecentActivityProps {
  activities: Array<{
    type: string;
    title: string;
    time: string;
    duration?: number;
    status?: string;
  }>;
}

export function RecentActivityCard({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "session": return <Play className="w-4 h-4 text-green-500" />;
      case "task": return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "achievement": return <Award className="w-4 h-4 text-yellow-500" />;
      default: return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Start studying to see your recent activity here!
          </p>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activity.time}</span>
                  {activity.duration && (
                    <>
                      <span>•</span>
                      <span>{activity.duration} min</span>
                    </>
                  )}
                  {activity.status && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {activities.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full">
            View All Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface AchievementCardProps {
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: string;
    unlocked_at: string;
  }>;
}

export function AchievementCard({ achievements }: AchievementCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case "epic": return "bg-gradient-to-r from-purple-400 to-pink-500";
      case "rare": return "bg-gradient-to-r from-blue-400 to-cyan-500";
      default: return "bg-gradient-to-r from-gray-400 to-gray-500";
    }
  };

  const getRarityIcon = (icon: string) => {
    switch (icon) {
      case "trophy": return <Trophy className="w-5 h-5" />;
      case "star": return <Star className="w-5 h-5" />;
      case "flame": return <Flame className="w-5 h-5" />;
      case "book": return <BookOpen className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Recent Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Keep studying to unlock achievements!
          </p>
        ) : (
          achievements.slice(0, 3).map((achievement, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", getRarityColor(achievement.rarity))}>
                {getRarityIcon(achievement.icon)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {achievement.rarity}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}