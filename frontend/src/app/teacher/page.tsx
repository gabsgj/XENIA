'use client'

import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import {
  Users,
  AlertTriangle,
  Search,
  Plus,
  Clock,
  Target,
  Award,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  Star,
  CheckCircle,
  XCircle,
  Calendar,
  UserCheck
} from 'lucide-react'

export default function TeacherPage() {
  // Mock data for demo
  const classData = {
    className: "Advanced Chemistry - Period 3",
    totalStudents: 28,
    averageGrade: "B+",
    averageCompletion: 82,
    totalStudyHours: 1247,
    classPerformance: [
      { month: 'Sep', avgGrade: 3.2, completion: 75 },
      { month: 'Oct', avgGrade: 3.3, completion: 78 },
      { month: 'Nov', avgGrade: 3.4, completion: 82 },
      { month: 'Dec', avgGrade: 3.5, completion: 85 },
      { month: 'Jan', avgGrade: 3.4, completion: 82 }
    ],
    subjectBreakdown: [
      { subject: 'Organic Chemistry', avgScore: 78, students: 28 },
      { subject: 'Physical Chemistry', avgScore: 82, students: 28 },
      { subject: 'Analytical Chemistry', avgScore: 85, students: 28 },
      { subject: 'Biochemistry', avgScore: 80, students: 28 }
    ],
    gradeDistribution: [
      { grade: 'A', count: 8, percentage: 29 },
      { grade: 'B', count: 12, percentage: 43 },
      { grade: 'C', count: 6, percentage: 21 },
      { grade: 'D', count: 2, percentage: 7 }
    ],
    students: [
      {
        id: 1,
        name: "Emma Thompson",
        email: "emma.t@student.edu",
        avatar: "/avatars/emma.jpg",
        grade: "A",
        gpa: 3.8,
        completionRate: 95,
        studyStreak: 18,
        totalStudyTime: 320,
        weakTopics: ["Organic Synthesis"],
        recentActivity: [
          { date: "2024-01-15", activity: "Lab Report Submission", score: 92 },
          { date: "2024-01-12", activity: "Quiz - Acid-Base Chemistry", score: 88 },
          { date: "2024-01-10", activity: "Homework - Molecular Structures", score: 95 }
        ],
        attendance: 98,
        participation: 92
      },
      {
        id: 2,
        name: "Marcus Rodriguez",
        email: "marcus.r@student.edu",
        avatar: "/avatars/marcus.jpg",
        grade: "B+",
        gpa: 3.5,
        completionRate: 87,
        studyStreak: 12,
        totalStudyTime: 285,
        weakTopics: ["Thermodynamics", "Kinetics"],
        recentActivity: [
          { date: "2024-01-14", activity: "Group Lab Project", score: 85 },
          { date: "2024-01-11", activity: "Mid-term Exam", score: 82 },
          { date: "2024-01-08", activity: "Problem Set - Equilibrium", score: 78 }
        ],
        attendance: 95,
        participation: 88
      },
      {
        id: 3,
        name: "Sophia Chen",
        email: "sophia.c@student.edu",
        avatar: "/avatars/sophia.jpg",
        grade: "A-",
        gpa: 3.7,
        completionRate: 92,
        studyStreak: 22,
        totalStudyTime: 298,
        weakTopics: [],
        recentActivity: [
          { date: "2024-01-15", activity: "Research Presentation", score: 96 },
          { date: "2024-01-13", activity: "Lab Practical", score: 94 },
          { date: "2024-01-09", activity: "Essay - Chemical Reactions", score: 91 }
        ],
        attendance: 100,
        participation: 98
      },
      {
        id: 4,
        name: "James Wilson",
        email: "james.w@student.edu",
        avatar: "/avatars/james.jpg",
        grade: "B",
        gpa: 3.2,
        completionRate: 78,
        studyStreak: 5,
        totalStudyTime: 245,
        weakTopics: ["Organic Chemistry", "Spectroscopy", "Electrochemistry"],
        recentActivity: [
          { date: "2024-01-13", activity: "Quiz - Organic Reactions", score: 72 },
          { date: "2024-01-10", activity: "Lab Safety Test", score: 85 },
          { date: "2024-01-07", activity: "Homework - pH Calculations", score: 68 }
        ],
        attendance: 88,
        participation: 75
      },
      {
        id: 5,
        name: "Isabella Garcia",
        email: "isabella.g@student.edu",
        avatar: "/avatars/isabella.jpg",
        grade: "A",
        gpa: 3.9,
        completionRate: 98,
        studyStreak: 25,
        totalStudyTime: 345,
        weakTopics: [],
        recentActivity: [
          { date: "2024-01-15", activity: "Final Project Proposal", score: 98 },
          { date: "2024-01-12", activity: "Advanced Lab Techniques", score: 96 },
          { date: "2024-01-09", activity: "Peer Review Assignment", score: 97 }
        ],
        attendance: 100,
        participation: 100
      }
    ],
    commonWeakTopics: [
      { topic: "Organic Chemistry", students: 12, severity: "high" },
      { topic: "Thermodynamics", students: 8, severity: "medium" },
      { topic: "Kinetics", students: 6, severity: "medium" },
      { topic: "Spectroscopy", students: 5, severity: "low" },
      { topic: "Electrochemistry", students: 4, severity: "low" }
    ],
    upcomingAssessments: [
      { name: "Organic Chemistry Final", date: "2024-01-28", type: "exam", students: 28 },
      { name: "Lab Practical - Titration", date: "2024-01-25", type: "lab", students: 28 },
      { name: "Research Paper Due", date: "2024-02-05", type: "assignment", students: 28 }
    ]
  }

  const subjectColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']
  const gradeColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

  return (
    <MainLayout>
      {/* Demo Mode Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1.5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Demo Mode</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">{classData.className} • Monitor student progress and provide targeted support</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Assessment
            </Button>
          </div>
        </div>

        {/* Class Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600">{classData.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Grade</p>
                  <p className="text-3xl font-bold text-green-600">{classData.averageGrade}</p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold text-orange-600">{classData.averageCompletion}%</p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Hours</p>
                  <p className="text-3xl font-bold text-purple-600">{classData.totalStudyHours}h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Performance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Class Performance Trend
                  </CardTitle>
                  <CardDescription>Average GPA and completion rates over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={classData.classPerformance}>
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="gpa" orientation="left" />
                        <YAxis yAxisId="completion" orientation="right" />
                        <Tooltip />
                        <Line yAxisId="gpa" type="monotone" dataKey="avgGrade" stroke="#8884d8" strokeWidth={2} name="Avg GPA" />
                        <Line yAxisId="completion" type="monotone" dataKey="completion" stroke="#82ca9d" strokeWidth={2} name="Completion %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Grade Distribution
                  </CardTitle>
                  <CardDescription>Current grade breakdown across all students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={classData.gradeDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                        >
                          {classData.gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={gradeColors[index % gradeColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Overview</CardTitle>
                <CardDescription>Average scores across different chemistry topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {classData.subjectBreakdown.map((subject, index) => (
                    <div key={subject.subject} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{subject.subject}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {subject.students} students
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">{subject.avgScore}%</div>
                      <Progress value={subject.avgScore} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Assessments
                </CardTitle>
                <CardDescription>Important dates and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classData.upcomingAssessments.map((assessment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{assessment.name}</p>
                          <p className="text-sm text-muted-foreground">{assessment.date} • {assessment.students} students</p>
                        </div>
                      </div>
                      <Badge variant={assessment.type === 'exam' ? 'destructive' : assessment.type === 'lab' ? 'default' : 'secondary'}>
                        {assessment.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Student Performance</h2>
                <p className="text-muted-foreground">Detailed view of individual student progress</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {classData.students.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback className="text-lg">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{student.name}</h3>
                            <p className="text-muted-foreground">{student.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={student.grade.startsWith('A') ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                              {student.grade}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">GPA: {student.gpa}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Target className="w-4 h-4 text-green-500" />
                              <span className="text-xl font-bold text-green-600">{student.completionRate}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Completion</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Award className="w-4 h-4 text-orange-500" />
                              <span className="text-xl font-bold text-orange-600">{student.studyStreak}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Day Streak</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="text-xl font-bold text-blue-600">{student.totalStudyTime}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Min/Week</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <UserCheck className="w-4 h-4 text-purple-500" />
                              <span className="text-xl font-bold text-purple-600">{student.attendance}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Attendance</p>
                          </div>
                        </div>

                        {student.weakTopics.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                              Areas Needing Attention:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {student.weakTopics.map(topic => (
                                <Badge key={topic} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study Time Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Weekly Study Time Distribution
                  </CardTitle>
                  <CardDescription>Average study hours per student</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classData.students.slice(0, 5)}>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalStudyTime" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Participation vs Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Participation vs Performance
                  </CardTitle>
                  <CardDescription>Correlation between class participation and grades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={classData.students.slice(0, 5)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="Participation %" dataKey="participation" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                        <Radar name="Completion %" dataKey="completionRate" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Management</CardTitle>
                <CardDescription>Create and manage assignments, quizzes, and exams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Assessment Tools</h3>
                  <p className="text-muted-foreground mb-4">Create quizzes, assignments, and track student submissions</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Common Weak Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Common Weak Topics
                  </CardTitle>
                  <CardDescription>Topics that multiple students struggle with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classData.commonWeakTopics.map((topic, index) => (
                      <div key={topic.topic} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            topic.severity === 'high' ? 'bg-red-500' :
                            topic.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{topic.topic}</p>
                            <p className="text-sm text-muted-foreground">{topic.students} students</p>
                          </div>
                        </div>
                        <Badge variant={
                          topic.severity === 'high' ? 'destructive' :
                          topic.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {topic.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Class Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Class Recommendations
                  </CardTitle>
                  <CardDescription>AI-powered suggestions for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Focus on Organic Chemistry</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        12 students need additional support. Consider review sessions and extra practice problems.
                      </p>
                    </div>
                    <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                      <h4 className="font-semibold text-green-900 dark:text-green-100">Encourage Peer Learning</h4>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        High-performing students could mentor others in Thermodynamics and Kinetics.
                      </p>
                    </div>
                    <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">Lab Safety Review</h4>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        Schedule a refresher session on lab procedures and safety protocols.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
