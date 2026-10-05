import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { orders } from "@/lib/mongodb";
import { SslcommerzGateway } from "@/lib/payments/sslcommerz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await (await orders()).findOne({
    id: orderId,
    userId: session.user.id,
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }

  try {
    const gateway = new SslcommerzGateway();
    const { redirectUrl } = await gateway.createSession(order);
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[sslcommerz/init]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Payment gateway unavailable", details: msg },
      { status: 500 }
    );
  }
}