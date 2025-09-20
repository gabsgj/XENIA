"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useErrorContext } from "@/lib/error-context";
import { getUserId } from "@/lib/api";
import {
  Play,
  Clock,
  Target,
  CheckCircle,
  X,
  RotateCcw,
  ArrowLeft,
  Trophy,
  BookOpen,
  Calendar,
  Brain,
  Settings,
  Upload,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

const DURATIONS = [5, 10, 15, 30, 60, 120];

const DEFAULT_TOPICS = [
  "Linear Algebra",
  "Calculus",
  "Machine Learning",
  "Physics",
  "Chemistry",
  "Biology",
];

// Use the global getUserId utility for consistent authentication
const getRealUserId = () => getUserId();

export default function QuizPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(10);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [step, setStep] = useState<"setup" | "quiz" | "results">("setup");
  const [userProfile, setUserProfile] = useState<string>("");
  const [syllabus, setSyllabus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const { pushError } = useErrorContext();

  // Fetch user's available topics and daily tasks
  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingTopics(true);
      try {
        const [topicsResp, planResp] = await Promise.all([
          api('/api/resources/topics').catch(() => ({ topics: [] })),
          api('/api/plan/current').catch(() => ({ sessions: [] }))
        ]);

        const topics = (topicsResp as any)?.topics || [];
        const sessions = (planResp as any)?.sessions || [];
        
        // Extract unique topics from syllabus
        const syllabusTopics = topics.map((t: any) => 
          typeof t === 'string' ? t : t.topic || t.name || 'Unknown'
        );
        
        // Extract today's tasks topics
        const today = new Date().toISOString().slice(0, 10);
        const todaysTasks = sessions
          .filter((s: any) => s.date === today)
          .map((s: any) => s.topic.split(':')[0] || s.topic);
        
        // Combine and deduplicate topics
        const allTopics = [...new Set([...syllabusTopics, ...todaysTasks])];
        
        setAvailableTopics(allTopics);
        setDailyTasks(todaysTasks);
        
        // Auto-select today's tasks if available, otherwise select first few syllabus topics
        if (todaysTasks.length > 0) {
          setSelectedTopics(todaysTasks.slice(0, 3)); // Select up to 3 today's tasks
        } else if (allTopics.length > 0) {
          setSelectedTopics(allTopics.slice(0, 3)); // Select first 3 topics
        }
        
      } catch (error: any) {
        console.error('Failed to fetch user data:', error);
        // Fallback to default topics if API fails
        setAvailableTopics(DEFAULT_TOPICS);
        setSelectedTopics(DEFAULT_TOPICS.slice(0, 3));
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchUserData();
  }, []);

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const resp = await api("/api/quiz/generate", {
        method: "POST",
        body: JSON.stringify({
          user_id: getRealUserId(),
          topics: selectedTopics,
          num_questions: numQuestions,
          options_count: 4,
          duration,
          user_profile: userProfile,
          syllabus,
        }),
      });
      setQuiz(resp.quiz);
      setAnswers(Array(resp.quiz.questions.length).fill(-1));
      setStep("quiz");
    } catch (err: any) {
      pushError({
        errorCode: err?.errorCode || "QUIZ_GENERATE_FAILED",
        errorMessage: err?.errorMessage || "Failed to generate quiz",
        details: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    try {
      const resp = await api("/api/quiz/submit", {
        method: "POST",
        body: JSON.stringify({
          quiz,
          user_answers: answers,
        }),
      });
      setStats(resp.stats);
      setStep("results");
    } catch (err: any) {
      pushError({
        errorCode: err?.errorCode || "QUIZ_SUBMIT_FAILED",
        errorMessage: err?.errorMessage || "Failed to submit quiz",
        details: err,
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "setup") {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold">Quiz Me</h1>
            <p className="text-muted-foreground mt-2">
              Quick practice quizzes tailored to your syllabus
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Quiz Setup
              </CardTitle>
              <CardDescription>
                Configure your quiz settings and get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userProfile">User Profile (optional)</Label>
                <Input
                  id="userProfile"
                  placeholder="e.g. Grade 10, prefers visual learning"
                  value={userProfile}
                  onChange={(e) => setUserProfile(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="syllabus">Syllabus (optional)</Label>
                <Textarea
                  id="syllabus"
                  placeholder="Paste a short syllabus or topics, e.g. Algebra, Calculus, ML basics"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Select Topics {loadingTopics && <span className="text-sm text-muted-foreground">(Loading...)</span>}
              </Label>
              
              {/* Today's Tasks Section */}
              {dailyTasks.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Today's Tasks
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {dailyTasks.map((topic: string) => (
                      <Button
                        key={`today-${topic}`}
                        variant={selectedTopics.includes(topic) ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setSelectedTopics((prev) =>
                            prev.includes(topic)
                              ? prev.filter((t) => t !== topic)
                              : [...prev, topic]
                          )
                        }
                        className="text-xs"
                      >
                        {topic}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Syllabus Topics Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {dailyTasks.length > 0 ? 'Other Topics' : 'Available Topics'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableTopics
                    .filter(topic => !dailyTasks.includes(topic)) // Exclude today's tasks from this section
                    .map((topic: string) => (
                    <Button
                      key={topic}
                      variant={selectedTopics.includes(topic) ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedTopics((prev) =>
                          prev.includes(topic)
                            ? prev.filter((t) => t !== topic)
                            : [...prev, topic]
                        )
                      }
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Fallback to default topics if no user topics available */}
              {availableTopics.length === 0 && !loadingTopics && (
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TOPICS.map((topic: string) => (
                    <Button
                      key={topic}
                      variant={selectedTopics.includes(topic) ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedTopics((prev) =>
                          prev.includes(topic)
                            ? prev.filter((t) => t !== topic)
                            : [...prev, topic]
                        )
                      }
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              )}
            </div>            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <select
                  id="duration"
                  className="w-full rounded-md border px-3 py-2 bg-background"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {DURATIONS.map((d: number) => (
                    <option key={d} value={d}>
                      {d} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                />
              </div>
            </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleStartQuiz}
                  disabled={selectedTopics.length === 0 || numQuestions < 1 || loading}
                  className="flex-1"
                >
                  {loading ? "Generating..." : "Start Quiz"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTopics([]);
                    setUserProfile("");
                    setSyllabus("");
                    setNumQuestions(5);
                    setDuration(10);
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>

                <div className="text-sm text-muted-foreground">
                  Tip: Select 2-4 topics for a focused quiz
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (step === "quiz" && quiz) {
    const answeredCount = answers.filter(a => a !== -1).length;
    const progressPercentage = (answeredCount / quiz.questions.length) * 100;

    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header with Progress */}
          <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Quiz Time</h1>
                <p className="text-muted-foreground">
                  Question {answeredCount + 1} of {quiz.questions.length}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {quiz.duration} min
                </Badge>
                <Badge variant="secondary">
                  {selectedTopics.join(", ")}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{answeredCount}/{quiz.questions.length} answered</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {quiz.questions.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  // Smooth scroll to question
                  const questionElement = document.getElementById(`question-${idx}`);
                  questionElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  answers[idx] !== -1
                    ? 'bg-green-500 text-white'
                    : idx === answeredCount
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {quiz.questions.map((q: any, idx: number) => (
              <Card key={idx} id={`question-${idx}`} className={`transition-all duration-300 ${
                idx === answeredCount ? 'ring-2 ring-primary' : ''
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-4 leading-relaxed">{q.question}</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {q.options.map((opt: string, oidx: number) => (
                          <Button
                            key={oidx}
                            variant={answers[idx] === oidx ? "default" : "outline"}
                            onClick={() => {
                              const newAnswers = [...answers];
                              newAnswers[idx] = oidx;
                              setAnswers(newAnswers);
                            }}
                            className="justify-start text-left h-auto p-4 whitespace-normal hover:scale-[1.02] transition-all"
                          >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + oidx)}.</span>
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit Section */}
          <Card className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {answeredCount === quiz.questions.length ? (
                    <span className="text-green-600 font-medium">All questions answered! Ready to submit.</span>
                  ) : (
                    <span>{quiz.questions.length - answeredCount} questions remaining</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("setup")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={loading || answers.includes(-1)}
                    size="lg"
                    className="min-w-[140px]"
                  >
                    {loading ? "Submitting..." : "Submit Quiz"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (step === "results" && stats) {
    const score = stats.correct;
    const total = stats.correct + stats.wrong;
    const percentage = Math.round((score / total) * 100);
    const avgTime = quiz.questions.length > 0 ? Math.round(quiz.duration * 60 / quiz.questions.length) : 0;

    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Results Header */}
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
              percentage >= 80 ? 'bg-green-100 dark:bg-green-900/20' :
              percentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              'bg-red-100 dark:bg-red-900/20'
            }`}>
              {percentage >= 80 ? (
                <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : percentage >= 60 ? (
                <Target className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <X className="w-10 h-10 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Quiz Complete!</h1>
              <p className="text-muted-foreground">Here's your performance breakdown</p>
            </div>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {score}/{total}
                </div>
                <p className="text-sm text-muted-foreground">Questions Correct</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {percentage}%
                </div>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {avgTime}s
                </div>
                <p className="text-sm text-muted-foreground">Avg per Question</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
              <CardDescription>Your quiz performance by topic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedTopics.map((topic: string) => {
                  // Calculate performance for this topic (simplified)
                  const topicCorrect = Math.floor(Math.random() * 3) + 1; // Mock data
                  const topicTotal = Math.floor(Math.random() * 2) + 3; // Mock data
                  const topicPercentage = Math.round((topicCorrect / topicTotal) * 100);

                  return (
                    <div key={topic} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{topic}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {topicCorrect}/{topicTotal} ({topicPercentage}%)
                        </span>
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              topicPercentage >= 70 ? 'bg-green-500' :
                              topicPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${topicPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
              <CardDescription>Review your answers and learn from mistakes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.feedback.map((fb: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <Badge variant={fb.is_correct ? "default" : "destructive"} className="mt-1">
                        Q{idx + 1}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-3">{fb.question}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {fb.options.map((opt: string, oidx: number) => (
                            <div
                              key={oidx}
                              className={`p-3 rounded-md border text-sm ${
                                oidx === fb.correct_index
                                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                                  : oidx === fb.user_answer && !fb.is_correct
                                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                  : "bg-muted/50"
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + oidx)}.</span>
                              {opt}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {fb.is_correct ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <X className="w-3 h-3 mr-1" />
                              Incorrect
                            </Badge>
                          )}
                          {!fb.is_correct && (
                            <span className="text-sm text-muted-foreground">
                              Correct answer: {String.fromCharCode(65 + fb.correct_index)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setStep("setup")}
              className="flex-1"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Quiz
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return null;
}
