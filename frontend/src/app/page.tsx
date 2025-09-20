"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  BarChart3, 
  Users, 
  UserCheck,
  PlayCircle
} from "lucide-react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background pt-8 md:pt-12">
      {/* Header */}
  <header className="fixed top-0 left-0 right-0 z-50 py-2 px-6 md:px-12 lg:px-16 flex justify-between items-center bg-background/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 dark:bg-white transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 relative group">
            How it Works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 dark:bg-white transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#pricing" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 relative group">
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 dark:bg-white transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#faq" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 relative group">
            FAQ
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 dark:bg-white transition-all duration-300 group-hover:w-full"></span>
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300">
            Log in
          </Link>
          <Link href="/register">
            <Button className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900">
              Sign up
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background/98 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 md:hidden">
            <div className="px-8 py-6 space-y-4">
              <a
                href="#features"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <Link href="/login" className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="relative group">
          <Button
            size="lg"
            className="w-14 h-14 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </Button>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Explore Features
          </div>
        </div>
      </div>

      {/* Hero Section */}
  <section className="relative py-12 md:py-16 px-4 md:px-6 lg:px-12 xl:px-20">
        {/* Background Elements - Professional and Subtle */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/20 dark:to-gray-900/10"></div>
  <div className="absolute top-20 left-10 w-64 h-64 bg-slate-100/30 dark:bg-slate-800/20 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
  <div className="absolute bottom-20 right-10 w-80 h-80 bg-gray-100/20 dark:bg-gray-800/10 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[600px] md:h-[600px] bg-slate-50/20 dark:bg-slate-900/06 rounded-full blur-2xl opacity-20 pointer-events-none"></div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight animate-fade-in-up animation-delay-400">
                Your Personal{" "}
                <span className="relative bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 dark:from-slate-300 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent animate-gradient-x">
                  AI
                  <svg className="absolute -bottom-3 left-0 w-full h-1 animate-fade-in-up animation-delay-600" viewBox="0 0 200 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 2.5C40 1 80 1 200 2.5" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(215 25% 35%)"/>
                        <stop offset="50%" stopColor="hsl(215 20% 45%)"/>
                        <stop offset="100%" stopColor="hsl(215 15% 55%)"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>{" "}
                Study{" "}
                <br/>
                <span className="text-foreground animate-fade-in-up animation-delay-800">Companion</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed animate-fade-in-up animation-delay-1000">
                Transform your learning with AI-powered study plans, intelligent quizzes, and 24/7 tutoring. Upload a syllabus and get a personalized learning path that adapts to your progress.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-1200">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto px-6 py-3 text-base font-semibold shadow transition-all duration-300 hover:scale-105 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Start Learning Free
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 py-3 text-base border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300">
                  Explore Features
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 animate-fade-in-up animation-delay-1400">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 items-center">
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border border-white shadow-sm">
                    <Image src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=face" alt="User A" width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border border-white shadow-sm">
                    <Image src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=face" alt="User B" width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border border-white shadow-sm">
                    <Image src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop&crop=face" alt="User C" width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border border-white shadow-sm">
                    <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face" alt="User D" width={36} height={36} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm">10,000+ Students</p>
                  <p className="text-xs text-muted-foreground">Already learning smarter</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border animate-fade-in-up animation-delay-1600"></div>
              <div className="flex items-center gap-2 animate-fade-in-up animation-delay-1600">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sm md:text-lg animate-pulse" style={{animationDelay: `${i * 200}ms`}}>★</span>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-sm">4.9/5 Rating</p>
                  <p className="text-xs text-muted-foreground">From 2,000+ reviews</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Floating Cards */}
            <div className="absolute -top-8 -left-8 z-10" style={{animationDelay: '0s'}}>
              <Card className="p-4 shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Quiz Ready</p>
                    <p className="text-xs text-muted-foreground">5 topics loaded</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="absolute -bottom-6 -right-6 z-10" style={{animationDelay: '1s'}}>
              <Card className="p-4 shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white dark:text-slate-900" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">AI Tutor</p>
                    <p className="text-xs text-muted-foreground">Online 24/7</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Dashboard Preview */}
            <Card className="relative border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Your Study Dashboard</h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Live Demo
                  </Badge>
                </div>

                <div className="space-y-6">
                  {/* Progress Overview */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">85%</div>
                      <p className="text-xs text-muted-foreground">Weekly Goal</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">12</div>
                      <p className="text-xs text-muted-foreground">Tasks Done</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">7</div>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                  </div>

                  {/* Today's Tasks */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Today's Focus
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        <span className="text-sm font-medium">Organic Chemistry - Chapter 5</span>
                        <Badge variant="secondary" className="ml-auto text-xs">2h</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        <span className="text-sm font-medium">Calculus - Integration</span>
                        <Badge variant="secondary" className="ml-auto text-xs">1.5h</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        <span className="text-sm font-medium">Physics Quiz</span>
                        <Badge variant="secondary" className="ml-auto text-xs">45m</Badge>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold">AI Insight</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You're 15% ahead of schedule! Consider adding extra practice on integration techniques.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-8 md:px-16 lg:px-24 bg-slate-50/30 dark:bg-slate-900/20">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">✨ Powerful Features</Badge>
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Everything You Need to Succeed</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            XENIA combines cutting-edge AI with proven learning techniques to create the ultimate study companion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* AI Study Planner */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Study Planner</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Get personalized study schedules based on your syllabus, learning patterns, and exam dates. AI adapts your plan as you progress.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Smart Scheduling</Badge>
                <Badge variant="secondary" className="text-xs">Adaptive Learning</Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Tutor */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Tutor</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Ask questions, get explanations, and solve problems with OCR support. Upload photos of homework for instant help.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">OCR Support</Badge>
                <Badge variant="secondary" className="text-xs">24/7 Help</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Smart Quiz System */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Quiz System</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Take personalized quizzes based on your syllabus topics and daily tasks. Track progress and identify weak areas.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Dynamic Topics</Badge>
                <Badge variant="secondary" className="text-xs">Progress Tracking</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Task Management */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Task Management</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Organize daily study tasks, set priorities, and track completion. Get reminders and stay on top of your schedule.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Daily Planning</Badge>
                <Badge variant="secondary" className="text-xs">Smart Reminders</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Progress Analytics */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Progress Analytics</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Visualize your learning journey with detailed charts, heatmaps, and insights. Track improvement over time.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Visual Dashboards</Badge>
                <Badge variant="secondary" className="text-xs">Performance Insights</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Gamification */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Gamification</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Earn XP, unlock achievements, and maintain streaks. Stay motivated with rewards and progress milestones.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">XP System</Badge>
                <Badge variant="secondary" className="text-xs">Achievements</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Teacher & Parent Portal */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Teacher & Parent Portal</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Teachers can tag weak topics and provide guidance. Parents can monitor progress and get detailed reports.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">Progress Reports</Badge>
                <Badge variant="secondary" className="text-xs">Collaborative Learning</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Resource Discovery */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Resource Discovery</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Get AI-curated YouTube videos, articles, and learning materials tailored to your current topics and learning style.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">YouTube Integration</Badge>
                <Badge variant="secondary" className="text-xs">Curated Content</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Upload & OCR */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-103 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 group">
            <CardContent className="p-6">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-8 h-8 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Upload & OCR</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Upload syllabi, assessments, and handwritten problems. OCR technology extracts text and creates structured learning paths.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">OCR Technology</Badge>
                <Badge variant="secondary" className="text-xs">Auto Processing</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Showcase */}
        <div className="mt-20">
          <Card className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-6">Experience the Power of AI Learning</h3>
                  <p className="text-muted-foreground mb-8 text-lg">
                    See how XENIA transforms your study experience with intelligent features designed to maximize your learning potential.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">95%</div>
                      <p className="text-sm text-muted-foreground">Students improve grades</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">24/7</div>
                      <p className="text-sm text-muted-foreground">AI tutor availability</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">50+</div>
                      <p className="text-sm text-muted-foreground">Subjects supported</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">10k+</div>
                      <p className="text-sm text-muted-foreground">Happy students</p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
                  <Card className="relative border shadow-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">AI Tutor</p>
                          <p className="text-sm text-muted-foreground">Ready to help</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm">How do I solve this calculus problem?</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <p className="text-sm text-primary">I'll help you break it down step by step...</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-slate-50/30 dark:bg-slate-900/20">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Success Stories</Badge>
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Loved by Students & Educators</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how XENIA is transforming learning experiences for students, teachers, and parents worldwide.
          </p>
        </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Student Testimonial */}
          <Card className="transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-base md:text-lg mb-6 leading-relaxed">
                "XENIA completely changed how I study. The AI tutor explains complex calculus problems better than my professor, and the personalized quiz system helped me identify exactly what I needed to focus on. My grades improved from B's to A's!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
                    alt="Sarah Chen"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Sarah Chen</h4>
                  <p className="text-sm text-muted-foreground">Engineering Student</p>
                  <Badge variant="secondary" className="text-xs mt-1">Grade improved 25%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Testimonial */}
          <Card className="transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-base md:text-lg mb-6 leading-relaxed">
                "As a teacher, I can finally see which concepts my students struggle with most. XENIA's analytics help me provide targeted support, and the parent portal keeps everyone informed. It's revolutionized my classroom management."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face"
                    alt="Dr. Maria Rodriguez"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Dr. Maria Rodriguez</h4>
                  <p className="text-sm text-muted-foreground">High School Physics Teacher</p>
                  <Badge variant="secondary" className="text-xs mt-1">50+ Students</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Testimonial */}
          <Card className="transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-base md:text-lg mb-6 leading-relaxed">
                "I can finally understand what my daughter is learning and how she's progressing. The detailed reports and insights help me support her studies effectively. XENIA has made our family study time much more productive."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
                    alt="Jennifer Park"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Jennifer Park</h4>
                  <p className="text-sm text-muted-foreground">Parent of High School Student</p>
                  <Badge variant="secondary" className="text-xs mt-1">Weekly Reports</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Student Testimonial */}
          <Card className="transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-base md:text-lg mb-6 leading-relaxed">
                "Medical school is intense, but XENIA's OCR feature for anatomy diagrams and the AI tutor for complex biochemistry pathways have been game-changers. I can study anywhere, anytime, with instant help."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                    alt="Dr. Ahmed Hassan"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Dr. Ahmed Hassan</h4>
                  <p className="text-sm text-muted-foreground">Medical Student</p>
                  <Badge variant="secondary" className="text-xs mt-1">OCR Expert</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* College Student Testimonial */}
          <Card className="transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-base md:text-lg mb-6 leading-relaxed">
                "The gamification aspect keeps me motivated! Earning XP and unlocking achievements makes studying feel like playing a game. Plus, the AI recommendations for YouTube videos are spot-on for visual learners like me."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                    alt="Liam Thompson"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Liam Thompson</h4>
                  <p className="text-sm text-muted-foreground">Computer Science Student</p>
                  <Badge variant="secondary" className="text-xs mt-1">500+ XP Earned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* International Student Testimonial */}
          <Card className="transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-base md:text-lg mb-6 leading-relaxed">
                "As an international student, the language support and clear explanations have been invaluable. XENIA adapts to different learning styles and makes complex subjects accessible in multiple ways."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
                    alt="Yuki Tanaka"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Yuki Tanaka</h4>
                  <p className="text-sm text-muted-foreground">International Business Student</p>
                  <Badge variant="secondary" className="text-xs mt-1">Multilingual Support</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
          <div className="text-center">
          <div className="inline-flex flex-wrap items-center gap-6 p-6 bg-card rounded-2xl shadow-md border relative">
            {/* Decorative user avatars */}
            <div className="absolute -top-3 -left-3 flex -space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-background shadow-sm">
                <Image
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face"
                  alt="Student"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-background shadow-sm">
                <Image
                  src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=40&h=40&fit=crop&crop=face"
                  alt="Student"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-background shadow-sm">
                <Image
                  src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop&crop=face"
                  alt="Student"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="text-center mx-2 my-1">
              <div className="text-3xl font-bold text-primary mb-1">10,000+</div>
              <p className="text-sm text-muted-foreground">Active Students</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border"></div>
            <div className="text-center mx-2 my-1">
              <div className="text-3xl font-bold text-primary mb-1">4.9/5</div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border"></div>
            <div className="text-center mx-2 my-1">
              <div className="text-3xl font-bold text-primary mb-1">95%</div>
              <p className="text-sm text-muted-foreground">Grade Improvement</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border"></div>
            <div className="text-center mx-2 my-1">
              <div className="text-3xl font-bold text-primary mb-1">50+</div>
              <p className="text-sm text-muted-foreground">Subjects Supported</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-8 md:px-16 lg:px-24">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">How It Works</Badge>
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Four Simple Steps to Success</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and transform your learning experience with AI-powered personalization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center group">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-semibold mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Your Syllabus</h3>
            <p className="text-muted-foreground">
              Simply upload your course syllabus or curriculum. Our AI extracts topics, creates a structured learning path, and identifies prerequisites.
            </p>
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                PDF, DOC, Images Supported
              </div>
            </div>
          </div>

          <div className="text-center group">
            <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-full flex items-center justify-center text-xl font-semibold mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3"/></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Get Your AI Plan</h3>
            <p className="text-muted-foreground">
              Receive a personalized study schedule that adapts to your learning style, pace, and exam dates with intelligent topic sequencing.
            </p>
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4" />
                Adaptive Scheduling
              </div>
            </div>
          </div>

          <div className="text-center group">
            <div className="w-14 h-14 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-semibold mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5z"/></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Learn & Practice</h3>
            <p className="text-muted-foreground">
              Follow your personalized plan, take AI-generated quizzes, and get instant help from your 24/7 AI tutor with OCR problem solving.
            </p>
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <BookOpen className="w-4 h-4" />
                Interactive Learning
              </div>
            </div>
          </div>

          <div className="text-center group">
            <div className="w-14 h-14 bg-slate-900/5 text-primary rounded-full flex items-center justify-center text-xl font-semibold mx-auto mb-4 group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6"/></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Track & Excel</h3>
            <p className="text-muted-foreground">
              Monitor your progress with detailed analytics, earn achievements, and watch your grades improve with data-driven insights.
            </p>
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <BarChart3 className="w-4 h-4" />
                Progress Analytics
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-6">See XENIA in Action</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Experience how XENIA transforms the way you study with our interactive demo. Watch as AI creates personalized learning paths and adapts to your progress.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Smart Topic Extraction</p>
                  <p className="text-sm text-muted-foreground">AI analyzes your syllabus and creates structured learning paths</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold">24/7 AI Tutoring</p>
                  <p className="text-sm text-muted-foreground">Get instant help with any concept or problem</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Adaptive Quizzes</p>
                  <p className="text-sm text-muted-foreground">Take personalized quizzes based on your learning progress</p>
                </div>
              </div>
            </div>

            <Button className="flex items-center gap-2 px-8 py-3 text-lg">
              <PlayCircle className="w-5 h-5" />
              Watch Full Demo
            </Button>
          </div>

          <div className="relative">
            {/* Demo Animation Container */}
            <div className="relative bg-card/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-100 dark:border-slate-800">
              {/* Floating Elements (subtle) */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-slate-900/6 rounded-full blur-lg"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-slate-900/4 rounded-full blur-lg" style={{opacity: 0.08}}></div>

              {/* Demo Content */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold">Live Demo: Study Plan Generation</h4>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Processing...
                  </Badge>
                </div>

                {/* Progress Steps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Syllabus Uploaded</p>
                      <p className="text-sm text-muted-foreground">Extracting topics from Computer Science syllabus...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">AI Analysis</p>
                      <p className="text-sm text-muted-foreground">Creating personalized learning path...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl opacity-60">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-muted-foreground text-sm font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Study Plan Ready</p>
                      <p className="text-sm text-muted-foreground">Generating your 4-week study schedule...</p>
                    </div>
                  </div>
                </div>

                {/* Result Preview */}
                <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <span className="font-semibold">AI Generated Plan</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Data Structures</span>
                      <span className="text-primary font-medium">Week 1-2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Algorithms</span>
                      <span className="text-primary font-medium">Week 2-3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System Design</span>
                      <span className="text-primary font-medium">Week 3-4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-8 md:px-16 lg:px-24 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  </span>
                  <span>Basic study planner</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  </span>
                  <span>Limited AI tutor interactions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  </span>
                  <span>Basic progress tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  </span>
                  <span>1 subject at a time</span>
                </li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground hover:shadow-lg transition-all relative overflow-hidden">
            <CardContent className="p-8">
              <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                POPULAR
              </Badge>
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-primary-foreground/80 mb-6">For serious students</p>
              <div className="text-4xl font-bold mb-6">$9.99<span className="text-lg font-normal text-primary-foreground/80">/month</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs">✓</span>
                  </span>
                  <span>Advanced study planner</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs">✓</span>
                  </span>
                  <span>Unlimited AI tutor</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs">✓</span>
                  </span>
                  <span>Detailed analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs">✓</span>
                  </span>
                  <span>Unlimited subjects</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs">✓</span>
                  </span>
                  <span>Teacher & parent features</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs">✓</span>
                  </span>
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href="/register?plan=premium">
                <Button variant="secondary" className="w-full">
                  Get Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-8 md:px-16 lg:px-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about XENIA.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              question: "How does XENIA create personalized study plans?",
              answer: "XENIA analyzes your syllabus, assessment results, and learning patterns to create a tailored study plan. It identifies your strengths and weaknesses, allocates more time to challenging topics, and adjusts dynamically as you progress."
            },
            {
              question: "Can I use XENIA for any subject?",
              answer: "Yes! XENIA works for any subject and educational level, from high school to university and professional certifications. The AI adapts to your specific field of study."
            },
            {
              question: "How does the AI tutor work?",
              answer: "The AI tutor can answer questions, explain concepts, and help you solve problems. You can send text questions or upload images of problems (using OCR technology), and the AI will provide detailed explanations and additional resources."
            },
            {
              question: "Can teachers and parents access my study data?",
              answer: "Only if you grant them permission. You can invite teachers to tag weak topics and provide guidance, and share progress reports with parents. You control who sees your data."
            },
            {
              question: "Is there a mobile app available?",
              answer: "Yes, XENIA is available on iOS and Android. The mobile app syncs with the web version, so you can access your study plan and AI tutor on the go."
            }
          ].map((faq, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-all">
              <CardContent className="p-6" onClick={() => toggleFaq(index)}>
                <div className="font-bold text-xl flex justify-between items-center">
                  {faq.question}
                  <span className="text-2xl">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </div>
                {openFaq === index && (
                  <div className="mt-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 md:py-20 md:px-12 lg:px-20 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Ready to Transform Your Learning?</h2>
        <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto opacity-90">
          Join thousands of students who are studying smarter, not harder, with XENIA.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button variant="secondary" size="lg" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-5 py-2.5">
              Get Started Free
            </Button>
          </Link>
          <Link href="#pricing">
            <Button variant="outline" size="lg" className="border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-all duration-300 px-5 py-2.5">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white py-12 px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <div className="mb-4">
              <Logo withText />
            </div>
            <p className="text-slate-700 dark:text-slate-300 mb-3 text-sm">
              Your AI-powered personal study planner and tutor.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/planner" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Study Planner</Link></li>
              <li><Link href="/tutor" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">AI Tutor</Link></li>
              <li><Link href="/analytics" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Analytics</Link></li>
              <li><Link href="/upload" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Upload</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Help Center</a></li>
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Contact Us</a></li>
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Documentation</a></li>
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">About</a></li>
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Privacy</a></li>
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Terms</a></li>
              <li><a href="#" className="text-white/80 dark:text-slate-900/80 hover:text-white dark:hover:text-slate-900 transition-all">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 dark:border-slate-900/20 pt-8 text-center">
          <p className="text-white/60 dark:text-slate-900/60">
            © 2024 XENIA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
