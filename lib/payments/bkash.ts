import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@/types";
import type { PaymentGateway } from "./index";

export class BkashGateway implements PaymentGateway {
  private readonly appKey = process.env.BKASH_APP_KEY;
  private readonly appSecret = process.env.BKASH_APP_SECRET;
  private readonly username = process.env.BKASH_USERNAME;
  private readonly password = process.env.BKASH_PASSWORD;
  private readonly baseUrl = process.env.BKASH_BASE_URL;

  private ensureConfigured() {
    if (!this.appKey || !this.appSecret || !this.username || !this.password || !this.baseUrl) throw new Error("bKash not configured");
  }

  async createSession(order: Order) {
    this.ensureConfigured();
    const tokenResponse = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", username: this.username!, password: this.password!, accept: "application/json" },
      body: JSON.stringify({ app_key: this.appKey, app_secret: this.appSecret }),
    });
    if (!tokenResponse.ok) throw new Error("bKash session failed");
    const tokenData = await tokenResponse.json() as { id_token?: string };
    if (!tokenData.id_token) throw new Error("bKash session failed");
    const response = await fetch(`${this.baseUrl}/tokenized/checkout/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: tokenData.id_token, "X-APP-Key": this.appKey! },
      body: JSON.stringify({ mode: "0011", payerReference: order.email, callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?orderId=${order.id}`, amount: order.total.toFixed(2), currency: "BDT", intent: "sale", merchantInvoiceNumber: order.orderNumber }),
    });
    if (!response.ok) throw new Error("bKash session failed");
    const data = await response.json() as { bkashURL?: string; paymentID?: string };
    if (!data.bkashURL || !data.paymentID) throw new Error("bKash session failed");
    return { redirectUrl: data.bkashURL, paymentId: data.paymentID };
  }

  verifyWebhook(rawBody: string, signature: string) {
    if (!this.appSecret || !signature) return false;
    const expected = createHmac("sha256", this.appSecret).update(rawBody).digest("hex");
    const received = signature.replace(/^sha256=/, "");
    return received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  }
}
