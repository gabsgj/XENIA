"use client";

import React, { useState } from "react";
import axios from "axios";
import Card from "@/components/Card";
import Pill from "@/components/Pill";

const DURATIONS = [5, 10, 15, 30, 60, 120];

const DEFAULT_TOPICS = [
  "Linear Algebra",
  "Calculus",
  "Machine Learning",
  "Physics",
  "Chemistry",
  "Biology",
];

import { getUserId } from "@/lib/api";

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

  const handleStartQuiz = async () => {
    try {
      const resp = await axios.post("/api/quiz/generate", {
        user_id: getRealUserId(), // Use the real user ID
        topics: selectedTopics,
        num_questions: numQuestions,
        options_count: 4,
        duration,
        user_profile: userProfile,
        syllabus,
      });
      setQuiz(resp.data.quiz);
      setAnswers(Array(resp.data.quiz.questions.length).fill(-1));
      setStep("quiz");
    } catch (err) {
      console.error("Failed to generate quiz", err);
      alert("Failed to generate quiz. Try again later.");
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const resp = await axios.post("/api/quiz/submit", {
        quiz,
        user_answers: answers,
      });
      setStats(resp.data.stats);
      setStep("results");
    } catch (err) {
      console.error("Failed to submit quiz", err);
      alert("Failed to submit quiz. Try again later.");
    }
  };

  if (step === "setup") {
    return (
      <main className="max-w-3xl mx-auto p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">Quiz Me</h1>
          <div className="text-sm text-muted-foreground">
            Quick practice quizzes tailored to your syllabus
          </div>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                User Profile (optional)
              </label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 bg-transparent transition-shadow duration-150 focus:shadow-outline"
                value={userProfile}
                onChange={(e) => setUserProfile(e.target.value)}
                placeholder="e.g. Grade 10, prefers visual learning"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Syllabus (optional)
              </label>
              <textarea
                className="w-full rounded-md border px-3 py-2 bg-transparent min-h-[80px] transition-shadow duration-150 focus:shadow-outline"
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Paste a short syllabus or topics, e.g. Algebra, Calculus, ML basics"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Select Topics
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_TOPICS.map((topic) => (
                  <Pill
                    key={topic}
                    active={selectedTopics.includes(topic)}
                    onClick={() =>
                      setSelectedTopics((prev) =>
                        prev.includes(topic)
                          ? prev.filter((t) => t !== topic)
                          : [...prev, topic]
                      )
                    }
                  >
                    {topic}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Duration</label>
                <select
                  className="w-full rounded-md border px-3 py-2 bg-transparent transition-shadow duration-150 focus:shadow-outline"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="w-full rounded-md border px-3 py-2 bg-transparent transition-shadow duration-150 focus:shadow-outline"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleStartQuiz}
                disabled={selectedTopics.length === 0 || numQuestions < 1}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold disabled:opacity-50 transition-transform duration-150 active:scale-95"
              >
                Start Quiz
              </button>

              <button
                onClick={() => {
                  setSelectedTopics([]);
                  setUserProfile("");
                  setSyllabus("");
                  setNumQuestions(5);
                  setDuration(10);
                }}
                className="px-3 py-2 rounded-md border text-sm transition-colors duration-150 hover:bg-gray-50"
              >
                Reset
              </button>

              <div className="ml-auto text-sm text-muted-foreground">
                Tip: Select 2-4 topics for a focused quiz
              </div>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  if (step === "quiz" && quiz) {
    return (
      <main className="max-w-3xl mx-auto p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Quiz</h1>
          <div className="text-sm text-muted-foreground">
            {quiz.duration} min
          </div>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((q: any, idx: number) => (
            <Card key={idx} className="">
              <div className="flex items-start gap-4">
                <div className="text-muted-foreground font-semibold">
                  Q{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-2">{q.question}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt: string, oidx: number) => (
                      <button
                        key={oidx}
                        onClick={() => {
                          const newAnswers = [...answers];
                          newAnswers[idx] = oidx;
                          setAnswers(newAnswers);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md border transition-all duration-150 transform ${
                          answers[idx] === oidx
                            ? "bg-primary text-primary-foreground border-primary scale-102 shadow-md"
                            : "bg-gray-50 hover:translate-y-0.5"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <div className="flex gap-3">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md font-bold transition-transform duration-150 active:scale-95"
              onClick={handleSubmitQuiz}
            >
              Submit Quiz
            </button>

            <button
              className="px-3 py-2 rounded-md border transition-colors duration-150 hover:bg-gray-50"
              onClick={() => setStep("setup")}
            >
              Cancel
            </button>

            <div className="ml-auto text-sm text-muted-foreground">
              {quiz.questions.length} questions
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (step === "results" && stats) {
    return (
      <main className="max-w-3xl mx-auto p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Results</h1>
          <div className="text-sm text-muted-foreground">
            Score: {stats.correct}/{stats.correct + stats.wrong}
          </div>
        </div>

        <div className="space-y-4">
          {stats.feedback.map((fb: any, idx: number) => (
            <Card key={idx}>
              <div className="font-semibold mb-2">
                Q{idx + 1}. {fb.question}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fb.options.map((opt: string, oidx: number) => {
                  let style = "bg-gray-50";
                  if (oidx === fb.correct_index) style = "bg-green-100 border-green-400";
                  if (oidx === fb.user_answer && !fb.is_correct) style = "bg-red-100 border-red-400";
                  return (
                    <div key={oidx} className={`px-3 py-2 rounded-md border ${style} transition-all duration-150`}>
                      {opt}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2">
                {fb.is_correct ? (
                  <span className="text-green-700 font-bold">Correct</span>
                ) : (
                  <span className="text-red-700 font-bold">Wrong</span>
                )}
              </div>
            </Card>
          ))}

          <div className="flex gap-3">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md font-bold transition-transform duration-150 active:scale-95"
              onClick={() => setStep("setup")}
            >
              Try Another Quiz
            </button>

            <button
              className="px-3 py-2 rounded-md border transition-colors duration-150 hover:bg-gray-50"
              onClick={() => window.history.back()}
            >
              Return
            </button>

            <div className="ml-auto text-sm text-muted-foreground">
              Reviewed {stats.feedback.length} items
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
