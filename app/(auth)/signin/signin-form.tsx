"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { signinSchema } from "@/lib/schemas/auth";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignInForm({ google, github }: { google: boolean; github: boolean }) {
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(formData: FormData) {
    const parsed = signinSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) { setError("Invalid email or password."); return; }
    const result = await signIn("credentials", { ...parsed.data, redirect: false });
    if (result?.error) setError("Invalid email or password.");
    else router.push("/account");
  }
  return <div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Welcome back</p><h1 className="display mt-2 text-3xl font-semibold">সাইন ইন করুন</h1><form action={submit} className="mt-7 grid gap-4"><label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label><label className="grid gap-2 text-sm font-medium">Password<input name="password" type="password" required minLength={8} className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label>{error && <p className="text-sm text-sale">{error}</p>}<SubmitButton pendingText="Signing in...">Sign in</SubmitButton></form>{(google || github) && <div className="mt-6 grid gap-2 border-t border-border pt-6">{google && <button onClick={() => signIn("google", { callbackUrl: "/account" })} className="min-h-11 border border-border text-sm">Continue with Google</button>}{github && <button onClick={() => signIn("github", { callbackUrl: "/account" })} className="min-h-11 border border-border text-sm">Continue with GitHub</button>}</div>}<div className="mt-6 flex justify-between text-sm text-foreground/60"><Link href="/register" className="underline">Create account</Link><Link href="/forgot-password" className="underline">Forgot password?</Link></div></div>;
}
