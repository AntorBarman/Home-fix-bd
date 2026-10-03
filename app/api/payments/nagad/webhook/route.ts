import { NextResponse } from "next/server";
import { NagadGateway } from "@/lib/payments/nagad";
import { fulfillPayment } from "@/lib/payments/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? req.headers.get("x-webhook-signature") ?? "";
  if (!new NagadGateway().verifyWebhook(rawBody, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let payload: { paymentId?: string; orderNumber?: string };
  try { payload = JSON.parse(rawBody) as typeof payload; } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }
  if (!payload.paymentId || !payload.orderNumber) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const result = await fulfillPayment("nagadPaymentId", payload.paymentId, payload.orderNumber);
  if (result.missing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ received: true, ...(result.noop ? { noop: true } : {}) });
}
