import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">XENIA – AI Study Planner</h1>
      <p className="text-muted-foreground mb-8">Personalized study planning, AI tutor, analytics, and gamification.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link className="border rounded p-4 hover:bg-gray-50" href="/upload">Upload Syllabus/Assessment</Link>
        <Link className="border rounded p-4 hover:bg-gray-50" href="/planner">Adaptive Planner</Link>
        <Link className="border rounded p-4 hover:bg-gray-50" href="/tasks">Tasks & Sessions</Link>
        <Link className="border rounded p-4 hover:bg-gray-50" href="/tutor">AI Tutor</Link>
        <Link className="border rounded p-4 hover:bg-gray-50" href="/analytics">Analytics Dashboard</Link>
        <Link className="border rounded p-4 hover:bg-gray-50" href="/teacher">Teacher Tagging</Link>
        <Link className="border rounded p-4 hover:bg-gray-50" href="/parent">Parent Overview</Link>
      </div>
    </div>
  );
}
