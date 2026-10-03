"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { forgotPasswordSchema } from "@/lib/schemas/auth";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    if (!forgotPasswordSchema.safeParse(Object.fromEntries(formData.entries())).success) { setMessage("If that email is registered, we sent a reset link."); return; }
    const result = await forgotPasswordAction(formData);
    setMessage(result?.message ?? "If that email is registered, we sent a reset link.");
  }
  return <div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Account recovery</p><h1 className="display mt-2 text-3xl font-semibold">পাসওয়ার্ড রিসেট</h1><p className="mt-3 text-sm leading-6 text-foreground/60">আপনার ইমেইল লিখুন।</p><form action={submit} className="mt-7 grid gap-4"><label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label><button className="min-h-11 bg-foreground text-sm font-semibold text-background">Send reset link</button></form>{message && <p className="mt-5 text-sm text-success">{message}</p>}<Link href="/signin" className="mt-6 block text-center text-sm underline">Back to sign in</Link></div>;
}
