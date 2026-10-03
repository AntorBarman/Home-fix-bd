import type { CartLine, Coupon, Product } from "@/types";
export function shippingFor(subtotalBdt: number, outsideDhaka = false) { return subtotalBdt >= 5000 ? 0 : outsideDhaka ? 150 : 100; }
export function findSizeQty(product: Product, color: string, size: string) {
  return product.variants.find((v) => v.color === color)?.sizes.find((s) => s.size === size)?.qty ?? 0;
}
export function applyCoupon(subtotalBdt: number, coupon: Coupon | null) {
  if (!coupon?.active || (coupon.minSubtotal && subtotalBdt < coupon.minSubtotal)) return 0;
  return coupon.type === "percent" ? Math.round(subtotalBdt * coupon.value / 100) : Math.min(coupon.value, subtotalBdt);
}
export function priceCart(lines: CartLine[], products: Product[], coupon: Coupon | null) {
  const subtotal = lines.reduce((sum, line) => sum + (products.find((p) => p.id === line.productId)?.price ?? 0) * line.qty, 0);
  const discount = applyCoupon(subtotal, coupon);
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, discount, total: subtotal + shipping - discount };
}
