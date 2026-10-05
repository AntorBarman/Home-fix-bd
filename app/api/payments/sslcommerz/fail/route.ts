import { NextRequest, NextResponse } from "next/server";
import { orders } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = String(value);
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const { tran_id } = body;

  if (tran_id) {
    await (await orders()).updateOne(
      { orderNumber: tran_id },
      {
        $set: {
          paymentStatus: "failed",
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }

  return NextResponse.redirect(`${baseUrl}/checkout/fail?order=${tran_id ?? ""}`);
}