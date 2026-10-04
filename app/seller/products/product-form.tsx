import { createSellerProductAction, updateSellerProductAction } from "@/lib/actions/seller-products";
import type { Product } from "@/types";
import { SubmitButton } from "@/components/ui/submit-button";

export function SellerProductForm({ product }: { product?: Product }) {
  async function action(formData: FormData) { "use server"; if (product) await updateSellerProductAction(formData); else await createSellerProductAction(formData); }
  const variants = product?.variants ?? [];
  return <form action={action} className="mt-8 grid gap-4 sm:grid-cols-2">
    {product && <input type="hidden" name="id" value={product.id} />}
    <input name="name" required defaultValue={product?.name} placeholder="Name / নাম" className="min-h-11 border border-border px-3" />
    <input name="nameBn" required defaultValue={product?.nameBn} placeholder="Bengali name / বাংলা নাম" className="min-h-11 border border-border px-3" />
    <input name="sku" required defaultValue={product?.id} placeholder="SKU" className="min-h-11 border border-border px-3" />
    <input name="slug" required defaultValue={product?.slug} placeholder="Slug" className="min-h-11 border border-border px-3" />
    <input name="brand" required defaultValue={product?.brand} placeholder="Brand" className="min-h-11 border border-border px-3" />
    <input name="category" required defaultValue={product?.category} placeholder="Category" className="min-h-11 border border-border px-3" />
    <input name="price" required type="number" min="0" defaultValue={product?.price} placeholder="Price BDT" className="min-h-11 border border-border px-3" />
    <input name="compareAtPrice" type="number" min="0" defaultValue={product?.compareAtPrice} placeholder="Compare-at price" className="min-h-11 border border-border px-3" />
    <input name="image" required defaultValue={product?.image} placeholder="Primary image URL" className="min-h-11 border border-border px-3" />
    <input name="hoverImage" defaultValue={product?.hoverImage} placeholder="Hover image URL" className="min-h-11 border border-border px-3" />
    <textarea name="description" required defaultValue={product?.description} placeholder="Description" className="min-h-28 border border-border p-3 sm:col-span-2" />
    <textarea name="descriptionBn" defaultValue={(product as Product & { descriptionBn?: string })?.descriptionBn} placeholder="Description বাংলা" className="min-h-28 border border-border p-3 sm:col-span-2" />
    <textarea name="features" defaultValue={product?.features?.join("\n")} placeholder="Features, one per line" className="min-h-24 border border-border p-3" />
    <textarea name="materials" placeholder="Materials, one per line" className="min-h-24 border border-border p-3" />
    <textarea name="variants" defaultValue={JSON.stringify(variants)} placeholder='Variants JSON: [{"color":"Black","colorHex":"#111","sizes":[{"size":"M","qty":10}],"image":""}]' className="min-h-28 border border-border p-3 sm:col-span-2" />
    <select name="badge" defaultValue={product?.badge ?? ""} className="min-h-11 border border-border px-3"><option value="">No badge</option><option value="new">New</option><option value="hot">Hot</option><option value="sale">Sale</option></select>
    <input name="installServiceSlug" defaultValue={product?.installServiceSlug} placeholder="Install service slug (optional)" className="min-h-11 border border-border px-3" />
    <label className="flex items-center gap-2"><input name="published" type="checkbox" defaultChecked={product?.published} /> Published / প্রকাশিত</label>
    <label className="flex items-center gap-2"><input name="installable" type="checkbox" defaultChecked={product?.installable} /> Installable / ইনস্টলেশন</label>
    <SubmitButton pendingText={product ? "Saving product..." : "Creating product..."} className="sm:col-span-2">{product ? "Save product / সংরক্ষণ" : "Create product / তৈরি করুন"}</SubmitButton>
  </form>;
}
