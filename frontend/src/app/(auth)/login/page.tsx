"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useErrorContext } from "@/lib/error-context";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const { pushError } = useErrorContext();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof LoginSchema>>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
      if (error) {
        pushError({ errorCode: "AUTH_401", errorMessage: error.message });
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Login</h2>
        <Input type="email" placeholder="Email" aria-label="Email" {...form.register("email")} />
        {form.formState.errors.email && <p className="text-red-600 text-sm">{form.formState.errors.email.message}</p>}
        <Input type="password" placeholder="Password" aria-label="Password" {...form.register("password")} />
        {form.formState.errors.password && <p className="text-red-600 text-sm">{form.formState.errors.password.message}</p>}
        <Button disabled={loading} type="submit">Sign in</Button>
      </form>
    </div>
  );
}

