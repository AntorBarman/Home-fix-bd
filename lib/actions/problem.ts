"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { classifyProblem } from "@/lib/problem";
import { loadCatalog } from "@/lib/catalog";
import { problemReports } from "@/lib/mongodb";
import { requireUser } from "@/lib/rbac";

export async function submitProblemAction(formData: FormData) {
  const session = await requireUser();
  const text = String(formData.get("text") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const files = formData.getAll("media").filter((value): value is File => value instanceof File && value.size > 0);
  if (text.length < 5 || !/^01[3-9]\d{8}$/.test(phone) || files.length > 4 || files.some((file) => file.size > 5 * 1024 * 1024)) return { error: "Please provide a valid problem, phone, and files under 5MB." };
  const result = classifyProblem(text, (await loadCatalog()).services);
  const id = randomUUID();
  await (await problemReports()).insertOne({ id, customerId: session.user.id, text, address, phone, mediaUrls: files.map((file) => file.name), ...result, createdAt: new Date().toISOString() });
  redirect(`/problem-solver/result?id=${id}`);
}
