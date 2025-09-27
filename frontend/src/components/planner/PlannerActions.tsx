'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api, getUserId } from '@/lib/api';
import { useErrorContext } from '@/lib/error-context';
import { RefreshCw, Settings, Calendar, Target, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface RegenerateOptions {
  keepProgress: boolean;
  adjustDifficulty: boolean;
  newDeadline: string;
  focusAreas: string[];
  studyIntensity: 'light' | 'moderate' | 'intensive';
  preferredHours: number;
  userFeedback: string;
}

interface PlannerActionsProps {
  currentPlan: any;
  onRegenerate: (newPlan: any) => void;
  className?: string;
}

export function PlannerActions({ currentPlan, onRegenerate, className }: PlannerActionsProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [learningPace, setLearningPace] = useState<'slow' | 'normal' | 'fast'>('normal');
  const { pushError } = useErrorContext();

  const [regenerateOptions, setRegenerateOptions] = useState<RegenerateOptions>({
    keepProgress: true,
    adjustDifficulty: false,
    newDeadline: currentPlan?.deadline || '',
    focusAreas: [],
    studyIntensity: 'moderate',
    preferredHours: currentPlan?.preferred_hours_per_day || 2,
    userFeedback: ''
  });

  useEffect(() => {
    if (currentPlan) {
      // Extract available topics from current plan
      const topics = currentPlan.sessions?.map((s: any) => s.topic.split(':')[0]).filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i) || [];
      setAvailableTopics(topics);
      
      // Set initial deadline
      if (currentPlan.deadline) {
        const deadlineDate = new Date(currentPlan.deadline);
        setRegenerateOptions(prev => ({
          ...prev,
          newDeadline: deadlineDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [currentPlan]);

  const analyzeLearningPace = async (): Promise<'slow' | 'normal' | 'fast'> => {
    try {
      const userId = getUserId();
      const response = await api(`/api/analytics/learning-pace/${userId}`);
      
      if (response && response.pace) {
        return response.pace;
      }
      
      // Fallback analysis based on current plan progress
      if (currentPlan?.sessions) {
        const completedSessions = currentPlan.sessions.filter((s: any) => s.status === 'completed');
        const totalSessions = currentPlan.sessions.length;
        const completionRate = totalSessions > 0 ? completedSessions.length / totalSessions : 0;
        
        // Simple heuristic based on completion rate and time
        const planStartDate = new Date(currentPlan.created_at || Date.now());
        const daysSinceStart = Math.max(1, Math.floor((Date.now() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)));
        const sessionsPerDay = completedSessions.length / daysSinceStart;
        
        if (sessionsPerDay > 2 || completionRate > 0.8) return 'fast';
        if (sessionsPerDay < 0.5 || completionRate < 0.3) return 'slow';
        return 'normal';
      }
      
      return 'normal';
    } catch (error) {
      console.error('Failed to analyze learning pace:', error);
      return 'normal';
    }
  };

  const getUserFeedback = async (): Promise<string> => {
    try {
      const userId = getUserId();
      const response = await api(`/api/feedback/recent/${userId}`);
      
      if (response && response.feedback) {
        return response.feedback.map((f: any) => f.comment).join('. ');
      }
      
      return '';
    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return '';
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    
    try {
      // Analyze current learning pace
      const pace = regenerateOptions.adjustDifficulty ? await analyzeLearningPace() : 'normal';
      setLearningPace(pace);
      
      // Get user feedback
      const feedback = await getUserFeedback();
      
      // Compute new deadline fallback (latest session date or +14 days)
      const plannedLastDate = (() => {
        try {
          const dates = (currentPlan?.sessions || []).map((s:any) => String(s.date)).filter(Boolean)
          return dates.length ? dates.sort().slice(-1)[0] : ''
        } catch { return '' }
      })()
      const newDeadline = regenerateOptions.newDeadline || plannedLastDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Prepare regeneration request aligned with backend schema
      const request = {
        plan_id: currentPlan.id,
        user_id: getUserId(),
        preserve_progress: regenerateOptions.keepProgress,
        new_deadline: newDeadline,
        hours_per_day: regenerateOptions.preferredHours,
        learning_pace: regenerateOptions.studyIntensity,
        excluded_topics: [],
        priority_adjustment: 'balanced'
      };
      
      // Call regenerate API
      const response = await api('/api/plan/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response || response.success === false) {
        throw new Error((response && (response.error || response.errorMessage)) || 'Failed to regenerate plan');
      }

      // Backend shape: { success, data: { regenerated_plan, changes_summary } }
      const regenerated = response?.data?.regenerated_plan || response?.regenerated_plan || response?.plan || null;
      if (!regenerated || !regenerated.sessions) {
        throw new Error('Regeneration returned no plan payload');
      }

      // Update UI with new plan
      onRegenerate(regenerated);

      // Show success message with details
      const improvements = [];
      if (regenerateOptions.adjustDifficulty) improvements.push(`Adjusted for ${pace} pace`);
      if (regenerateOptions.focusAreas.length > 0) improvements.push(`Focus on ${regenerateOptions.focusAreas.length} areas`);
      if (regenerateOptions.newDeadline !== currentPlan.deadline) improvements.push('Updated deadline');
      
      toast.success('Study plan regenerated successfully!', {
        description: improvements.length > 0 ? improvements.join(', ') : 'Plan optimized based on your progress'
      });
      
      setShowOptions(false);
      
    } catch (error: any) {
      console.error('Regeneration failed:', error);
      pushError({
        errorCode: 'PLAN_REGENERATE_FAILED',
        errorMessage: error.message || 'Failed to regenerate plan. Please try again.',
        details: error
      });
      toast.error('Failed to regenerate plan. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFocusAreaToggle = (topic: string, checked: boolean) => {
    setRegenerateOptions(prev => ({
      ...prev,
      focusAreas: checked 
        ? [...prev.focusAreas, topic]
        : prev.focusAreas.filter(t => t !== topic)
    }));
  };

  const getPlanStats = () => {
    if (!currentPlan?.sessions) return { total: 0, completed: 0, percentage: 0 };
    
    const total = currentPlan.sessions.length;
    const completed = currentPlan.sessions.filter((s: any) => s.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  };

  const stats = getPlanStats();

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Plan Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Plan Stats */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Progress</span>
              <Badge variant="outline">{stats.percentage}% Complete</Badge>
            </div>
            <Progress value={stats.percentage} className="h-2 mb-2" />
            <div className="text-xs text-muted-foreground">
              {stats.completed} of {stats.total} sessions completed
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Dialog open={showOptions} onOpenChange={setShowOptions}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={isRegenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Regenerate Study Plan
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Progress Preservation */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Progress & Content</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="keepProgress"
                          checked={regenerateOptions.keepProgress}
                          onCheckedChange={(checked) => 
                            setRegenerateOptions(prev => ({ ...prev, keepProgress: checked as boolean }))
                          }
                        />
                        <Label htmlFor="keepProgress" className="text-sm">
                          Keep completed tasks and progress
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="adjustDifficulty"
                          checked={regenerateOptions.adjustDifficulty}
                          onCheckedChange={(checked) => 
                            setRegenerateOptions(prev => ({ ...prev, adjustDifficulty: checked as boolean }))
                          }
                        />
                        <Label htmlFor="adjustDifficulty" className="text-sm">
                          Adjust difficulty based on my progress
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Timeline & Intensity */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Timeline & Intensity</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newDeadline" className="text-sm">New Deadline</Label>
                        <Input
                          id="newDeadline"
                          type="date"
                          value={regenerateOptions.newDeadline}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setRegenerateOptions(prev => ({ 
                            ...prev, 
                            newDeadline: e.target.value 
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="preferredHours" className="text-sm">Hours per Day</Label>
                        <Input
                          id="preferredHours"
                          type="number"
                          min="0.5"
                          max="8"
                          step="0.5"
                          value={regenerateOptions.preferredHours}
                          onChange={(e) => setRegenerateOptions(prev => ({ 
                            ...prev, 
                            preferredHours: parseFloat(e.target.value) || 2 
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="studyIntensity" className="text-sm">Study Intensity</Label>
                      <Select
                        value={regenerateOptions.studyIntensity}
                        onValueChange={(value: 'light' | 'moderate' | 'intensive') => 
                          setRegenerateOptions(prev => ({ ...prev, studyIntensity: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light - Relaxed pace</SelectItem>
                          <SelectItem value="moderate">Moderate - Balanced approach</SelectItem>
                          <SelectItem value="intensive">Intensive - Fast-paced learning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  {availableTopics.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Focus Areas (Optional)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {availableTopics.map((topic) => (
                          <div key={topic} className="flex items-center space-x-2">
                            <Checkbox
                              id={`topic-${topic}`}
                              checked={regenerateOptions.focusAreas.includes(topic)}
                              onCheckedChange={(checked) => handleFocusAreaToggle(topic, checked as boolean)}
                            />
                            <Label htmlFor={`topic-${topic}`} className="text-sm">
                              {topic}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Feedback */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Additional Feedback (Optional)</h4>
                    <Textarea
                      placeholder="Any specific requests or areas you'd like to focus on..."
                      value={regenerateOptions.userFeedback}
                      onChange={(e) => setRegenerateOptions(prev => ({ 
                        ...prev, 
                        userFeedback: e.target.value 
                      }))}
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowOptions(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="flex-1"
                    >
                      {isRegenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Regenerate Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Review
            </Button>
          </div>

          {/* Learning Pace Indicator */}
          {learningPace && learningPace !== 'normal' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">
                  Detected Learning Pace: {learningPace === 'fast' ? '🚀 Fast' : '🐌 Slow'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {learningPace === 'fast' 
                  ? 'You\'re progressing quickly! Consider more challenging content.'
                  : 'Take your time. Consider reducing session intensity or extending deadlines.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
