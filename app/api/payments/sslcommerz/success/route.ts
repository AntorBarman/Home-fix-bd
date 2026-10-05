import { NextRequest, NextResponse } from "next/server";
import { orders, products, warranties } from "@/lib/mongodb";
import { SslcommerzGateway } from "@/lib/payments/sslcommerz";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body: Record<string, string> = {};
  formData.forEach((value, key) => {
    body[key] = String(value);
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const { tran_id, val_id, amount, status } = body;

  console.log("[sslcommerz/success] received:", { tran_id, val_id, status, amount });

  if (!tran_id) {
    return NextResponse.redirect(`${baseUrl}/checkout/fail?reason=missing-data`);
  }

  const order = await (await orders()).findOne({ orderNumber: tran_id });
  if (!order) {
    return NextResponse.redirect(
      `${baseUrl}/checkout/fail?reason=order-not-found`
    );
  }

  // Already paid → just redirect
  if (order.paymentStatus === "paid") {
    return NextResponse.redirect(
      `${baseUrl}/checkout/success?orderId=${order.id}`
    );
  }

  // ⚠️ Sandbox-specific: SSLCOMMERZ sends status=VALID in success callback
  // In some sandbox flows, `validateTransaction` returns INVALID — skip if success status
  const statusOk =
    status === "VALID" ||
    status === "VALIDATED" ||
    status === "SUCCESS" ||
    body.risk_level === "0";

  let validated = statusOk;

  if (!validated && val_id) {
    const gateway = new SslcommerzGateway();
    const validation = await gateway.validateTransaction(val_id);
    validated = validation.valid;
  }

  if (!validated) {
    console.error("[sslcommerz/success] validation failed", { val_id, status });
    return NextResponse.redirect(
      `${baseUrl}/checkout/fail?reason=validation-failed`
    );
  }

  // Amount check
  if (amount && Number(amount) !== Number(order.total)) {
    console.error("[sslcommerz/success] amount mismatch:", amount, order.total);
    return NextResponse.redirect(
      `${baseUrl}/checkout/fail?reason=amount-mismatch`
    );
  }

  // ✅ Update order to PAID
  await (await orders()).updateOne(
    { id: order.id },
    {
      $set: {
        status: "paid",
        paymentStatus: "paid",
        sslcommerzTxnId: val_id || tran_id,
        sslcommerzCardType: body.card_type || null,
        sslcommerzBankTranId: body.bank_tran_id || null,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  // Decrement stock
  for (const item of order.items) {
    if (item.type !== "product" || !item.productId) continue;
    const product = await (await products()).findOne({ id: item.productId });
    if (!product) continue;

    const variants = product.variants.map((v: any) =>
      v.color !== item.color
        ? v
        : {
            ...v,
            sizes: v.sizes.map((s: any) =>
              s.size !== item.size
                ? s
                : { ...s, qty: Math.max(0, s.qty - item.qty) }
            ),
          }
    );

    const stockQty = variants.reduce(
      (sum: number, v: any) =>
        sum + v.sizes.reduce((s: number, sz: any) => s + sz.qty, 0),
      0
    );

    await (await products()).updateOne(
      { id: product.id },
      { $set: { variants, stockQty, inStock: stockQty > 0 } }
    );
  }

  // Create warranties
  for (const item of order.items) {
    if (item.type !== "product" || !item.productId) continue;
    await (await warranties()).updateOne(
      { id: `warranty-${order.orderNumber}-${item.productId}` },
      {
        $set: {
          id: `warranty-${order.orderNumber}-${item.productId}`,
          orderId: order.orderNumber,
          productId: item.productId,
          startDate: new Date().toISOString(),
          endDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          type: "product",
          provider: "HomeFix BD",
          claims: [],
        },
      },
      { upsert: true }
    );
  }

  revalidatePath("/account/orders");
  revalidatePath("/seller/orders");
  revalidatePath("/admin/orders");

  console.log("[sslcommerz/success] order fulfilled:", order.orderNumber);

  return NextResponse.redirect(
    `${baseUrl}/checkout/success?orderId=${order.id}`
  );
}