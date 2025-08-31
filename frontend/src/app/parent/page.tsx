'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import { 
  User, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download
} from 'lucide-react'

export default function ParentPage() {
  const childData = {
    name: "Sarah Johnson",
    grade: "10th Grade",
    currentGPA: 3.7,
    studyStreak: 12,
    totalStudyTime: 245,
    completionRate: 85,
    subjects: [
      { name: "Mathematics", grade: "A-", progress: 88, weakTopics: ["Calculus Integration"] },
      { name: "Chemistry", grade: "B+", progress: 75, weakTopics: ["Organic Chemistry", "Molecular Structures"] },
      { name: "Physics", grade: "A", progress: 92, weakTopics: [] },
      { name: "English", grade: "A-", progress: 89, weakTopics: ["Essay Writing"] }
    ],
    recentActivity: [
      { date: "2024-01-12", activity: "Completed Chemistry assignment", duration: 45 },
      { date: "2024-01-11", activity: "Physics study session", duration: 60 },
      { date: "2024-01-10", activity: "Math practice problems", duration: 30 }
    ],
    weeklyProgress: [
      { week: 'Week 1', studyTime: 180, completion: 85 },
      { week: 'Week 2', studyTime: 210, completion: 92 },
      { week: 'Week 3', studyTime: 165, completion: 78 },
      { week: 'Week 4', studyTime: 225, completion: 95 },
    ]
  }

  const teacherComments = [
    {
      teacher: "Ms. Anderson (Chemistry)",
      comment: "Sarah is showing great improvement in understanding chemical reactions. Recommend more practice with organic chemistry concepts.",
      date: "2024-01-10",
      priority: "medium"
    },
    {
      teacher: "Mr. Thompson (Math)",
      comment: "Excellent work on algebra and geometry. Sarah should focus on calculus integration for upcoming tests.",
      date: "2024-01-08", 
      priority: "high"
    }
  ]

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-muted-foreground">Monitor {childData.name}&apos;s learning progress and achievements</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Child Overview */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{childData.name}</h2>
                <p className="text-muted-foreground">{childData.grade} • Current GPA: {childData.currentGPA}</p>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">{childData.studyStreak} day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{childData.totalStudyTime} min this week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{childData.completionRate}% completion rate</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="feedback">Teacher Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Study Progress</CardTitle>
                  <CardDescription>Study time and completion rates over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={childData.weeklyProgress}>
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="studyTime" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Key metrics and achievements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{childData.currentGPA}</p>
                      <p className="text-sm text-muted-foreground">Current GPA</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{childData.studyStreak}</p>
                      <p className="text-sm text-muted-foreground">Day Streak</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                      <h4 className="font-semibold text-green-900 dark:text-green-100">Strengths</h4>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Consistent study habits and strong performance in Physics and Math
                      </p>
                    </div>
                    <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100">Areas for Growth</h4>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Chemistry concepts need more attention, especially organic chemistry
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {childData.subjects.map((subject) => (
                <Card key={subject.name} className="hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Badge variant={subject.grade.startsWith('A') ? 'success' : subject.grade.startsWith('B') ? 'warning' : 'secondary'}>
                        {subject.grade}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{subject.progress}%</span>
                        </div>
                        <Progress value={subject.progress} className="h-3" />
                      </div>

                      {subject.weakTopics.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            Needs Attention:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {subject.weakTopics.map((topic) => (
                              <Badge key={topic} variant="warning" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Performing well!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your child's recent study sessions and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {childData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{activity.activity}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(activity.date).toLocaleDateString()}</span>
                          <span>{activity.duration} minutes</span>
                        </div>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Feedback</CardTitle>
                <CardDescription>Comments and recommendations from teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherComments.map((comment, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{comment.teacher}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={comment.priority === 'high' ? 'destructive' : comment.priority === 'medium' ? 'warning' : 'secondary'}>
                            {comment.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}