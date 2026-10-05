"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { orders } from "@/lib/mongodb";
import { z } from "zod";

// ─── Schema ────────────────────────────────────────────
const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
});

// ─── Valid Transitions ────────────────────────────────
const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "processing", "cancelled"],
  paid: ["processing", "packed", "cancelled", "returned"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

// ─── Update Order Status (FormData) ───────────────────
export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();

  const parsed = statusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Invalid status." };
  }

  const order = await (await orders()).findOne({ id: parsed.data.id });

  if (!order) {
    return { error: "Order not found." };
  }

  const currentStatus = order.status as OrderStatus;

  if (!transitions[currentStatus]?.includes(parsed.data.status)) {
    return {
      error: `Cannot move from "${currentStatus}" to "${parsed.data.status}".`,
    };
  }

  const update: {
    status: OrderStatus;
    updatedAt: string;
    paymentStatus?: "paid";
  } = {
    status: parsed.data.status,
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.status === "paid") {
    update.paymentStatus = "paid";
  }

  await (await orders()).updateOne({ id: order.id }, { $set: update });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/account/orders");

  return { success: true };
}

// ─── Cancel Order (accepts string id) ─────────────────
export async function cancelOrderAction(id: string) {
  await requireAdmin();

  if (!id || typeof id !== "string") {
    return { error: "Invalid order ID." };
  }

  const order = await (await orders()).findOne({ id });

  if (!order) {
    return { error: "Order not found." };
  }

  const nonCancellable = [
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
  ];

  if (nonCancellable.includes(order.status)) {
    return { error: `Cannot cancel order in "${order.status}" state.` };
  }

  const { products } = await import("@/lib/mongodb");

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
              s.size !== item.size ? s : { ...s, qty: s.qty + item.qty }
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

  await (await orders()).updateOne(
    { id: order.id },
    {
      $set: {
        status: "cancelled",
        paymentStatus:
          order.paymentStatus === "paid" ? "refunded" : "cancelled",
        updatedAt: new Date().toISOString(),
      },
    }
  );

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/account/orders");

  return { success: true };
}

// ─── Refund Order (accepts string id) ─────────────────
export async function refundOrderAction(id: string) {
  await requireAdmin();

  if (!id || typeof id !== "string") {
    return { error: "Invalid order ID." };
  }

  const order = await (await orders()).findOne({ id });

  if (!order) {
    return { error: "Order not found." };
  }

  if (order.paymentStatus !== "paid") {
    return { error: "Only paid orders can be refunded." };
  }

  // ⚠️ Real gateway refund API call would go here
  await (await orders()).updateOne(
    { id: order.id },
    {
      $set: {
        paymentStatus: "refunded",
        updatedAt: new Date().toISOString(),
      },
    }
  );

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/account/orders");

  return { success: true };
}