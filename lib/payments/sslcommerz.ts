import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@/types";
import type { PaymentGateway } from "./index";

export class SslcommerzGateway implements PaymentGateway {
  private readonly storeId = process.env.SSLCOMMERZ_STORE_ID;
  private readonly storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  private readonly baseUrl = process.env.SSLCOMMERZ_BASE_URL;

  private ensureConfigured() {
    if (!this.storeId || !this.storePassword || !this.baseUrl) throw new Error("SSLCOMMERZ not configured");
  }

  async createSession(order: Order) {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ store_id: this.storeId!, store_passwd: this.storePassword!, total_amount: String(order.total), currency: "BDT", tran_id: order.orderNumber, success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?orderId=${order.id}`, fail_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel?orderId=${order.id}`, cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel?orderId=${order.id}`, cus_name: order.address.fullName, cus_email: order.email, cus_phone: order.address.phone, product_name: "HomeFix BD order", product_category: "home", shipping_method: "Courier", num_of_item: String(order.items.length) }),
    });
    if (!response.ok) throw new Error("SSLCOMMERZ session failed");
    const data = await response.json() as { GatewayPageURL?: string; sessionkey?: string };
    if (!data.GatewayPageURL || !data.sessionkey) throw new Error("SSLCOMMERZ session failed");
    return { redirectUrl: data.GatewayPageURL, paymentId: data.sessionkey };
  }

  verifyWebhook(rawBody: string, signature: string) {
    if (!this.storePassword || !signature) return false;
    const expected = createHmac("sha256", this.storePassword).update(rawBody).digest("hex");
    const received = signature.replace(/^sha256=/, "");
    return received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  }
}
