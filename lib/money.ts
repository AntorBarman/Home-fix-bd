export const FX: Record<string, number> = { BDT: 1, USD: 0.0091 };
export function convertDisplay(amountBdt: number, currency = "BDT") { return amountBdt * (FX[currency] ?? 1); }
export function formatShopPrice(amountBdt: number, currency = "BDT") {
  const value = convertDisplay(amountBdt, currency);
  return currency === "USD" ? `$${value.toFixed(2)}` : `৳${Math.round(value).toLocaleString("en-BD")}`;
}
