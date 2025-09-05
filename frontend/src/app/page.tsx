"use client";

import Link from "next/link";
import Image from "next/image";
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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-6 px-8 md:px-16 lg:px-24 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">X</span>
          </div>
          <h1 className="font-bold text-2xl tracking-tighter">XENIA</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium hover:underline transition-all">Features</a>
          <a href="#how-it-works" className="text-sm font-medium hover:underline transition-all">How it Works</a>
          <a href="#pricing" className="text-sm font-medium hover:underline transition-all">Pricing</a>
          <a href="#faq" className="text-sm font-medium hover:underline transition-all">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium hover:underline transition-all">Log in</Link>
          <Link href="/register">
            <Button>Sign up</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-8 md:px-16 lg:px-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <Badge variant="secondary" className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-medium">
            AI-Powered Education
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight">
            Your Personal 
            <span className="text-primary relative ml-2">
              AI Study
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 180 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5C36.5 2 72 1 180 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span> 
            <br/>Planner
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Generate personalized study plans, get help from AI tutors, and track your progress with powerful analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <Image src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwxfHx1c2VyfGVufDB8fHx8MTc1NjU5ODQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080" alt="User" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-background" />
              <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwyfHx1c2VyfGVufDB8fHx8MTc1NjU5ODQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080" alt="User" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-background" />
              <Image src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyNDZ8MHwxfHNlYXJjaHwzfHx1c2VyfGVufDB8fHx8MTc1NjU5ODQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080" alt="User" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-background" />
            </div>
            <p className="text-sm text-muted-foreground">Trusted by 10,000+ students worldwide</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full opacity-50 blur-3xl"></div>
          <Card className="relative border shadow-lg transform transition-all hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Today's Study Plan</h3>
                <Badge variant="success">On Track</Badge>
              </div>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Organic Chemistry</h4>
                    <span className="text-xs text-muted-foreground">45 min</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Calculus - Derivatives</h4>
                    <span className="text-xs text-muted-foreground">30 min</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{width: '30%'}}></div>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Physics - Kinematics</h4>
                    <span className="text-xs text-muted-foreground">60 min</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6">
                View Full Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-8 md:px-16 lg:px-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Key Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            XENIA combines artificial intelligence with proven learning techniques to help you study smarter, not harder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Personalized Study Planner</h3>
              <p className="text-muted-foreground">
                AI-generated study schedules based on your syllabus, assessment results, and learning patterns.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Tutor</h3>
              <p className="text-muted-foreground">
                Get instant help with difficult concepts, solve doubts with OCR support, and receive targeted recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Assessments</h3>
              <p className="text-muted-foreground">
                Upload your test results to identify knowledge gaps and automatically adjust your study plan.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Progress Analytics</h3>
              <p className="text-muted-foreground">
                Visualize your learning journey with intuitive charts, mastery heatmaps, and performance insights.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Gamification</h3>
              <p className="text-muted-foreground">
                Stay motivated with XP, levels, achievements, and streaks that make studying more engaging.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Teacher & Parent Support</h3>
              <p className="text-muted-foreground">
                Allow teachers to tag weak topics and share progress reports with parents for comprehensive support.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter mb-4">What Students Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from students who have transformed their study habits with XENIA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-lg mb-6">&quot;XENIA helped me organize my study time and focus on my weak areas. I improved my grades by 15% in just one semester!&quot;</p>
              <div className="flex items-center gap-4">
                <Image src="https://images.unsplash.com/photo-1614544048536-0d28caf77f41" alt="Sarah J." width={48} height={48} className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-bold">Sarah J.</h4>
                  <p className="text-sm text-muted-foreground">Medical Student</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-lg mb-6">&quot;The AI tutor is like having a personal teacher available 24/7. It explains difficult concepts in a way I can understand.&quot;</p>
              <div className="flex items-center gap-4">
                <Image src="https://images.unsplash.com/photo-1620477403960-4188fdd7cee0" alt="Michael T." width={48} height={48} className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-bold">Michael T.</h4>
                  <p className="text-sm text-muted-foreground">High School Student</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-lg mb-6">&quot;As a teacher, I can see which topics my students struggle with and provide targeted help. XENIA has transformed my classroom.&quot;</p>
              <div className="flex items-center gap-4">
                <Image src="https://images.unsplash.com/photo-1741880295874-72b665807375" alt="Linda M." width={48} height={48} className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-bold">Linda M.</h4>
                  <p className="text-sm text-muted-foreground">Physics Teacher</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-8 md:px-16 lg:px-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter mb-4">How XENIA Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A simple four-step process to transform your learning experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
            <h3 className="text-xl font-bold mb-2">Upload Your Syllabus</h3>
            <p className="text-muted-foreground">
              Start by uploading your course materials and setting your exam dates.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
            <h3 className="text-xl font-bold mb-2">Complete Assessments</h3>
            <p className="text-muted-foreground">
              Take initial assessments to identify your strengths and weaknesses.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
            <h3 className="text-xl font-bold mb-2">Follow Your Plan</h3>
            <p className="text-muted-foreground">
              Get a personalized study schedule that adapts to your progress.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">4</div>
            <h3 className="text-xl font-bold mb-2">Track & Improve</h3>
            <p className="text-muted-foreground">
              Monitor your progress and adjust your approach based on insights.
            </p>
          </div>
        </div>

        <Card className="mt-16 bg-muted/30">
          <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">See XENIA in Action</h3>
              <p className="text-muted-foreground mb-6">
                Watch a quick demo of how XENIA can revolutionize your study routine and help you achieve your academic goals.
              </p>
              <Button className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            <div className="md:w-1/2 bg-card rounded-xl overflow-hidden border shadow-lg">
              <Image src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc" alt="XENIA Demo" width={800} height={256} className="w-full h-64 object-cover" />
            </div>
          </CardContent>
        </Card>
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
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-primary text-primary-foreground text-center">
        <h2 className="text-4xl font-bold tracking-tighter mb-6">Ready to Transform Your Learning?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Join thousands of students who are studying smarter, not harder, with XENIA.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Get Started Free
            </Button>
          </Link>
          <Link href="#pricing">
            <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16 px-8 md:px-16 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-primary-foreground rounded flex items-center justify-center">
                <span className="text-primary font-bold text-xs">X</span>
              </div>
              <h1 className="font-bold text-xl tracking-tighter">XENIA</h1>
            </div>
            <p className="text-primary-foreground/80 mb-4">
              Your AI-powered personal study planner and tutor.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/planner" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Study Planner</Link></li>
              <li><Link href="/tutor" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">AI Tutor</Link></li>
              <li><Link href="/analytics" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Analytics</Link></li>
              <li><Link href="/upload" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Upload</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Help Center</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Contact Us</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Documentation</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">About</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Privacy</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Terms</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-all">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-primary-foreground/60">
            © 2024 XENIA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
