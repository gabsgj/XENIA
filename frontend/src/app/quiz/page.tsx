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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4 py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                <Brain className="w-8 h-8 text-slate-600 dark:text-slate-300" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                Assessment Center
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Professional evaluation tools designed to measure your academic progress and knowledge mastery
              </p>
            </div>

            {/* Quick Assessment Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Quick Assessment</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">5 questions • 5 minutes</p>
                  <Button
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    onClick={() => {
                      setNumQuestions(5);
                      setDuration(5);
                      setSelectedTopics(availableTopics.slice(0, 2));
                    }}
                  >
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Focused Evaluation</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">10 questions • 15 minutes</p>
                  <Button
                    className="w-full mt-4 bg-slate-600 hover:bg-slate-700 text-white"
                    size="sm"
                    onClick={() => {
                      setNumQuestions(10);
                      setDuration(15);
                      setSelectedTopics(availableTopics.slice(0, 3));
                    }}
                  >
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Comprehensive Exam</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">20 questions • 30 minutes</p>
                  <Button
                    className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white"
                    size="sm"
                    onClick={() => {
                      setNumQuestions(20);
                      setDuration(30);
                      setSelectedTopics(availableTopics.slice(0, 4));
                    }}
                  >
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Panel */}
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  Assessment Configuration
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Customize your assessment parameters for optimal evaluation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                {/* Topic Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <div>
                      <Label className="text-lg font-semibold text-slate-900 dark:text-slate-100">Subject Areas</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Select the topics you want to assess</p>
                    </div>
                    {loadingTopics && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  </div>
                  
                  {/* Today's Study Tasks Section */}
                  {dailyTasks.length > 0 && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Today's Scheduled Topics</h4>
                      </div>
                      <div className="flex flex-wrap gap-3">
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
                            className={`border-slate-300 dark:border-slate-600 ${
                              selectedTopics.includes(topic) 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            {topic}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Available Topics */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {dailyTasks.length > 0 ? 'Additional Subjects' : 'Available Subjects'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                          className={`justify-start border-slate-300 dark:border-slate-600 transition-all ${
                            selectedTopics.includes(topic) 
                              ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {topic}
                        </Button>
                      ))}
                    </div>
                    {/* Fallback topics */}
                    {availableTopics.length === 0 && !loadingTopics && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                            className={`justify-start border-slate-300 dark:border-slate-600 transition-all ${
                              selectedTopics.includes(topic) 
                                ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {topic}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedTopics.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-md">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium">{selectedTopics.length} subject{selectedTopics.length !== 1 ? 's' : ''} selected</span>
                    </div>
                  )}
                </div>

                {/* Assessment Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      Time Limit
                    </Label>
                    <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                      <SelectTrigger className="border-slate-300 dark:border-slate-600">
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
                    <Label className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Target className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      Question Count
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>

                {/* Advanced Configuration */}
                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                      <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      Advanced Configuration
                      <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-6 space-y-6 pl-6">
                      <div className="space-y-3">
                        <Label htmlFor="userProfile" className="text-slate-900 dark:text-slate-100">Learning Profile (Optional)</Label>
                        <Input
                          id="userProfile"
                          placeholder="e.g., High school student, visual learner, advanced mathematics"
                          value={userProfile}
                          onChange={(e) => setUserProfile(e.target.value)}
                          className="border-slate-300 dark:border-slate-600"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Helps tailor question difficulty and style</p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="syllabus" className="text-slate-900 dark:text-slate-100">Syllabus Context (Optional)</Label>
                        <Textarea
                          id="syllabus"
                          placeholder="Paste specific topics, chapters, or learning objectives for more targeted assessment"
                          value={syllabus}
                          onChange={(e) => setSyllabus(e.target.value)}
                          className="min-h-[100px] border-slate-300 dark:border-slate-600"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Enhances question relevance and accuracy</p>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Action Panel */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={handleStartQuiz}
                    disabled={selectedTopics.length === 0 || numQuestions < 1 || loading}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md transition-all"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Generating Assessment...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-3" />
                        Begin Assessment
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
                    className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Form
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="max-w-5xl mx-auto p-6">
            {/* Assessment Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 mb-8 shadow-sm z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Assessment in Progress
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{quiz.duration} minutes</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Time limit</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{questionTimer}s</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Elapsed</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{streakCount}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Current streak</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Assessment Progress</span>
                  <span>{answeredCount} of {quiz.questions.length} completed</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-slate-600 dark:bg-slate-400 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-8">
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 uppercase tracking-wide">Question Navigator</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Click to review completed questions</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
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
                    className={`w-12 h-12 rounded-lg text-sm font-medium transition-all border ${
                      answers[idx] !== -1
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                        : idx === currentQuestionIndex
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md'
                        : idx < currentQuestionIndex
                        ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm mb-8">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Question Header */}
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                        <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{currentQuestion.topic}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-semibold leading-relaxed text-slate-900 dark:text-slate-100 max-w-4xl mx-auto">
                        {currentQuestion.question}
                      </h2>
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
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
                                setStreakCount(prev => prev + 1);
                                setMaxStreak(prev => Math.max(prev, streakCount + 1));
                              }
                            }}
                            className={`justify-start text-left h-auto p-6 whitespace-normal transition-all border-2 ${
                              isSelected
                                ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-md'
                                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                            size="lg"
                          >
                            <span className="font-bold mr-6 text-lg min-w-[2rem] text-center">
                              {String.fromCharCode(65 + oidx)}.
                            </span>
                            <span className="flex-1 text-left leading-relaxed">{opt}</span>
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

            {/* Assessment Controls */}
            <Card className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
              <CardContent className="py-6 px-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {answeredCount === quiz.questions.length ? (
                      <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Assessment complete. Ready for submission.
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                        <AlertTriangle className="w-4 h-4" />
                        {quiz.questions.length - answeredCount} question{quiz.questions.length - answeredCount !== 1 ? 's' : ''} remaining
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 items-center">
                    <Button
                      variant="outline"
                      onClick={() => setStep("setup")}
                      size="lg"
                      className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Exit Assessment
                    </Button>
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={loading || answers.includes(-1)}
                      size="lg"
                      className="bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all px-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Processing Results...
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5 mr-3" />
                          Submit Assessment
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Assessment Results Header */}
            <div className="text-center space-y-8 py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <PerformanceIcon className="w-10 h-10 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  Assessment Complete
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400">
                  Performance Level: <span className="font-semibold text-slate-900 dark:text-slate-100">{performance.level}</span>
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Score: {score}/{total} ({percentage}%)</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {score}/{total}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Correct Answers</p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {percentage}%
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Accuracy Rate</p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {avgTime}s
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Avg per Question</p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {maxStreak}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Best Streak</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Analysis */}
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Performance Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
                  {percentage >= 90 ? "Outstanding performance! You demonstrate mastery of this material with exceptional accuracy." :
                   percentage >= 80 ? "Excellent work! You show strong understanding and command of the subject matter." :
                   percentage >= 70 ? "Good progress! You have solid foundational knowledge with room for continued improvement." :
                   percentage >= 60 ? "Satisfactory performance. Focus on strengthening areas of difficulty to improve comprehension." :
                   "Additional study recommended. Review fundamental concepts and consider additional practice sessions."}
                  {maxStreak >= 5 && ` Your impressive streak of ${maxStreak} consecutive correct answers demonstrates strong momentum.`}
                </p>
              </CardContent>
            </Card>

            {/* Detailed Review */}
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  Detailed Review
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Comprehensive analysis of your responses for learning optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {stats.feedback.map((fb: any, idx: number) => (
                    <div key={idx} className={`border rounded-lg p-6 transition-all ${
                      fb.is_correct
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          fb.is_correct
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-4 text-lg leading-relaxed text-slate-900 dark:text-slate-100">{fb.question}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {fb.options.map((opt: string, oidx: number) => (
                              <div
                                key={oidx}
                                className={`p-4 rounded-lg border text-sm transition-all ${
                                  oidx === fb.correct_index
                                    ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 text-green-800 dark:text-green-200"
                                    : oidx === fb.user_answer && !fb.is_correct
                                    ? "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700 text-red-800 dark:text-red-200"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <span className="font-bold mr-3">{String.fromCharCode(65 + oidx)}.</span>
                                {opt}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            {fb.is_correct ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-300 dark:border-green-700 px-3 py-1">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="px-3 py-1">
                                <X className="w-3 h-3 mr-1" />
                                Incorrect
                              </Badge>
                            )}
                            {!fb.is_correct && (
                              <span className="text-sm text-slate-600 dark:text-slate-400">
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
