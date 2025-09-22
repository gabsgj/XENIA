'use client'

import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import {
  User,
  Clock,
  Target,
  Award,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  TrendingUp,
  Star,
  MessageSquare,
  Activity,
  BarChart3
} from 'lucide-react'

export default function ParentPage() {
  // Mock data for demo
  const childData = {
    name: "Emma Thompson",
    grade: "11th Grade",
    avatar: "/avatars/emma.jpg",
    currentGPA: 3.8,
    studyStreak: 15,
    totalStudyTime: 320,
    completionRate: 92,
    weeklyGoal: 300,
    achievements: 24,
    subjects: [
      {
        name: "Advanced Mathematics",
        grade: "A",
        progress: 95,
        weakTopics: [],
        teacher: "Dr. Smith",
        nextTest: "2024-01-25",
        assignments: 3,
        completedAssignments: 3
      },
      {
        name: "Chemistry",
        grade: "A-",
        progress: 87,
        weakTopics: ["Organic Synthesis"],
        teacher: "Ms. Johnson",
        nextTest: "2024-01-28",
        assignments: 4,
        completedAssignments: 3
      },
      {
        name: "Physics",
        grade: "B+",
        progress: 78,
        weakTopics: ["Quantum Mechanics", "Thermodynamics"],
        teacher: "Mr. Davis",
        nextTest: "2024-01-30",
        assignments: 2,
        completedAssignments: 1
      },
      {
        name: "English Literature",
        grade: "A",
        progress: 96,
        weakTopics: [],
        teacher: "Mrs. Wilson",
        nextTest: "2024-02-02",
        assignments: 5,
        completedAssignments: 5
      }
    ],
    recentActivity: [
      { date: "2024-01-15", activity: "Completed Physics Lab Report", duration: 90, subject: "Physics", grade: "A-" },
      { date: "2024-01-14", activity: "Math Problem Set", duration: 75, subject: "Mathematics", grade: "A" },
      { date: "2024-01-13", activity: "Chemistry Quiz Preparation", duration: 60, subject: "Chemistry", grade: "A-" },
      { date: "2024-01-12", activity: "English Essay Writing", duration: 120, subject: "English", grade: "A+" },
      { date: "2024-01-11", activity: "Physics Study Session", duration: 45, subject: "Physics", grade: "B+" }
    ],
    weeklyProgress: [
      { day: 'Mon', studyTime: 85, completion: 95 },
      { day: 'Tue', studyTime: 92, completion: 98 },
      { day: 'Wed', studyTime: 78, completion: 88 },
      { day: 'Thu', studyTime: 105, completion: 100 },
      { day: 'Fri', studyTime: 67, completion: 82 },
      { day: 'Sat', studyTime: 120, completion: 96 },
      { day: 'Sun', studyTime: 95, completion: 92 }
    ],
    monthlyTrends: [
      { month: 'Sep', gpa: 3.6, studyTime: 280 },
      { month: 'Oct', gpa: 3.7, studyTime: 310 },
      { month: 'Nov', gpa: 3.8, studyTime: 295 },
      { month: 'Dec', gpa: 3.8, studyTime: 320 }
    ],
    teacherMessages: [
      {
        teacher: "Dr. Smith (Mathematics)",
        message: "Emma has been excelling in calculus. Her problem-solving approach is impressive!",
        date: "2024-01-10",
        type: "positive"
      },
      {
        teacher: "Ms. Johnson (Chemistry)",
        message: "Emma needs to focus more on organic chemistry reactions. Extra practice recommended.",
        date: "2024-01-08",
        type: "concern"
      },
      {
        teacher: "Mr. Davis (Physics)",
        message: "Great improvement in lab work. Keep up the excellent experimental techniques!",
        date: "2024-01-05",
        type: "positive"
      }
    ]
  }

  const subjectColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

  return (
    <MainLayout>
      {/* Demo Mode Indicator */}
      <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <span className="font-semibold text-orange-800 dark:text-orange-200">Demo Mode</span>
          <span className="text-orange-700 dark:text-orange-300">This page is displaying mock data for demonstration purposes.</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-muted-foreground">Monitor {childData.name}&apos;s academic journey and achievements</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Teachers
            </Button>
          </div>
        </div>

        {/* Child Profile Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={childData.avatar} alt={childData.name} />
                <AvatarFallback className="text-2xl">{childData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold">{childData.name}</h2>
                  <Badge variant="secondary" className="text-sm">{childData.grade}</Badge>
                </div>
                <p className="text-muted-foreground text-lg mb-4">Current GPA: <span className="font-semibold text-green-600">{childData.currentGPA}</span></p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Award className="w-4 h-4 text-orange-500" />
                      <span className="text-2xl font-bold text-orange-600">{childData.studyStreak}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-2xl font-bold text-blue-600">{childData.totalStudyTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Min This Week</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-2xl font-bold text-green-600">{childData.completionRate}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Completion</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-purple-500" />
                      <span className="text-2xl font-bold text-purple-600">{childData.achievements}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Achievements</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Study Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Weekly Study Progress
                  </CardTitle>
                  <CardDescription>Daily study time and completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={childData.weeklyProgress}>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="studyTime" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* GPA Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Academic Performance Trend
                  </CardTitle>
                  <CardDescription>GPA and study time over the past months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={childData.monthlyTrends}>
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="gpa" orientation="left" />
                        <YAxis yAxisId="time" orientation="right" />
                        <Tooltip />
                        <Line yAxisId="gpa" type="monotone" dataKey="gpa" stroke="#8884d8" strokeWidth={2} />
                        <Line yAxisId="time" type="monotone" dataKey="studyTime" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Overview</CardTitle>
                <CardDescription>Current grades and progress across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {childData.subjects.map((subject, index) => (
                    <div key={subject.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{subject.name}</h4>
                        <Badge variant={subject.grade.startsWith('A') ? 'default' : subject.grade.startsWith('B') ? 'secondary' : 'destructive'}>
                          {subject.grade}
                        </Badge>
                      </div>
                      <Progress value={subject.progress} className="mb-2" />
                      <p className="text-sm text-muted-foreground">{subject.progress}% complete</p>
                      <p className="text-xs text-muted-foreground mt-1">Teacher: {subject.teacher}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {childData.subjects.map((subject, index) => (
                <Card key={subject.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subjectColors[index % subjectColors.length] }}></div>
                        {subject.name}
                      </CardTitle>
                      <Badge variant={subject.grade.startsWith('A') ? 'default' : 'secondary'}>
                        {subject.grade}
                      </Badge>
                    </div>
                    <CardDescription>Teacher: {subject.teacher}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>{subject.progress}%</span>
                      </div>
                      <Progress value={subject.progress} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Assignments</p>
                        <p className="font-semibold">{subject.completedAssignments}/{subject.assignments}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Test</p>
                        <p className="font-semibold">{subject.nextTest}</p>
                      </div>
                    </div>

                    {subject.weakTopics.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Areas for Improvement:</p>
                        <div className="flex flex-wrap gap-1">
                          {subject.weakTopics.map(topic => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Study Activity
                </CardTitle>
                <CardDescription>Latest assignments, quizzes, and study sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {childData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{activity.activity}</p>
                          <p className="text-sm text-muted-foreground">{activity.subject} • {activity.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.grade.startsWith('A') ? 'default' : 'secondary'}>
                          {activity.grade}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">{activity.duration} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Teacher Messages
                </CardTitle>
                <CardDescription>Feedback and updates from teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {childData.teacherMessages.map((msg, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{msg.teacher}</p>
                          <p className="text-sm text-muted-foreground">{msg.date}</p>
                        </div>
                        <Badge variant={msg.type === 'positive' ? 'default' : 'destructive'}>
                          {msg.type === 'positive' ? 'Positive' : 'Needs Attention'}
                        </Badge>
                      </div>
                      <p className="text-sm">{msg.message}</p>
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