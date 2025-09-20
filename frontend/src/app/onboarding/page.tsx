"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Target, Calendar, TrendingUp } from "lucide-react";

const Schema = z.object({
  weeklyHours: z.number().min(1).max(80),
  examDate: z.string().min(8),
  attentionSpan: z.number().min(10).max(120),
  confidence: z.number().min(1).max(10),
});

export default function OnboardingPage(){
  const [step, setStep] = useState(1);
  const router = useRouter();
  const form = useForm<z.infer<typeof Schema>>({ 
    resolver: zodResolver(Schema), 
    defaultValues: { weeklyHours: 10, attentionSpan: 30, confidence: 5 } 
  });

  function next(){ setStep(s=> Math.min(4, s+1)) }
  function prev(){ setStep(s=> Math.max(1, s-1)) }
  async function finish(){ router.push('/upload') }

  const steps = [
    {
      title: "Study Schedule",
      description: "How many hours per week can you dedicate to studying?",
      icon: Clock
    },
    {
      title: "Exam Date",
      description: "When is your next major exam or assessment?",
      icon: Calendar
    },
    {
      title: "Focus Time",
      description: "How long can you typically focus in one session?",
      icon: Target
    },
    {
      title: "Confidence Level",
      description: "Rate your current confidence in the subject",
      icon: TrendingUp
    }
  ];

  const currentStep = steps[step - 1];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">X</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">XENIA</span>
          </Link>
          <p className="text-muted-foreground">Let&apos;s personalize your study experience</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{currentStep.title}</CardTitle>
            <CardDescription>
              {currentStep.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {step} of 4</span>
                <span>{Math.round((step / 4) * 100)}%</span>
              </div>
              <Progress value={(step / 4) * 100} className="h-2" />
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="weeklyHours">Weekly study hours</Label>
                  <Input 
                    id="weeklyHours"
                    type="number" 
                    min="1" 
                    max="80"
                    placeholder="e.g., 10"
                    {...form.register('weeklyHours', { valueAsNumber: true })} 
                  />
                  <p className="text-xs text-muted-foreground">
                    Include time for lectures, homework, and self-study
                  </p>
                </div>
                <Button onClick={next} className="w-full" size="lg">
                  Next
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="examDate">Next exam date</Label>
                  <Input 
                    id="examDate"
                    type="date" 
                    {...form.register('examDate')} 
                  />
                  <p className="text-xs text-muted-foreground">
                    This helps us create a timeline for your study plan
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={prev} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={next} className="flex-1">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="attentionSpan">Focus duration (minutes)</Label>
                  <Input 
                    id="attentionSpan"
                    type="number" 
                    min="10" 
                    max="120"
                    placeholder="e.g., 30"
                    {...form.register('attentionSpan', { valueAsNumber: true })} 
                  />
                  <p className="text-xs text-muted-foreground">
                    How long can you focus without a break?
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={prev} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={next} className="flex-1">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="confidence">Confidence level (1-10)</Label>
                  <Input 
                    id="confidence"
                    type="number" 
                    min="1" 
                    max="10"
                    placeholder="e.g., 5"
                    {...form.register('confidence', { valueAsNumber: true })} 
                  />
                  <p className="text-xs text-muted-foreground">
                    Rate your current understanding of the subject
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={prev} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={finish} className="flex-1">
                    Complete Setup
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-6">
          <button 
            onClick={() => router.push('/upload')}
            className="text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}

