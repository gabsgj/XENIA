"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorContext } from "@/lib/error-context";

export default function ContentCreationTools() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { pushError } = useErrorContext();

  async function generateQuestions() {
    setLoading(true);
    try {
      const resp = await api("/api/quiz/generate", {
        method: "POST",
        body: JSON.stringify({
          topics: [topic],
          num_questions: numQuestions,
          options_count: 4,
        }),
      });
      setQuestions(resp.quiz?.questions || []);
    } catch (e: any) {
      pushError({
        errorCode: e?.errorCode || "GEN_500",
        errorMessage: e?.errorMessage || "Failed to generate questions",
        details: e,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>AI Content Creation Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            placeholder="e.g., Calculus"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numQuestions">Number of Questions</Label>
          <Input
            id="numQuestions"
            type="number"
            min={1}
            max={20}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />
        </div>
        <Button onClick={generateQuestions} disabled={loading || !topic}>
          {loading ? "Generating..." : "Generate Practice Questions"}
        </Button>
        {questions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Generated Questions</h3>
            {questions.map((q, idx) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="font-semibold mb-2">Q{idx + 1}: {q.question}</div>
                <ul className="list-disc ml-6">
                  {q.options.map((opt: string, oidx: number) => (
                    <li key={oidx}>{opt}</li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-muted-foreground">
                  Correct Answer: {q.options[q.correct_index]}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
