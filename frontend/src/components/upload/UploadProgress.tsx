'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, FileText, Brain, Calendar, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UploadProgressProps {
  uploadId: string;
  onComplete?: (result: any) => void;
  className?: string;
}

interface UploadStatus {
  upload_id: string;
  status: 'initializing' | 'extracting' | 'filtering' | 'generating_plan' | 'completed' | 'failed';
  progress: number;
  result?: {
    topics: any[];
    plan: any;
    extraction_stats?: {
      extraction_time: number;
      chunks_processed: number;
      total_topics_found: number;
      final_topics: number;
    };
  };
  error?: string;
  message?: string;
}

export function UploadProgress({ uploadId, onComplete, className }: UploadProgressProps) {
  const [status, setStatus] = useState<UploadStatus>({
    upload_id: uploadId,
    status: 'initializing',
    progress: 0
  });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/status/${uploadId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: UploadStatus = await response.json();
        setStatus(data);
        
        // Update progress based on status
        const progressMap = {
          'initializing': 10,
          'extracting': 30,
          'filtering': 50,
          'generating_plan': 80,
          'completed': 100,
          'failed': 0
        };
        
        const newProgress = progressMap[data.status] || 0;
        setStatus(prev => ({ ...prev, progress: newProgress }));
        
        if (data.status === 'completed') {
          clearInterval(interval);
          clearInterval(timeInterval);
          
          // Show success notification
          toast.success('Syllabus processed successfully!', {
            description: `Found ${data.result?.topics?.length || 0} topics and generated study plan`,
            duration: 5000
          });
          
          // Call completion callback
          if (onComplete && data.result) {
            onComplete(data.result);
          }
          
          // Auto-redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          
        } else if (data.status === 'failed') {
          clearInterval(interval);
          clearInterval(timeInterval);
          
          toast.error('Processing failed', {
            description: data.error || 'An unexpected error occurred',
            duration: 10000
          });
        }
      } catch (error) {
        console.error('Status check failed:', error);
        // Continue checking - might be a temporary network issue
      }
    };

    // Start status checking
    checkStatus(); // Initial check
    interval = setInterval(checkStatus, 2000); // Check every 2 seconds
    
    // Start time tracking
    timeInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [uploadId, onComplete, router]);

  const getStatusIcon = (currentStatus: string) => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusMessage = (currentStatus: string) => {
    switch (currentStatus) {
      case 'initializing':
        return 'Preparing your syllabus for processing...';
      case 'extracting':
        return 'Extracting topics and concepts using AI...';
      case 'filtering':
        return 'Filtering and validating educational content...';
      case 'generating_plan':
        return 'Creating your personalized study plan...';
      case 'completed':
        return 'Processing complete! Redirecting to dashboard...';
      case 'failed':
        return 'Processing failed. Please try again.';
      default:
        return 'Processing your syllabus...';
    }
  };

  const getStatusBadge = (currentStatus: string) => {
    switch (currentStatus) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✅ Complete</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">❌ Failed</Badge>;
      case 'generating_plan':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">🧠 AI Planning</Badge>;
      case 'filtering':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">✨ Filtering</Badge>;
      case 'extracting':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">🔍 Extracting</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">⏳ Processing</Badge>;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`upload-progress ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(status.status)}
            Processing Your Syllabus
          </CardTitle>
          {getStatusBadge(status.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{getStatusMessage(status.status)}</span>
            <span>{status.progress}%</span>
          </div>
          <Progress 
            value={status.progress} 
            className="h-3 transition-all duration-500 ease-out"
          />
        </div>

        {/* Processing Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`text-center p-3 rounded-lg transition-all ${
            status.progress >= 10 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <FileText className={`w-6 h-6 mx-auto mb-2 ${
              status.progress >= 10 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">Upload</div>
            {status.progress >= 10 && <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />}
          </div>

          <div className={`text-center p-3 rounded-lg transition-all ${
            status.progress >= 30 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <Brain className={`w-6 h-6 mx-auto mb-2 ${
              status.progress >= 30 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">Extract</div>
            {status.progress >= 30 && <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />}
          </div>

          <div className={`text-center p-3 rounded-lg transition-all ${
            status.progress >= 50 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <Sparkles className={`w-6 h-6 mx-auto mb-2 ${
              status.progress >= 50 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">Filter</div>
            {status.progress >= 50 && <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />}
          </div>

          <div className={`text-center p-3 rounded-lg transition-all ${
            status.progress >= 100 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <Calendar className={`w-6 h-6 mx-auto mb-2 ${
              status.progress >= 100 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <div className="text-sm font-medium">Plan</div>
            {status.progress >= 100 && <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />}
          </div>
        </div>

        {/* Processing Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatTime(timeElapsed)}</div>
            <div className="text-xs text-muted-foreground">Time Elapsed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {status.result?.topics?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Topics Found</div>
          </div>
        </div>

        {/* Extraction Stats (when available) */}
        {status.result?.extraction_stats && (
          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-200">
              Processing Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Chunks Processed: {status.result.extraction_stats.chunks_processed}</div>
              <div>Processing Time: {status.result.extraction_stats.extraction_time}s</div>
              <div>Raw Topics: {status.result.extraction_stats.total_topics_found}</div>
              <div>Final Topics: {status.result.extraction_stats.final_topics}</div>
            </div>
          </div>
        )}

        {/* Results Preview */}
        {status.result && status.status === 'completed' && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Processing Complete!
            </h4>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Successfully extracted {status.result.topics.length} topics and generated your personalized study plan.
              </p>
              
              {status.result.topics.slice(0, 5).map((topic: any, index: number) => (
                <Badge key={index} variant="outline" className="mr-1 mb-1 text-xs">
                  {typeof topic === 'string' ? topic : topic.name || topic.topic}
                </Badge>
              ))}
              
              {status.result.topics.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{status.result.topics.length - 5} more
                </Badge>
              )}
            </div>

            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Go to Dashboard →
            </Button>
          </div>
        )}

        {/* Error State */}
        {status.status === 'failed' && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-sm text-red-800 dark:text-red-200">
                  Processing Failed
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                {status.error || 'An unexpected error occurred while processing your syllabus.'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push('/upload')}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {status.status !== 'completed' && status.status !== 'failed' && (
          <div className="text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
            <p className="mt-2">Please keep this page open while we process your syllabus</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
