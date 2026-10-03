"use server";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { sellers, technicians, users } from "@/lib/mongodb";
import { forgotPasswordSchema, registerSchema, resetPasswordSchema } from "@/lib/schemas/auth";

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: "Please check your details." };
  const input = parsed.data;
  const collection = await users();
  const email = input.email.toLowerCase();
  if (await collection.findOne({ email })) return { error: "Unable to create this account." };
  const user = { email, name: input.name, phone: input.phone, passwordHash: await hash(input.password, 10), role: input.role, addresses: [], createdAt: new Date().toISOString() };
  const result = await collection.insertOne(user);
  const now = new Date().toISOString();
  if (input.role === "technician") {
    await (await technicians()).insertOne({
      userId: result.insertedId.toString(), id: `tech-${result.insertedId.toString().slice(-8)}`,
      name: input.name, nameBn: input.name, phone: input.phone, photo: "/homefix-bd/technicians/placeholder.webp",
      verified: false, verificationStatus: "pending", experienceYears: 0, skills: [], serviceAreas: [],
      rating: 0, completedJobs: 0, reviews: [], visitCharge: 0, availability: [], walletBalance: 0,
      active: true, createdAt: now,
    });
  } else if (input.role === "seller") {
    await (await sellers()).insertOne({
      userId: result.insertedId.toString(), businessName: input.name, ownerName: input.name, phone: input.phone,
      address: {}, verified: false, verificationStatus: "pending", active: true, createdAt: now,
    });
  }
  if (input.role === "technician") {
    await signIn("credentials", { email, password: input.password, redirectTo: "/technician/profile?onboarding=1" });
    redirect("/technician/profile?onboarding=1");
  }
  if (input.role === "seller") {
    await signIn("credentials", { email, password: input.password, redirectTo: "/seller/settings?onboarding=1" });
    redirect("/seller/settings?onboarding=1");
  }
  await signIn("credentials", { email, password: input.password, redirectTo: "/account" });
  redirect("/account");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) return { message: "If that email is registered, we sent a reset link." };
  const email = parsed.data.email.toLowerCase();
  const collection = await users();
  const user = await collection.findOne({ email });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await collection.updateOne({ _id: user._id }, { $set: { passwordReset: { tokenHash, expiresAt } } });
    console.log(`[auth] Password reset URL: ${process.env.AUTH_URL ?? "http://localhost:3000"}/reset-password/${token}`);
  }
  return { message: "If that email is registered, we sent a reset link." };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: "Unable to reset password." };
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const collection = await users();
  const candidates = await collection.find({ "passwordReset.tokenHash": tokenHash }).toArray();
  const user = candidates.find((candidate) => {
    if (!("passwordReset" in candidate)) return false;
    const passwordReset = candidate.passwordReset as { tokenHash?: string; expiresAt: string } | undefined;
    const stored = passwordReset?.tokenHash;
    if (!stored || stored.length !== tokenHash.length) return false;
    return timingSafeEqual(Buffer.from(stored), Buffer.from(tokenHash)) && new Date(passwordReset.expiresAt) > new Date();
  });
  if (!user) return { error: "Unable to reset password." };
  await collection.updateOne({ _id: user._id }, { $set: { passwordHash: await hash(parsed.data.password, 10) }, $unset: { passwordReset: "" } });
  redirect("/signin");
}
