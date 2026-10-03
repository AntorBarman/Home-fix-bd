import type { Service } from "@/types";

type Classification = { category: string; confidence: "low" | "medium" | "high"; keywords: string[]; recommendedServiceSlug: string; recommendedProductSlugs: string[] };
const rules: { category: string; terms: string[]; service: string; products: string[] }[] = [
  { category: "plumbing", terms: ["পানি", "কল", "tap", "leak", "লিক", "pipe", "পাইপ", "নল"], service: "basin-tap-repair", products: ["basin-tap", "water-tap"] },
  { category: "electrical", terms: ["বিদ্যুৎ", "ইলেকট্রিক", "switch", "সুইচ", "light", "ফ্যান", "fan", "short"], service: "electrical-safety-check", products: ["ceiling-fan", "led-bulb"] },
  { category: "ac", terms: ["এসি", "ac", "ঠান্ডা", "cool", "গরম বাতাস"], service: "ac-installation", products: ["air-conditioner"] },
  { category: "refrigerator", terms: ["ফ্রিজ", "fridge", "refrigerator", "বরফ", "ঠান্ডা হচ্ছে না"], service: "refrigerator-repair", products: ["refrigerator"] },
];
export function classifyProblem(text: string, services: Service[] = []): Classification {
  const normalized = text.toLowerCase();
  const match = rules.map((rule) => ({ rule, keywords: rule.terms.filter((term) => normalized.includes(term.toLowerCase())) })).sort((a, b) => b.keywords.length - a.keywords.length)[0];
  if (!match || !match.keywords.length) {
    const fallback = services.find((service) => service.slug === "home-maintenance");
    return { category: fallback?.category ?? "home-maintenance", confidence: "low", keywords: [], recommendedServiceSlug: fallback?.slug ?? "home-maintenance", recommendedProductSlugs: [] };
  }
  return { category: match.rule.category, confidence: match.keywords.length > 1 ? "high" : "medium", keywords: match.keywords, recommendedServiceSlug: match.rule.service, recommendedProductSlugs: match.rule.products };
}
