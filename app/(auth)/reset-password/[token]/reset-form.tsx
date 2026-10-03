"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/schemas/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) { setError("Unable to reset password."); return; }
    const result = await resetPasswordAction(formData);
    if (result?.error) setError(result.error);
  }
  return <div><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Account recovery</p><h1 className="display mt-2 text-3xl font-semibold">নতুন পাসওয়ার্ড</h1><form action={submit} className="mt-7 grid gap-4"><input type="hidden" name="token" value={token} /><label className="grid gap-2 text-sm font-medium">New password<input name="password" type="password" minLength={8} required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label><label className="grid gap-2 text-sm font-medium">Confirm password<input name="confirmPassword" type="password" minLength={8} required className="min-h-11 border border-border bg-background px-3 outline-none focus:border-foreground" /></label>{error && <p className="text-sm text-sale">{error}</p>}<button className="min-h-11 bg-foreground text-sm font-semibold text-background">Set new password</button></form></div>;
}
