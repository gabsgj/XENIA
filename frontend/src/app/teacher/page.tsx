'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useErrorContext } from '@/lib/error-context'
import { 
  Users, 
  AlertTriangle, 
  Search,
  Plus,
  Clock,
  Target,
  Award
} from 'lucide-react'

export default function TeacherPage(){
  const [topic, setTopic] = useState('')
  const [tag, setTag] = useState('')
  const [status, setStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { pushError } = useErrorContext()
  
  async function tagIt(){
    try {
      await api('/api/teacher/tag',{ 
        method:'POST', 
        body: JSON.stringify({ user_id:'demo-user', teacher_id:'demo-teacher', topic, tag }) 
      })
      setStatus('Topic tagged successfully!')
      setTopic('')
      setTag('')
    } catch(e:any){ 
      pushError({ 
        errorCode:e?.errorCode||'HTTP_500', 
        errorMessage:e?.errorMessage, 
        details:e
      }) 
    }
  }

  const students = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      grade: "A-",
      completionRate: 85,
      weakTopics: ["Organic Chemistry", "Molecular Structures"],
      totalStudyTime: 245
    },
    {
      id: 2,
      name: "Michael Chen", 
      email: "michael.c@email.com",
      grade: "B+",
      completionRate: 72,
      weakTopics: ["Calculus Integration"],
      totalStudyTime: 189
    }
  ]

  return (
    <MainLayout>
      <div className='p-6 space-y-8'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl md:text-4xl font-bold tracking-tight'>Teacher Dashboard</h1>
            <p className='text-muted-foreground'>Monitor student progress and provide targeted support</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold">24</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Grade</p>
                  <p className="text-3xl font-bold">B+</p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold">78%</p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Hours</p>
                  <p className="text-3xl font-bold">156h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>Monitor individual student progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {students.map((student) => (
                  <div key={student.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <Badge variant={student.grade.startsWith('A') ? 'success' : 'warning'}>
                        {student.grade}
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{student.completionRate}%</span>
                      </div>
                      <Progress value={student.completionRate} className="h-2" />
                    </div>
                    {student.weakTopics.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          Weak Topics:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {student.weakTopics.map((topic) => (
                            <Badge key={topic} variant="destructive" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Tag Topics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tag Weak Topics</CardTitle>
                <CardDescription>Help students by identifying areas that need attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input 
                    id="topic"
                    placeholder="e.g., Organic Chemistry"
                    value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag/Note</Label>
                  <Input 
                    id="tag"
                    placeholder="e.g., Needs more practice"
                    value={tag} 
                    onChange={e => setTag(e.target.value)} 
                  />
                </div>
                <Button onClick={tagIt} className="w-full">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Tag Topic
                </Button>
                {status && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">{status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                  <h4 className="font-semibold text-sm">Most Difficult Topic</h4>
                  <p className="text-xs text-muted-foreground">Organic Chemistry</p>
                  <p className="text-xs">8 students struggling</p>
                </div>
                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <h4 className="font-semibold text-sm">Best Performing</h4>
                  <p className="text-xs text-muted-foreground">Linear Algebra</p>
                  <p className="text-xs">92% average score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
