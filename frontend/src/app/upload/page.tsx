'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingButton, LoadingOverlay, TopicsSkeleton, ProgressIndicator } from '@/components/ui/loading'
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
  Calendar,
  FileIcon,
  ImageIcon,
  Loader2
} from 'lucide-react'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [topics,setTopics] = useState<string[]>([])
  // Raw topic objects (rich metadata) preserved separately so display list can stay string-only
  const [topicDetails, setTopicDetails] = useState<any[]>([])
  const [resources,setResources] = useState<any[]>([])
  const [showGeneratePlan, setShowGeneratePlan] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [processingTopics, setProcessingTopics] = useState(false)
  
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
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setProcessingTopics(false)

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`file${index}`, file)
      })

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`${API_BASE}/api/ingest/upload-document`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      // Start processing topics
      setProcessingTopics(true)
      
      // Extract topics
      if (result.analysis) {
        setAnalysis(result.analysis)
        const rawTopicList = (
          result.analysis.prioritized_topics ||
          result.analysis.filtered_topics ||
          result.topics || []
        )

        // Preserve detailed structures
        setTopicDetails(rawTopicList)

        // Normalize for badge display
        const normalized = rawTopicList.map((t: any) => {
          if (t == null) return 'Untitled'
            // If already a string
          if (typeof t === 'string') return t.trim() || 'Untitled'
          // If object with a topic field
          if (typeof t === 'object') {
            const topicName = (t.topic || t.name || '').toString().trim()
            return topicName || 'Untitled'
          }
          return String(t)
        })
        setTopics(normalized)

  if (rawTopicList && rawTopicList.length > 0) setShowGeneratePlan(true)
      }
      
      setProcessingTopics(false)
      
      console.log('Upload successful:', result)
      
    } catch (error: any) {
      pushError({
        errorCode: 'UPLOAD_FAILED',
        errorMessage: 'Failed to upload files: ' + error.message,
        details: error
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const generateStudyPlan = async () => {
    if (topics.length === 0) return

    setGeneratingPlan(true)

    try {
      const deadlineISO = deadline ? new Date(deadline).toISOString() : null
      
      const planData = await api('/api/plan/generate', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'demo-user', // Add explicit user_id for deployment
          horizon_days: deadline ? Math.max(3, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 14,
          preferred_hours_per_day: hoursPerDay,
          deadline: deadlineISO,
          learning_style: learningStyle,
          topics: topics, // Pass extracted topics to study plan generation
          topic_details: topicDetails // Pass detailed topic metadata for enhanced planning
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
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />
    if (file.type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (file.type.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />
    return <FileIcon className="w-5 h-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadSteps = ['Select Files', 'Upload', 'AI Analysis', 'Generate Plan']
  const getCurrentStep = () => {
    if (generatingPlan) return 3
    if (processingTopics || uploading) return 2
    if (files.length > 0) return 1
    return 0
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator 
            steps={uploadSteps}
            currentStep={getCurrentStep()}
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Upload Materials</h1>
            <p className="text-muted-foreground">Upload your syllabus, assessments, and study materials for AI analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload syllabi, assessments, or study materials for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    {isDragActive ? (
                      <div>
                        <p className="text-lg font-medium">Drop files here...</p>
                        <p className="text-sm text-muted-foreground">Release to upload</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium">Drag & drop files here</p>
                        <p className="text-sm text-muted-foreground">or click to select files</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Support for PDF, images, text files (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">Selected Files ({files.length})</h4>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={uploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading files...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                    <LoadingButton
                      loading={uploading}
                      loadingText="Uploading..."
                      onClick={uploadFiles}
                      className="w-full sm:w-auto"
                      icon={Upload}
                    >
                      Upload Files
                    </LoadingButton>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topics Display */}
            {processingTopics ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing Topics with AI...
                  </CardTitle>
                  <CardDescription>
                    Our AI is analyzing your documents to extract relevant study topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopicsSkeleton />
                </CardContent>
              </Card>
            ) : topics.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>🎯 Extracted Topics</span>
                      <Badge variant="secondary" className="text-xs">
                        {topics.length} topics
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {showGeneratePlan && (
                        <>
                          <Button 
                            onClick={() => setShowPlanSettings(!showPlanSettings)} 
                            variant="outline"
                            size="sm"
                          >
                            Settings
                          </Button>
                          <LoadingButton
                            loading={generatingPlan}
                            loadingText="Generating Plan..."
                            onClick={generateStudyPlan}
                            size="sm"
                            icon={Calendar}
                          >
                            Generate Plan
                          </LoadingButton>
                        </>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    AI-analyzed topics from your uploaded documents
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {topics.map((label: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="justify-center text-center py-2 px-3 text-xs"
                        title={label}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* AI Filtering Insights */}
            {analysis?.filtering_insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🧠</span>
                    AI Filtering Insights
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
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {analysis.difficulty || 'Medium'}
                      </div>
                      <div className="text-xs text-muted-foreground">Difficulty</div>
                    </div>
                  </div>

                  {analysis.filtering_insights.recommended_approach && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">📚 Recommended Study Approach</h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.filtering_insights.recommended_approach}
                      </p>
                    </div>
                  )}

                  {analysis.filtering_insights.next_steps?.length > 0 && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">🎯 Next Steps</h4>
                      <ul className="space-y-1">
                        {analysis.filtering_insights.next_steps.map((step: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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

            {/* Recent Uploads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Your recently uploaded files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Chemistry Syllabus.pdf", type: "syllabus", date: "2024-01-10", status: "processed" },
                    { name: "Physics Test.jpg", type: "assessment", date: "2024-01-08", status: "processed" },
                    { name: "Math Notes.pdf", type: "notes", date: "2024-01-05", status: "processing" }
                  ].map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.date}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {file.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
