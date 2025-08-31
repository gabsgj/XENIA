import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
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
            <Link href="/planner">
              <Button variant="outline" className="w-full mt-6">
                View Full Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}