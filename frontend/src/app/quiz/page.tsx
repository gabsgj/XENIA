"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  Sparkles,
  Zap,
  Star,
  Award,
  TrendingUp,
  Timer,
  ChevronRight,
  ChevronLeft
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
  const [questionTimer, setQuestionTimer] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Question timer effect
  useEffect(() => {
    if (step === "quiz" && quiz) {
      const answeredCount = answers.filter(a => a !== -1).length;
      if (answeredCount < quiz.questions.length) {
        questionTimerRef.current = setInterval(() => {
          setQuestionTimer(prev => prev + 1);
        }, 1000);
      }
      return () => {
        if (questionTimerRef.current) {
          clearInterval(questionTimerRef.current);
        }
      };
    }
  }, [step, quiz, answers]);

  // Reset question timer when moving to next question
  useEffect(() => {
    if (step === "quiz") {
      setQuestionTimer(0);
    }
  }, [answers]);

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
      // Reset enhanced features
      setQuestionTimer(0);
      setStreakCount(0);
      setMaxStreak(0);
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
      
      // Calculate final streaks from results
      let currentStreak = 0;
      let maxStreak = 0;
      resp.stats.feedback.forEach((fb: any) => {
        if (fb.is_correct) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      setStreakCount(currentStreak);
      setMaxStreak(maxStreak);
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Quiz Master
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Challenge yourself with AI-powered quizzes tailored to your learning journey
              </p>
            </div>

            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Quick Quiz</h3>
                  <p className="text-sm opacity-90">5 questions, 5 minutes</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Focused Study</h3>
                  <p className="text-sm opacity-90">10 questions, 15 minutes</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Challenge Mode</h3>
                  <p className="text-sm opacity-90">20 questions, 30 minutes</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Setup Card */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Customize Your Quiz
                </CardTitle>
                <CardDescription>
                  Select topics and configure settings for your personalized quiz experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Topic Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <Label className="text-lg font-semibold">Select Topics</Label>
                    {loadingTopics && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                  
                  {/* Today's Tasks Section */}
                  {dailyTasks.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Today's Study Tasks
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
                            className="bg-white dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                          >
                            {topic}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Available Topics */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {dailyTasks.length > 0 ? 'Additional Topics' : 'Available Topics'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {availableTopics
                        .filter(topic => !dailyTasks.includes(topic))
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
                          className="transition-all hover:scale-105"
                        >
                          {topic}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Fallback topics */}
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
                            className="transition-all hover:scale-105"
                          >
                            {topic}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedTopics.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                {/* Quiz Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      Duration
                    </Label>
                    <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d: number) => (
                          <SelectItem key={d} value={d.toString()}>
                            {d} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Number of Questions
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="text-center"
                    />
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-4 pt-4 border-t">
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:text-primary transition-colors">
                      <Settings className="w-4 h-4" />
                      Advanced Options
                      <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-4 space-y-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="userProfile">Learning Profile (Optional)</Label>
                        <Input
                          id="userProfile"
                          placeholder="e.g., High school student, visual learner"
                          value={userProfile}
                          onChange={(e) => setUserProfile(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="syllabus">Syllabus Context (Optional)</Label>
                        <Textarea
                          id="syllabus"
                          placeholder="Paste topics or syllabus content for personalized questions"
                          value={syllabus}
                          onChange={(e) => setSyllabus(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                  </details>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    onClick={handleStartQuiz}
                    disabled={selectedTopics.length === 0 || numQuestions < 1 || loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Start Quiz
                      </>
                    )}
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
                    size="lg"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }  if (step === "quiz" && quiz) {
    const answeredCount = answers.filter(a => a !== -1).length;
    const progressPercentage = (answeredCount / quiz.questions.length) * 100;
    const currentQuestionIndex = answeredCount;
    const currentQuestion = quiz.questions[currentQuestionIndex];

    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto p-6">
            {/* Header with Progress */}
            <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Quiz in Progress
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                    <Clock className="w-4 h-4" />
                    {quiz.duration} min
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                    <Timer className="w-4 h-4" />
                    {questionTimer}s
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                    <Zap className="w-4 h-4" />
                    Streak: {streakCount}
                  </Badge>
                  <div className="hidden md:block max-w-[200px]">
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedTopics.join(", ")}
                    </div>
                  </div>
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
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {quiz.questions.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Allow jumping to answered questions or next question
                    if (idx <= answeredCount) {
                      // Smooth scroll to question
                      const questionElement = document.getElementById(`question-${idx}`);
                      questionElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                    answers[idx] !== -1
                      ? 'bg-green-500 text-white shadow-md'
                      : idx === currentQuestionIndex
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                      : idx < currentQuestionIndex
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm mb-6">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Question */}
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-4 px-3 py-1">
                        {currentQuestion.topic}
                      </Badge>
                      <h2 className="text-xl md:text-2xl font-semibold leading-relaxed text-center">
                        {currentQuestion.question}
                      </h2>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                      {currentQuestion.options.map((opt: string, oidx: number) => {
                        const isSelected = answers[currentQuestionIndex] === oidx;
                        return (
                          <Button
                            key={oidx}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => {
                              const newAnswers = [...answers];
                              newAnswers[currentQuestionIndex] = oidx;
                              setAnswers(newAnswers);
                              
                              // Update streak if this is the current question being answered
                              if (currentQuestionIndex === answeredCount) {
                                // Check if answer is correct (we'll know after submission, but for now just track attempts)
                                setStreakCount(prev => prev + 1);
                                setMaxStreak(prev => Math.max(prev, streakCount + 1));
                              }
                            }}
                            className={`justify-start text-left h-auto p-6 whitespace-normal transition-all hover:scale-[1.02] ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'hover:bg-muted/50'
                            }`}
                            size="lg"
                          >
                            <span className="font-bold mr-4 text-lg">
                              {String.fromCharCode(65 + oidx)}.
                            </span>
                            <span className="flex-1">{opt}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Questions Review */}
            {currentQuestionIndex > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-center text-muted-foreground">
                  Previous Questions
                </h3>
                {quiz.questions.slice(0, currentQuestionIndex).map((q: any, idx: number) => (
                  <Card key={`review-${idx}`} id={`question-${idx}`} className="opacity-75 hover:opacity-100 transition-opacity">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={answers[idx] !== -1 ? "default" : "secondary"}>
                          Q{idx + 1}
                        </Badge>
                        <span className="text-sm text-muted-foreground truncate flex-1">
                          {q.question}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            document.getElementById(`question-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Submit Section */}
            <Card className="sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t shadow-lg">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {answeredCount === quiz.questions.length ? (
                      <span className="text-green-600 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        All questions answered! Ready to submit.
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {quiz.questions.length - answeredCount} question{quiz.questions.length - answeredCount !== 1 ? 's' : ''} remaining
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 items-center">
                    <Button
                      variant="outline"
                      onClick={() => setStep("setup")}
                      size="sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={loading || answers.includes(-1)}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Trophy className="w-4 h-4 mr-2" />
                          Submit Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (step === "results" && stats) {
    const score = stats.correct;
    const total = stats.correct + stats.wrong;
    const percentage = Math.round((score / total) * 100);
    const avgTime = quiz.questions.length > 0 ? Math.round(quiz.duration * 60 / quiz.questions.length) : 0;

    // Performance level
    const getPerformanceLevel = (pct: number) => {
      if (pct >= 90) return { level: "Master", color: "from-yellow-400 to-orange-500", icon: Trophy };
      if (pct >= 80) return { level: "Expert", color: "from-green-400 to-emerald-500", icon: Award };
      if (pct >= 70) return { level: "Advanced", color: "from-blue-400 to-cyan-500", icon: Star };
      if (pct >= 60) return { level: "Intermediate", color: "from-purple-400 to-pink-500", icon: TrendingUp };
      return { level: "Beginner", color: "from-gray-400 to-gray-500", icon: Target };
    };

    const performance = getPerformanceLevel(percentage);
    const PerformanceIcon = performance.icon;

    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Results Header */}
            <div className="text-center space-y-6 py-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r ${performance.color} rounded-full shadow-2xl`}>
                <PerformanceIcon className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Quiz Complete!</h1>
                <p className="text-xl text-muted-foreground">You've earned the title of <span className="font-semibold text-primary">{performance.level}</span></p>
              </div>
            </div>

            {/* Score Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">
                    {score}/{total}
                  </div>
                  <p className="text-sm opacity-90">Questions Correct</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">
                    {percentage}%
                  </div>
                  <p className="text-sm opacity-90">Accuracy Rate</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">
                    {avgTime}s
                  </div>
                  <p className="text-sm opacity-90">Avg per Question</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">
                    {maxStreak}
                  </div>
                  <p className="text-sm opacity-90">Best Streak</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Message */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Performance Analysis</h3>
                <p className="text-muted-foreground">
                  {percentage >= 90 ? "Outstanding! You've mastered this material." :
                   percentage >= 80 ? "Excellent work! You're showing strong understanding." :
                   percentage >= 70 ? "Good job! Keep practicing to improve further." :
                   percentage >= 60 ? "Not bad! Focus on the areas you missed." :
                   "Keep studying! Practice makes perfect."}
                  {maxStreak >= 5 && " Your impressive streak of " + maxStreak + " shows great momentum!"}
                </p>
              </CardContent>
            </Card>

            {/* Question Review */}
            <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Question Review
                </CardTitle>
                <CardDescription>
                  Review your answers and learn from mistakes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {stats.feedback.map((fb: any, idx: number) => (
                    <div key={idx} className={`border rounded-xl p-6 transition-all ${
                      fb.is_correct
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-start gap-4">
                        <Badge variant={fb.is_correct ? "default" : "destructive"} className="mt-1 px-3 py-1">
                          Q{idx + 1}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-4 text-lg leading-relaxed">{fb.question}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {fb.options.map((opt: string, oidx: number) => (
                              <div
                                key={oidx}
                                className={`p-4 rounded-lg border text-sm transition-all ${
                                  oidx === fb.correct_index
                                    ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 text-green-800 dark:text-green-200"
                                    : oidx === fb.user_answer && !fb.is_correct
                                    ? "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700 text-red-800 dark:text-red-200"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                }`}
                              >
                                <span className="font-bold mr-2">{String.fromCharCode(65 + oidx)}.</span>
                                {opt}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            {fb.is_correct ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
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
                                Correct answer: <span className="font-semibold">{String.fromCharCode(65 + fb.correct_index)}</span>
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
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setStep("setup")}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Another Quiz
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 border-2 hover:bg-muted transition-all"
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return null;
}
