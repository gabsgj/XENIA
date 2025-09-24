'use client'

import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import {
  Users,
  AlertTriangle,
  Plus,
  Clock,
  Target,
  Award,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Activity,
  Download,
  Filter,
  Star,
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
        avatar: "/avatars/sarah.svg",
        grade: "A",
        gpa: 3.8,
        completionRate: 95,
        studyStreak: 18,
        totalStudyTime: 320,
        weakTopics: ["Organic Synthesis"],
        attendance: 98,
        participation: 92
      },
      {
        id: 2,
        name: "Marcus Rodriguez",
        email: "marcus.r@student.edu",
        avatar: "/avatars/ahmed.svg",
        grade: "B+",
        gpa: 3.5,
        completionRate: 87,
        studyStreak: 12,
        totalStudyTime: 285,
        weakTopics: ["Thermodynamics", "Kinetics"],
        attendance: 95,
        participation: 88
      },
      {
        id: 3,
        name: "Sophia Chen",
        email: "sophia.c@student.edu",
        avatar: "/avatars/yuki.svg",
        grade: "A-",
        gpa: 3.7,
        completionRate: 92,
        studyStreak: 22,
        totalStudyTime: 298,
        weakTopics: [],
        attendance: 100,
        participation: 98
      },
      {
        id: 4,
        name: "James Wilson",
        email: "james.w@student.edu",
        avatar: "/avatars/liam.svg",
        grade: "B",
        gpa: 3.2,
        completionRate: 78,
        studyStreak: 5,
        totalStudyTime: 245,
        weakTopics: ["Organic Chemistry", "Spectroscopy", "Electrochemistry"],
        attendance: 88,
        participation: 75
      },
      {
        id: 5,
        name: "Isabella Garcia",
        email: "isabella.g@student.edu",
        avatar: "/avatars/maria.svg",
        grade: "A",
        gpa: 3.9,
        completionRate: 98,
        studyStreak: 25,
        totalStudyTime: 345,
        weakTopics: [],
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

  const gradeColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

  return (
    <MainLayout>
      {/* Demo Mode Indicator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4">
        <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Demo Mode</span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">{classData.className}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <Users className="w-7 h-7 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">{classData.totalStudents}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Award className="w-7 h-7 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">{classData.averageGrade}</p>
              <p className="text-sm text-muted-foreground">Average Grade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Target className="w-7 h-7 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">{classData.averageCompletion}%</p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Clock className="w-7 h-7 text-muted-foreground mb-2" />
              <p className="text-3xl font-bold">{classData.totalStudyHours}h</p>
              <p className="text-sm text-muted-foreground">Total Study Hours</p>
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
                        <Line yAxisId="gpa" type="monotone" dataKey="avgGrade" stroke="hsl(var(--primary))" strokeWidth={2} name="Avg GPA" />
                        <Line yAxisId="completion" type="monotone" dataKey="completion" stroke="hsl(var(--secondary))" strokeWidth={2} name="Completion %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
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
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
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
                <h2 className="text-2xl font-bold">Student Roster</h2>
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

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-4 text-left font-semibold">Student</th>
                        <th className="p-4 text-center font-semibold">Grade</th>
                        <th className="p-4 text-center font-semibold">Completion</th>
                        <th className="p-4 text-center font-semibold">Streak</th>
                        <th className="p-4 text-center font-semibold">Attendance</th>
                        <th className="p-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classData.students.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={student.avatar} alt={student.name} />
                                <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={student.grade.startsWith('A') ? 'default' : 'secondary'}>{student.grade}</Badge>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={student.completionRate} className="w-24 h-2" />
                              <span className="text-sm text-muted-foreground">{student.completionRate}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-center font-medium">{student.studyStreak} days</td>
                          <td className="p-4 text-center font-medium">{student.attendance}%</td>
                          <td className="p-4 text-right">
                            <Button size="sm" variant="ghost">View Details</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study Time Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Study Time Distribution</CardTitle>
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
                  <CardTitle>Participation vs Performance</CardTitle>
                  <CardDescription>Correlation between class participation and grades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={classData.students.slice(0, 5)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <Radar name="Participation %" dataKey="participation" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Radar name="Completion %" dataKey="completionRate" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
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
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Common Weak Topics
                  </CardTitle>
                  <CardDescription>Topics that multiple students struggle with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classData.commonWeakTopics.map((topic) => (
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
                    <Star className="w-5 h-5 text-primary" />
                    Class Recommendations
                  </CardTitle>
                  <CardDescription>AI-powered suggestions for improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border-l-4 border-primary bg-primary/10">
                      <h4 className="font-semibold text-primary-foreground">Focus on Organic Chemistry</h4>
                      <p className="text-sm text-primary-foreground/80">
                        12 students need additional support. Consider review sessions and extra practice problems.
                      </p>
                    </div>
                    <div className="p-4 border-l-4 border-secondary-foreground bg-secondary">
                      <h4 className="font-semibold text-secondary-foreground">Encourage Peer Learning</h4>
                      <p className="text-sm text-secondary-foreground/80">
                        High-performing students could mentor others in Thermodynamics and Kinetics.
                      </p>
                    </div>
                    <div className="p-4 border-l-4 border-accent-foreground bg-accent">
                      <h4 className="font-semibold text-accent-foreground">Lab Safety Review</h4>
                      <p className="text-sm text-accent-foreground/80">
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
