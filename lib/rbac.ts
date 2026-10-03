import "server-only";

import { auth } from "@/auth";
import { users } from "@/lib/mongodb";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) throw new Error("Unauthorized");
  return session;
}

export async function requireTechnician() {
  const session = await requireUser();
  if (session.user.role !== "technician") throw new Error("Unauthorized");
  return session;
}

export async function requireSeller() {
  const session = await requireUser();
  if (session.user.role !== "seller") throw new Error("Unauthorized");
  return session;
}

export async function getUserByEmail(email: string) {
  return (await users()).findOne({ email: email.toLowerCase() });
}
