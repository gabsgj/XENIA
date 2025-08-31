"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorContext } from "@/lib/error-context";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["student", "teacher", "parent"]),
});

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  const { pushError } = useErrorContext();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof RegisterSchema>>({ resolver: zodResolver(RegisterSchema), defaultValues: { role: "student" } });

  async function onSubmit(values: z.infer<typeof RegisterSchema>) {
    setLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const supabase = await getSupabaseClient();
      const { error, data } = await supabase.auth.signUp({ email: values.email, password: values.password });
      if (error || !data.user) {
        pushError({ errorCode: "AUTH_422", errorMessage: error?.message || "Could not register" });
        return;
      }
      // Optionally set role in profile table via RPC or client-side state in onboarding
      router.push("/onboarding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Create account</h2>
        <Input type="email" placeholder="Email" aria-label="Email" {...form.register("email")} />
        {form.formState.errors.email && <p className="text-red-600 text-sm">{form.formState.errors.email.message}</p>}
        <Input type="password" placeholder="Password" aria-label="Password" {...form.register("password")} />
        {form.formState.errors.password && <p className="text-red-600 text-sm">{form.formState.errors.password.message}</p>}
        <div>
          <Label className="mb-2 block">Role</Label>
          <select className="border p-2 rounded w-full" aria-label="Role" {...form.register("role")}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        <Button disabled={loading} type="submit">Register</Button>
      </form>
    </div>
  );
}

