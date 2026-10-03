"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { checkoutAction } from "@/lib/actions/checkout";

type Enabled = { enableCod: boolean; enableBkash: boolean; enableNagad: boolean; enableSslcommerz: boolean };
export function CheckoutForm({ user, enabled }: { user: { name: string; email: string }; enabled: Enabled }) {
  const router = useRouter();
  const [method, setMethod] = useState<"bkash" | "nagad" | "sslcommerz" | "cod">("cod");
  const methods = [
    ["cod", "Cash on delivery", enabled.enableCod],
    ["bkash", "bKash", enabled.enableBkash],
    ["nagad", "Nagad", enabled.enableNagad],
    ["sslcommerz", "SSLCOMMERZ", enabled.enableSslcommerz],
  ] as const;
  async function submit(formData: FormData) {
    const raw = localStorage.getItem("homefixbd-cart");
    const lines = raw ? JSON.parse(raw) as { productId: string; color: string; size: string; qty: number; addInstallation?: boolean }[] : [];
    const payload = {
      name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), phone: String(formData.get("phone") ?? ""),
      address: { line1: String(formData.get("line1") ?? ""), area: String(formData.get("area") ?? ""), city: String(formData.get("city") ?? ""), district: String(formData.get("district") ?? ""), division: String(formData.get("division") ?? ""), postalCode: String(formData.get("postalCode") ?? ""), country: "BD" },
      notes: String(formData.get("notes") ?? ""), paymentMethod: method, lines,
    };
    const actionData = new FormData();
    actionData.set("payload", JSON.stringify(payload));
    const result = await checkoutAction(actionData);
    if (result?.error) { toast.error(result.message ?? (result.error === "OUT_OF_STOCK" ? "An item is out of stock." : "Unable to place order.")); return; }
    if (result?.redirectUrl) window.location.href = result.redirectUrl;
    else if (result?.orderId) router.push(`/checkout/success?orderId=${result.orderId}`);
  }
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-foreground/45">Secure checkout</p><h1 className="display mt-2 text-5xl font-semibold">অর্ডার সম্পন্ন করুন</h1><form action={submit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]"><div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Name<input name="name" defaultValue={user.name} required className="min-h-11 border border-border px-3" /></label><label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" defaultValue={user.email} required className="min-h-11 border border-border px-3" /></label><label className="grid gap-2 text-sm font-medium">Phone<input name="phone" required placeholder="017XXXXXXXX" className="min-h-11 border border-border px-3" /></label><label className="grid gap-2 text-sm font-medium">Address<input name="line1" required className="min-h-11 border border-border px-3" /></label><div className="grid gap-4 sm:grid-cols-2"><input name="area" placeholder="Area" required className="min-h-11 border border-border px-3" /><input name="city" placeholder="City" required className="min-h-11 border border-border px-3" /><input name="district" placeholder="District" required className="min-h-11 border border-border px-3" /><input name="division" placeholder="Division" required className="min-h-11 border border-border px-3" /><input name="postalCode" placeholder="Postal code" required className="min-h-11 border border-border px-3" /></div><label className="grid gap-2 text-sm font-medium">Notes<textarea name="notes" className="min-h-24 border border-border px-3 py-2" /></label></div><aside className="h-fit bg-muted p-5"><h2 className="display text-2xl font-semibold">Payment</h2><div className="mt-5 grid gap-3">{methods.filter((item) => item[2]).map(([value, label]) => <label key={value} className="flex items-center gap-3 border border-border bg-background p-3 text-sm"><input type="radio" name="payment" checked={method === value} onChange={() => setMethod(value)} />{label}</label>)}</div><button className="mt-6 min-h-12 w-full bg-foreground text-sm font-semibold text-background">Place order</button></aside></form></main>;
}
