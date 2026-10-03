import Link from "next/link";
import { orders } from "@/lib/mongodb";

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  let order = null;
  if (orderId) { try { order = await (await orders()).findOne({ id: orderId }); } catch { order = null; } }
  return <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-success">Order received</p><h1 className="display mt-4 text-5xl font-semibold">ধন্যবাদ। অর্ডার হয়েছে।</h1>{order && <div className="mt-8 border border-border p-6 text-left"><p>Order: <strong>{order.orderNumber}</strong></p><p className="mt-2">Total: <strong>৳{order.total.toLocaleString()}</strong></p><p className="mt-2">Payment: {order.paymentStatus}</p></div>}<Link href={orderId ? `/account/orders/${orderId}` : "/account/orders"} className="mt-8 inline-flex bg-foreground px-6 py-3 text-sm font-semibold text-background">Track order</Link></main>;
}
