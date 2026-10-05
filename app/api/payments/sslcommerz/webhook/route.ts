import { NextRequest, NextResponse } from "next/server";
import { SslcommerzGateway } from "@/lib/payments/sslcommerz";
import { fulfillPayment } from "@/lib/payments/fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSLCOMMERZ IPN Webhook handler.
 *
 * SSLCOMMERZ posts form-encoded data (application/x-www-form-urlencoded)
 * with `verify_sign` and `verify_key` fields for MD5 verification.
 *
 * Flow:
 *  1. Parse form-data from request
 *  2. Verify MD5 signature
 *  3. Validate transaction with SSLCOMMERZ server
 *  4. Fulfill payment (idempotent)
 *  5. Return JSON — no redirect
 */
export async function POST(req: NextRequest) {
  // ─── 1. Parse form-data ───────────────────────────
  let body: Record<string, string> = {};

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    formData.forEach((value, key) => {
      body[key] = String(value);
    });
  } else if (contentType.includes("application/json")) {
    // Fallback for testing
    body = (await req.json()) as Record<string, string>;
  } else {
    // Last resort: try URL-encoded text
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    params.forEach((value, key) => {
      body[key] = value;
    });
  }

  console.log("[sslcommerz/webhook] received:", body.tran_id, body.status);

  // ─── 2. Verify MD5 signature ──────────────────────
  const gateway = new SslcommerzGateway();

  if (!gateway.verifySignature(body)) {
    console.error("[sslcommerz/webhook] invalid signature");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  const { tran_id, val_id } = body;

  if (!tran_id || !val_id) {
    console.error("[sslcommerz/webhook] missing tran_id or val_id");
    return NextResponse.json(
      { error: "Missing paymentId or orderNumber" },
      { status: 400 }
    );
  }

  // ─── 3. Server-side validation ────────────────────
  const validation = await gateway.validateTransaction(val_id);

  if (!validation.valid) {
    console.error("[sslcommerz/webhook] validation failed for", val_id);
    return NextResponse.json(
      { error: "Transaction validation failed" },
      { status: 400 }
    );
  }

  // ─── 4. Fulfill (idempotent) ──────────────────────
  const result = await fulfillPayment(
    "sslcommerzTxnId",
    val_id,      // paymentId — SSLCOMMERZ val_id
    tran_id      // orderNumber
  );

  if (result.missing) {
    console.error("[sslcommerz/webhook] order not found:", tran_id);
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  console.log(
    "[sslcommerz/webhook] fulfilled:",
    tran_id,
    result.noop ? "(noop - already paid)" : ""
  );

  // ─── 5. Return JSON — no redirect ─────────────────
  return NextResponse.json({
    received: true,
    ...(result.noop ? { noop: true } : {}),
  });
}