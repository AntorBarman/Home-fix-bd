import "server-only";

import { auth } from "@/auth";
import { users } from "@/lib/mongodb";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

export async function requireTechnician() {
  const session = await requireUser();
  if (session.user.role !== "technician") {
    redirect("/");
  }
  return session;
}

export async function requireSeller() {
  const session = await requireUser();
  if (session.user.role !== "seller") {
    redirect("/");
  }
  return session;
}

export async function getUserByEmail(email: string) {
  return (await users()).findOne({ email: email.toLowerCase() });
}
