import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { Order } from "@/types";
import type { PaymentGateway } from "./index";

export class SslcommerzGateway implements PaymentGateway {
  private readonly storeId = process.env.SSLCOMMERZ_STORE_ID;
  private readonly storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  private readonly baseUrl = process.env.SSLCOMMERZ_BASE_URL;

  private ensureConfigured() {
    if (!this.storeId || !this.storePassword || !this.baseUrl) {
      throw new Error("SSLCOMMERZ not configured");
    }
  }

  async createSession(order: Order) {
    this.ensureConfigured();

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${this.baseUrl}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        store_id: this.storeId!,
        store_passwd: this.storePassword!,
        total_amount: String(order.total),
        currency: "BDT",
        tran_id: order.orderNumber,

        // ✅ POST callbacks — API routes, not pages
        success_url: `${baseUrl}/api/payments/sslcommerz/success`,
        fail_url: `${baseUrl}/api/payments/sslcommerz/fail`,
        cancel_url: `${baseUrl}/api/payments/sslcommerz/cancel`,
        ipn_url: `${baseUrl}/api/payments/sslcommerz/ipn`,

        cus_name: order.address.fullName,
        cus_email: order.email,
        cus_phone: order.address.phone,
        cus_add1: order.address.line1,
        cus_add2: order.address.area || "",
        cus_city: order.address.city || "Dhaka",
        cus_state: order.address.district || "Dhaka",
        cus_postcode: order.address.postalCode || "1000",
        cus_country: "Bangladesh",

        ship_name: order.address.fullName,
        ship_add1: order.address.line1,
        ship_add2: order.address.area || "",
        ship_city: order.address.city || "Dhaka",
        ship_state: order.address.district || "Dhaka",
        ship_postcode: order.address.postalCode || "1000",
        ship_country: "Bangladesh",

        product_name: "HomeFix BD Order",
        product_category: "Marketplace",
        product_profile: "general",
        shipping_method: "Courier",
        num_of_item: String(order.items.length),
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`SSLCOMMERZ session failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      status?: string;
      failedreason?: string;
      GatewayPageURL?: string;
      sessionkey?: string;
    };

    if (data.status !== "SUCCESS" || !data.GatewayPageURL || !data.sessionkey) {
      throw new Error(
        `SSLCOMMERZ session failed: ${data.failedreason || "Unknown error"}`
      );
    }

    return {
      redirectUrl: data.GatewayPageURL,
      paymentId: data.sessionkey,
    };
  }

  verifySignature(postBody: Record<string, string>): boolean {
    if (!this.storePassword) return false;

    const { verify_sign, verify_key } = postBody;
    if (!verify_sign || !verify_key) return false;

    const keys = verify_key.split(",");
    const values = keys.map((k) => postBody[k] ?? "");
    values.push(this.storePassword);

    const computed = createHash("md5").update(values.join("&")).digest("hex");

    if (computed.length !== verify_sign.length) return false;

    try {
      return timingSafeEqual(Buffer.from(computed), Buffer.from(verify_sign));
    } catch {
      return false;
    }
  }

  async validateTransaction(valId: string): Promise<{
    valid: boolean;
    amount?: string;
    status?: string;
    tranId?: string;
    currency?: string;
  }> {
    this.ensureConfigured();

    const url =
      `${this.baseUrl}/validator/api/validationserverAPI.php` +
      `?val_id=${encodeURIComponent(valId)}` +
      `&store_id=${encodeURIComponent(this.storeId!)}` +
      `&store_passwd=${encodeURIComponent(this.storePassword!)}` +
      `&format=json`;

    try {
      const res = await fetch(url);
      if (!res.ok) return { valid: false };

      const data = await res.json();

      if (data.status === "VALID" || data.status === "VALIDATED") {
        return {
          valid: true,
          amount: data.amount,
          status: data.status,
          tranId: data.tran_id,
          currency: data.currency,
        };
      }

      return { valid: false };
    } catch {
      return { valid: false };
    }
  }

  verifyWebhook(_rawBody: string, _signature: string): boolean {
    console.warn(
      "[sslcommerz] verifyWebhook (HMAC) is deprecated. Use verifySignature(postBody)."
    );
    return false;
  }
}