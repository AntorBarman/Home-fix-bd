import "server-only";

import type { Order } from "@/types";

export interface PaymentGateway {
  createSession(order: Order): Promise<{ redirectUrl: string; paymentId: string }>;
  verifyWebhook(rawBody: string, signature: string): boolean;
}
