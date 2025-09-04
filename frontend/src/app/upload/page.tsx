'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { API_BASE, api } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'

import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Calendar
} from 'lucide-react'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [topics,setTopics] = useState<string[]>([])
  const [resources,setResources] = useState<any[]>([])
  const [showGeneratePlan, setShowGeneratePlan] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  
  // New state for enhanced planning
  const [deadline, setDeadline] = useState<string>('')
  const [hoursPerDay, setHoursPerDay] = useState<number>(2.0)
  const [learningStyle, setLearningStyle] = useState<string>('balanced')
  const [showPlanSettings, setShowPlanSettings] = useState(false)
  
  const { pushError } = useErrorContext()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return
    
    setUploading(true)
    setUploadProgress(0)
    
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const form = new FormData()
        form.append('file', f)
        const route = f.type.startsWith('image/') ? 'assessment' : 'syllabus'
        // Attach auth header if available (ensures persistence of topics -> plan regeneration)
        const headers: Record<string,string> = {}
        try {
          await (await import('@/lib/api')).api<{__noop?:boolean}>('/health',{method:'GET'}).catch(()=>null)
        } catch {}
        const storedUser = typeof window!=='undefined'? localStorage.getItem('supabase_user_id'): null
        if(storedUser) headers['X-User-Id'] = storedUser
        const res = await fetch(`${API_BASE}/api/upload/${route}`, { method: 'POST', body: form, headers })
        const j = await res.json().catch(()=> null)
        if(!res.ok){
          throw {
            errorCode: j?.errorCode || 'SYLLABUS_INVALID_FORMAT',
            errorMessage: j?.errorMessage || 'Upload failed',
            details: j
          }
        }
        setUploadProgress(Math.round(((i+1)/files.length)*100))
        // capture topics from response if available
        const foundTopics = j?.topics || j?.analysis?.topics?.map((t:any)=> t.topic) || []
        const analysisData = j?.analysis || null
        
        if(foundTopics.length){
          setTopics(prev=> Array.from(new Set([...prev, ...foundTopics])))
          setAnalysis(analysisData)
          setShowGeneratePlan(true) // Show generate plan button after successful upload
          
          // If backend returned a plan preview use it to update client plan immediately
          if(j?.plan_preview){
            try { localStorage.setItem('latest_plan', JSON.stringify(j.plan_preview)) } catch {}
          }
          // refresh resources after short delay
          setTimeout(async()=>{
            try {
              const r = await api('/api/resources/list')
              setResources(r.resources||[])
              // Refresh current plan to pick up regenerated one
              try { await api('/api/plan/current') } catch {}
            } catch {}
          }, 800)
        }
      }
      setFiles([])
    } catch (e:any) {
      pushError({
        errorCode: e?.errorCode || 'SYLLABUS_PARSE_FAIL',
        errorMessage: e?.errorMessage || 'Upload failed',
        details: e
      })
    } finally {
      setUploading(false)
    }
  }

  const generateStudyPlan = async () => {
    setGeneratingPlan(true)
    try {
      // Calculate deadline if provided
      const deadlineISO = deadline ? new Date(deadline).toISOString() : null
      
      const planData = await api('/api/plan/generate', {
        method: 'POST',
        body: JSON.stringify({
          horizon_days: deadline ? Math.max(3, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 14,
          preferred_hours_per_day: hoursPerDay,
          deadline: deadlineISO,
          learning_style: learningStyle
        })
      })
      
      // Store the generated plan
      localStorage.setItem('latest_plan', JSON.stringify(planData))
      
      // Show success message
      console.log('Enhanced study plan generated with resources!', planData)
      
      // Navigate to planner page to show the new plan
      window.location.href = '/planner'
      
    } catch (e: any) {
      pushError({
        errorCode: e?.errorCode || 'PLAN_GENERATION_FAIL',
        errorMessage: e?.errorMessage || 'Failed to generate enhanced study plan',
        details: e
      })
    } finally {
      setGeneratingPlan(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileText className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadedFiles = [
    {
      id: 1,
      name: "Chemistry Syllabus.pdf",
      type: "syllabus",
      uploadDate: "2024-01-10",
      size: "2.5 MB",
      status: "processed"
    },
    {
      id: 2,
      name: "Physics Test Results.jpg",
      type: "assessment",
      uploadDate: "2024-01-08",
      size: "1.2 MB", 
      status: "processed"
    },
    {
      id: 3,
      name: "Math Homework.pdf",
      type: "assignment",
      uploadDate: "2024-01-05",
      size: "800 KB",
      status: "processing"
    }
  ]

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Upload Materials</h1>
            <p className="text-muted-foreground">Upload your syllabus, assessments, and study materials for AI analysis</p>
          </div>
        </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Files</CardTitle>
                <CardDescription>
                  Drag and drop your files here, or click to browse. Supports PDF, images, and documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-lg font-medium">Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                      <p className="text-muted-foreground mb-4">or click to browse files</p>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  )}
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Selected Files ({files.length})</h4>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file)}
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    <Button onClick={uploadFiles} disabled={uploading} className="w-full">
                      {uploading ? 'Uploading...' : 'Upload Files'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>PDF documents up to 10MB</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Images (PNG, JPG, JPEG)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Word documents (.doc, .docx)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                    <span>Clear, readable text for best AI analysis</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Types */}
            <Card>
              <CardHeader>
                <CardTitle>What to Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Syllabi</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">Course outlines and curriculum</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">Assessments</h4>
                  <p className="text-xs text-green-800 dark:text-green-200">Test results and grades</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Study Materials</h4>
                  <p className="text-xs text-purple-800 dark:text-purple-200">Notes, textbooks, assignments</p>
                </div>
              </CardContent>
            </Card>
            {topics.length>0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Extracted Topics</span>
                    <div className="flex gap-2">
                      {showGeneratePlan && (
                        <>
                          <Button 
                            onClick={() => setShowPlanSettings(!showPlanSettings)} 
                            variant="outline"
                            size="sm"
                          >
                            Settings
                          </Button>
                          <Button 
                            onClick={generateStudyPlan} 
                            disabled={generatingPlan}
                            size="sm"
                            className="ml-2"
                          >
                            {generatingPlan ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4 mr-2" />
                                Generate Plan
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {topics.length} topics detected
                    {analysis?.difficulty && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {analysis.difficulty} difficulty
                      </Badge>
                    )}
                    {analysis?.estimated_total_hours && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        ~{analysis.estimated_total_hours}h total
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                
                {/* Plan Settings */}
                {showPlanSettings && (
                  <CardContent className="space-y-4 border-t bg-muted/30">
                    <h4 className="font-semibold text-sm">Study Plan Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Deadline (Optional)</label>
                        <input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-sm border rounded-md"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Hours per Day</label>
                        <select
                          value={hoursPerDay}
                          onChange={(e) => setHoursPerDay(Number(e.target.value))}
                          className="w-full mt-1 px-3 py-2 text-sm border rounded-md"
                        >
                          <option value={1}>1 hour</option>
                          <option value={1.5}>1.5 hours</option>
                          <option value={2}>2 hours</option>
                          <option value={2.5}>2.5 hours</option>
                          <option value={3}>3 hours</option>
                          <option value={4}>4 hours</option>
                          <option value={5}>5+ hours</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Learning Style</label>
                        <select
                          value={learningStyle}
                          onChange={(e) => setLearningStyle(e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-sm border rounded-md"
                        >
                          <option value="balanced">Balanced</option>
                          <option value="visual">Visual (Videos)</option>
                          <option value="reading">Reading (Articles)</option>
                          <option value="practical">Hands-on (Practice)</option>
                          <option value="auditory">Audio Learning</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {deadline && `Study will be planned for ${Math.max(3, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days until deadline.`}
                      {!deadline && `Study will be planned for 14 days (default).`}
                    </div>
                  </CardContent>
                )}
                
                <CardContent className='flex flex-wrap gap-2'>
                  {topics.map(t=> <Badge key={t} variant='outline'>{t}</Badge>)}
                </CardContent>
              </Card>
            )}
            
            {/* AI Filtering Insights */}
            {analysis?.filtering_insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🎯</span>
                    AI Topic Filtering Results
                  </CardTitle>
                  <CardDescription>
                    Gemini AI intelligently filtered and prioritized your syllabus topics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {analysis.filtering_insights.topics_kept}
                      </div>
                      <div className="text-xs text-muted-foreground">Topics Kept</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {analysis.filtering_insights.topics_removed}
                      </div>
                      <div className="text-xs text-muted-foreground">Topics Filtered</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(analysis.filtering_insights.time_estimate_total)}h
                      </div>
                      <div className="text-xs text-muted-foreground">Total Study Time</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded">
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {analysis.filtering_insights.difficulty_progression}
                      </div>
                      <div className="text-xs text-muted-foreground">Progression</div>
                    </div>
                  </div>
                  
                  {analysis.filtering_insights.removal_reasons?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Why topics were filtered:</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.filtering_insights.removal_reasons.map((reason: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Learning Strategy:</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.filtering_insights.learning_sequence_rationale}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Learning Path */}
            {analysis?.learning_path && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🗺️</span>
                    Recommended Learning Path
                  </CardTitle>
                  <CardDescription>
                    AI-generated learning sequence for optimal comprehension
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analysis.learning_path).map(([phase, phaseTopics]: [string, any], idx: number) => (
                    <div key={phase} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <h4 className="font-medium capitalize">
                          {phase.replace('_', ' ').replace('phase ', 'Phase ')}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phaseTopics.map((topic: string, topicIdx: number) => (
                          <Badge key={topicIdx} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
            {/* Next Steps */}
            {analysis?.next_steps && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🚀</span>
                    Next Steps & Recommendations
                  </CardTitle>
                  <CardDescription>
                    AI-powered action plan for your study journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.next_steps.immediate_actions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <span>⚡</span> Immediate Actions
                      </h4>
                      <ul className="space-y-1">
                        {analysis.next_steps.immediate_actions.map((action: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.next_steps.week_1_goals?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <span>🎯</span> Week 1 Goals
                      </h4>
                      <ul className="space-y-1">
                        {analysis.next_steps.week_1_goals.map((goal: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.next_steps.recommended_pace && (
                    <div className="bg-muted/50 p-3 rounded">
                      <h4 className="font-medium text-sm mb-1">📊 Recommended Pace</h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.next_steps.recommended_pace}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {resources.length>0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📚</span>
                    Study Resources
                  </CardTitle>
                  <CardDescription>
                    {resources.length} AI-curated learning materials including YouTube videos, articles, and practice resources
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3 max-h-[400px] overflow-auto pr-2'>
                  {resources.slice(0,40).map((r:any,i:number)=> (
                    <div key={i} className='p-3 rounded border hover:bg-muted/50 transition-all'>
                      <div className="flex items-start gap-3">
                        <span className="text-lg">
                          {r.source === 'youtube' ? '📺' : r.source === 'ocw' ? '🎓' : '📖'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {r.source?.toUpperCase() || 'RESOURCE'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {r.topic}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm mb-2 line-clamp-2">
                            {r.title || r.url}
                          </h4>
                          <a 
                            href={r.url} 
                            target='_blank' 
                            rel='noreferrer' 
                            className='text-blue-600 dark:text-blue-400 hover:underline text-xs'
                          >
                            View Resource →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {resources.length > 40 && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">
                        Showing 40 of {resources.length} resources
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Uploaded Files */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>Your previously uploaded materials and their processing status</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{file.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(file.uploadDate).toLocaleDateString()}</span>
                        <Badge variant={file.status === 'processed' ? 'success' : 'warning'}>
                          {file.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}