'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare,
  Download,
  Calendar,
  Clock,
  User,
  CheckCircle
} from 'lucide-react'

export default function SharePage() {
  const [shareUrl] = useState('https://xenia.app/share/abc123')
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sharedPlan = {
    title: "Sarah's Chemistry Study Plan",
    owner: "Sarah Johnson",
    subject: "Organic Chemistry",
    totalSessions: 12,
    completedSessions: 8,
    estimatedTime: 180,
    completedTime: 125,
    sessions: [
      {
        id: 1,
        topic: "Molecular Structures",
        focus: "Lewis Structures and VSEPR Theory",
        duration: 45,
        status: "completed",
        date: "2024-01-10"
      },
      {
        id: 2,
        topic: "Organic Reactions",
        focus: "Substitution and Elimination Reactions",
        duration: 60,
        status: "completed", 
        date: "2024-01-11"
      },
      {
        id: 3,
        topic: "Stereochemistry",
        focus: "Chirality and Optical Activity",
        duration: 45,
        status: "in-progress",
        date: "2024-01-12"
      }
    ]
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-6 px-8 md:px-16 lg:px-24 border-b border-border">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Plan Overview */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{sharedPlan.title}</h1>
                <p className="text-muted-foreground">Created by {sharedPlan.owner}</p>
                <Badge variant="outline" className="mt-2">{sharedPlan.subject}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold">{sharedPlan.completedSessions}/{sharedPlan.totalSessions}</p>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold">{sharedPlan.completedTime}min</p>
                <p className="text-sm text-muted-foreground">Time Studied</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold">{Math.round((sharedPlan.completedSessions / sharedPlan.totalSessions) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round((sharedPlan.completedSessions / sharedPlan.totalSessions) * 100)}%</span>
              </div>
              <Progress value={(sharedPlan.completedSessions / sharedPlan.totalSessions) * 100} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Study Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Study Sessions</CardTitle>
            <CardDescription>Detailed breakdown of the study plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharedPlan.sessions.map((session) => (
                <div key={session.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{session.topic}</h3>
                      <p className="text-sm text-muted-foreground">{session.focus}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={session.status === 'completed' ? 'success' : session.status === 'in-progress' ? 'warning' : 'secondary'}>
                        {session.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{session.duration} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.duration} minutes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Share Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share This Plan
            </CardTitle>
            <CardDescription>Share this study plan with others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button onClick={copyToClipboard}>
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Started CTA */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Want to create your own study plan?</h2>
            <p className="text-primary-foreground/80 mb-6">
              Join XENIA and get AI-powered personalized study plans tailored to your learning style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}