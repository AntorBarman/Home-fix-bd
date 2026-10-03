import "server-only";

import type { Booking, Order, Warranty } from "@/types";

export function createProductWarranty(order: Order, itemIndex: number): Warranty & { productId?: string } {
  const startDate = new Date().toISOString();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  return { id: `warranty-${order.orderNumber}-${itemIndex}`, orderId: order.id, itemIndex, productId: order.items[itemIndex]?.productId, startDate, endDate: end.toISOString(), type: "product", provider: "HomeFix BD" };
}

export function createServiceWarranty(booking: Booking, days: number): Warranty {
  const startDate = new Date().toISOString();
  const end = new Date();
  end.setDate(end.getDate() + days);
  return { id: `warranty-${booking.bookingNumber}`, orderId: booking.id, itemIndex: 0, serviceSlug: booking.serviceSlug, startDate, endDate: end.toISOString(), type: "service", provider: "HomeFix BD" };
}

export function isWarrantyActive(warranty: Warranty) { return new Date(warranty.endDate) >= new Date(); }
