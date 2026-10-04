"use client";

import Link from "next/link";
import { useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { registerSchema } from "@/lib/schemas/auth";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm() {
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    const parsed = registerSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) { setError("Please check your details."); return; }
    const result = await registerAction(formData);
    if (result?.error) setError(result.error);
  }
  return <div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Join HomeFix BD</p><h1 className="display mt-2 text-3xl font-semibold">অ্যাকাউন্ট তৈরি করুন</h1><form action={submit} className="mt-7 grid gap-4"><fieldset className="grid gap-3"><legend className="text-sm font-medium">আপনি কী করতে চান? / Choose your role</legend>{[["customer","Customer","আমি সেবা বা পণ্য কিনতে চাই","I want to buy services or products"],["technician","Technician","আমি সেবা প্রদান করি","I provide home services"],["seller","Seller","আমি পণ্য বিক্রি করি","I sell products"]].map(([value, label, bn, en], index) => <label key={value} className="flex gap-3 border border-border p-3"><input type="radio" name="role" value={value} defaultChecked={index === 0} required /><span><strong>{label}</strong><span className="block text-xs text-foreground/60">{bn}<br />{en}</span></span></label>)}</fieldset><label className="grid gap-2 text-sm font-medium">Name<input name="name" required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label><label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label><label className="grid gap-2 text-sm font-medium">Phone<input name="phone" placeholder="017XXXXXXXX" required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label><label className="grid gap-2 text-sm font-medium">Password<input name="password" type="password" minLength={8} required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label><label className="grid gap-2 text-sm font-medium">Confirm password<input name="confirmPassword" type="password" minLength={8} required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label>{error && <p className="text-sm text-sale">{error}</p>}<SubmitButton pendingText="Creating account...">Create account</SubmitButton></form><p className="mt-6 text-center text-sm text-foreground/60">Already registered? <Link href="/signin" className="underline">Sign in</Link></p></div>;
}
