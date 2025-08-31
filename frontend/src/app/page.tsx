import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">XENIA</h1>
        <ThemeToggle />
      </header>
      <section className="mb-10 space-y-3">
        <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">AI Study Planner</h2>
        <p className="text-muted-foreground max-w-2xl">Clean, bold, minimal UI that helps you plan, learn, and track progress. Inspired by Good Fight Creative.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/planner"><Button>Open Planner</Button></Link>
          <Link href="/tutor"><Button variant="secondary">Ask Tutor</Button></Link>
          <Link href="/upload"><Button variant="outline">Upload</Button></Link>
        </div>
      </section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link className="rounded-xl border p-5 hover:bg-accent transition" href="/upload">Upload Syllabus/Assessment</Link>
        <Link className="rounded-xl border p-5 hover:bg-accent transition" href="/planner">Adaptive Planner</Link>
        <Link className="rounded-xl border p-5 hover:bg-accent transition" href="/tasks">Tasks & Sessions</Link>
        <Link className="rounded-xl border p-5 hover:bg-accent transition" href="/tutor">AI Tutor</Link>
        <Link className="rounded-xl border p-5 hover:bg-accent transition" href="/analytics">Analytics Dashboard</Link>
        <Link className="rounded-xl border p-5 hover:bg-accent transition" href="/teacher">Teacher View</Link>
        <Link className="rounded-xl border p-5 hover:bg-accent transition" href="/parent">Parent View</Link>
      </div>
    </div>
  );
}
