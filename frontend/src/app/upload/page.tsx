'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { MainLayout } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { API_BASE } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'

import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2
} from 'lucide-react'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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
        form.append('user_id', 'demo-user')
        const route = f.type.startsWith('image/') ? 'assessment' : 'syllabus'
        const res = await fetch(`${API_BASE}/api/upload/${route}`, { method: 'POST', body: form })
        const j = await res.json().catch(()=> null)
        if(!res.ok){
          throw {
            errorCode: j?.errorCode || 'SYLLABUS_INVALID_FORMAT',
            errorMessage: j?.errorMessage || 'Upload failed',
            details: j
          }
        }
        setUploadProgress(Math.round(((i+1)/files.length)*100))
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