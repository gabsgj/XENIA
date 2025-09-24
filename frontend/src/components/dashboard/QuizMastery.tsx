'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, getUserId } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, TrendingUp, Award, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface QuizData {
  topic: string;
  quizzes_taken: number;
  correct_answers: number;
  wrong_answers: number;
  last_score: number;
  average_score: number;
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  last_updated: string;
  improvement_trend: 'improving' | 'stable' | 'declining';
}

interface QuizMasteryProps {
  className?: string;
}

export function QuizMastery({ className }: QuizMasteryProps) {
  const [quizData, setQuizData] = useState<QuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const userId = getUserId();
      
      // Fetch quiz progress data
      const progressResponse = await api(`/api/progress/user/${userId}`);
      
      if (!progressResponse || !progressResponse.progress || Object.keys(progressResponse.progress).length === 0) {
        setQuizData([]);
        setMessage("No quizzes taken yet. Start a quiz to see your progress!");
        return;
      }

      // Process quiz data
      const processedData: QuizData[] = Object.entries(progressResponse.progress).map(([topic, stats]: [string, any]) => {
        const totalAnswers = (stats.correct || 0) + (stats.wrong || 0);
        const averageScore = totalAnswers > 0 ? (stats.correct || 0) / totalAnswers : 0;
        const lastScore = stats.last_score || 0;
        
        // Determine mastery level based on average score and quiz count
        let masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
        if (averageScore >= 0.9 && (stats.quizzes_taken || 0) >= 5) {
          masteryLevel = 'expert';
        } else if (averageScore >= 0.8 && (stats.quizzes_taken || 0) >= 3) {
          masteryLevel = 'advanced';
        } else if (averageScore >= 0.6 && (stats.quizzes_taken || 0) >= 2) {
          masteryLevel = 'intermediate';
        }

        // Determine improvement trend (simplified - would need historical data for accurate trend)
        let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
        if (lastScore > averageScore * 1.1) {
          improvementTrend = 'improving';
        } else if (lastScore < averageScore * 0.9) {
          improvementTrend = 'declining';
        }

        return {
          topic,
          quizzes_taken: stats.quizzes_taken || 0,
          correct_answers: stats.correct || 0,
          wrong_answers: stats.wrong || 0,
          last_score: Math.round(lastScore * 100),
          average_score: Math.round(averageScore * 100),
          mastery_level: masteryLevel,
          last_updated: stats.last_updated || new Date().toISOString(),
          improvement_trend: improvementTrend
        };
      }).filter(item => item.quizzes_taken > 0); // Only show topics with quizzes taken

      // Sort by average score descending
      processedData.sort((a, b) => b.average_score - a.average_score);
      
      setQuizData(processedData);
      
      if (processedData.length === 0) {
        setMessage("No quizzes completed yet. Take your first quiz to see mastery progress!");
      }
    } catch (err) {
      console.error('Failed to fetch quiz data:', err);
      setError('Failed to load quiz progress data');
      setQuizData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
    
    // Set up real-time updates
    const interval = setInterval(fetchQuizData, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const getMasteryBadge = (level: string) => {
    switch (level) {
      case 'expert':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">🏆 Expert</Badge>;
      case 'advanced':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">🎯 Advanced</Badge>;
      case 'intermediate':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">📈 Intermediate</Badge>;
      case 'beginner':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">🌱 Beginner</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
      case 'stable':
        return <TrendingUp className="w-4 h-4 text-gray-500 transform rotate-90" />;
      default:
        return null;
    }
  };

  const overallStats = useMemo(() => {
    if (quizData.length === 0) return { totalQuizzes: 0, averageScore: 0, expertTopics: 0 };
    
    const totalQuizzes = quizData.reduce((sum, item) => sum + item.quizzes_taken, 0);
    const averageScore = Math.round(quizData.reduce((sum, item) => sum + item.average_score, 0) / quizData.length);
    const expertTopics = quizData.filter(item => item.mastery_level === 'expert').length;
    
    return { totalQuizzes, averageScore, expertTopics };
  }, [quizData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Quiz Mastery
          </CardTitle>
          <CardDescription>Your quiz performance and topic mastery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Quiz Mastery
        </CardTitle>
        <CardDescription>
          Your quiz performance and topic mastery levels
          {overallStats.totalQuizzes > 0 && (
            <span className="ml-2 text-primary font-semibold">
              • {overallStats.totalQuizzes} quizzes • {overallStats.averageScore}% avg
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center text-muted-foreground py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{error}</p>
          </div>
        ) : message ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">{message}</p>
            <Link href="/quiz">
              <Button>
                <Brain className="w-4 h-4 mr-2" />
                Take Your First Quiz
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Stats */}
            {overallStats.totalQuizzes > 0 && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallStats.totalQuizzes}</div>
                  <div className="text-xs text-muted-foreground">Total Quizzes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallStats.averageScore}%</div>
                  <div className="text-xs text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallStats.expertTopics}</div>
                  <div className="text-xs text-muted-foreground">Expert Topics</div>
                </div>
              </div>
            )}

            {/* Topic Mastery List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Award className="w-4 h-4" />
                Topic Mastery ({quizData.length} topics)
              </h4>
              
              {quizData.map((item, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium truncate max-w-[200px]" title={item.topic}>
                      {item.topic}
                    </h5>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(item.improvement_trend)}
                      {getMasteryBadge(item.mastery_level)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Score</span>
                      <span className="font-semibold">{item.average_score}%</span>
                    </div>
                    <Progress value={item.average_score} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-2">
                      <div>Quizzes: {item.quizzes_taken}</div>
                      <div>Last Score: {item.last_score}%</div>
                      <div>Correct: {item.correct_answers}</div>
                      <div>Wrong: {item.wrong_answers}</div>
                    </div>
                    
                    {item.improvement_trend === 'improving' && (
                      <div className="text-xs text-green-600 font-medium">📈 Improving!</div>
                    )}
                    {item.improvement_trend === 'declining' && (
                      <div className="text-xs text-red-600 font-medium">📉 Needs attention</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-border">
              <Link href="/quiz">
                <Button className="w-full">
                  <Brain className="w-4 h-4 mr-2" />
                  Take Another Quiz
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
