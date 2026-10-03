import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@/types";
import type { PaymentGateway } from "./index";

export class NagadGateway implements PaymentGateway {
  private readonly merchantId = process.env.NAGAD_MERCHANT_ID;
  private readonly publicKey = process.env.NAGAD_PUBLIC_KEY;
  private readonly baseUrl = process.env.NAGAD_BASE_URL;

  private ensureConfigured() {
    if (!this.merchantId || !this.publicKey || !this.baseUrl) throw new Error("Nagad not configured");
  }

  async createSession(order: Order) {
    this.ensureConfigured();
    const response = await fetch(`${this.baseUrl}/checkout/initialize/${this.merchantId}/${order.orderNumber}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-KM-Api-Version": "v-0.2.0" },
      body: JSON.stringify({ amount: order.total.toFixed(2), orderId: order.orderNumber, callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?orderId=${order.id}` }),
    });
    if (!response.ok) throw new Error("Nagad session failed");
    const data = await response.json() as { callBackUrl?: string; paymentReferenceId?: string };
    if (!data.callBackUrl || !data.paymentReferenceId) throw new Error("Nagad session failed");
    return { redirectUrl: data.callBackUrl, paymentId: data.paymentReferenceId };
  }

  verifyWebhook(rawBody: string, signature: string) {
    if (!this.publicKey || !signature) return false;
    const expected = createHmac("sha256", this.publicKey).update(rawBody).digest("hex");
    const received = signature.replace(/^sha256=/, "");
    return received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  }
}
