"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const Schema = z.object({
  weeklyHours: z.number().min(1).max(80),
  examDate: z.string().min(8),
  attentionSpan: z.number().min(10).max(120),
  confidence: z.number().min(1).max(10),
});

export default function OnboardingPage(){
  const [step, setStep] = useState(1);
  const router = useRouter();
  const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { weeklyHours: 10, attentionSpan: 30, confidence: 5 } as any });

  function next(){ setStep(s=> Math.min(4, s+1)) }
  function prev(){ setStep(s=> Math.max(1, s-1)) }
  async function finish(){ router.push('/dashboard') }

  return (
    <div className="min-h-[60vh] max-w-xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6" aria-label="progress">
        {[1,2,3,4].map(i=> (
          <div key={i} className={`h-2 flex-1 rounded-full ${i<=step? 'bg-foreground' : 'bg-muted'}`} />
        ))}
      </div>
      {step===1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Weekly study hours</h2>
          <Input type="number" {...form.register('weeklyHours', { valueAsNumber:true })} />
          <Button onClick={next}>Next</Button>
        </div>
      )}
      {step===2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Exam date</h2>
          <Input type="date" {...form.register('examDate')} />
          <div className="flex gap-2"><Button variant="secondary" onClick={prev}>Back</Button><Button onClick={next}>Next</Button></div>
        </div>
      )}
      {step===3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Attention span (minutes)</h2>
          <Input type="number" {...form.register('attentionSpan', { valueAsNumber:true })} />
          <div className="flex gap-2"><Button variant="secondary" onClick={prev}>Back</Button><Button onClick={next}>Next</Button></div>
        </div>
      )}
      {step===4 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Confidence (1-10)</h2>
          <Input type="number" {...form.register('confidence', { valueAsNumber:true })} />
          <div className="flex gap-2"><Button variant="secondary" onClick={prev}>Back</Button><Button onClick={finish}>Finish</Button></div>
        </div>
      )}
    </div>
  )
}

