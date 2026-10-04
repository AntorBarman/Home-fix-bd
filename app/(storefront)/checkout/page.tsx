import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { settings } from "@/lib/mongodb";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?from=/checkout");
  let enabled = { enableCod: true, enableBkash: Boolean(process.env.BKASH_APP_KEY), enableNagad: Boolean(process.env.NAGAD_MERCHANT_ID), enableSslcommerz: Boolean(process.env.SSLCOMMERZ_STORE_ID) };
  try {
    const store = await (await settings()).findOne({ _id: "singleton" });
    if (store) enabled = { enableCod: store.enableCod, enableBkash: store.enableBkash, enableNagad: store.enableNagad, enableSslcommerz: store.enableSslcommerz };
  } catch { /* Checkout can still render while Mongo is unavailable. */ }
  return <CheckoutForm user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} enabled={enabled} />;
}
