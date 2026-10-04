"use client";

import { useState } from "react";
import {
  createSellerProductAction,
  updateSellerProductAction,
} from "@/lib/actions/seller-products";
import type { Product } from "@/types";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { VariantsEditor } from "@/components/variants-editor";
import { ChevronDown, ChevronUp } from "lucide-react";

export function SellerProductForm({ product }: { product?: Product }) {
  const [showAdvanced, setShowAdvanced] = useState(!!product);

  const action = product ? updateSellerProductAction : createSellerProductAction;
  const variants = product?.variants ?? [];

  return (
    <form action={action} className="mt-8 grid gap-4 sm:grid-cols-2">
      {product && <input type="hidden" name="id" value={product.id} />}

      {/* Basic fields */}
      <input
        name="name"
        required
        defaultValue={product?.name}
        placeholder="Name / নাম *"
        className="min-h-11 border border-border px-3 sm:col-span-2"
      />
      <input
        name="nameBn"
        required
        defaultValue={product?.nameBn}
        placeholder="Bengali name / বাংলা নাম *"
        className="min-h-11 border border-border px-3 sm:col-span-2"
      />
      <select
        name="category"
        required
        defaultValue={product?.category ?? ""}
        className="min-h-11 border border-border px-3"
      >
        <option value="">Category / ক্যাটাগরি *</option>
        <option value="electrical">Electrical</option>
        <option value="plumbing">Plumbing</option>
        <option value="sanitary">Sanitary</option>
        <option value="ac">AC</option>
        <option value="refrigerator">Refrigerator</option>
        <option value="tv">TV</option>
        <option value="kitchen-appliances">Kitchen Appliances</option>
        <option value="home-maintenance">Home Maintenance</option>
      </select>
      <input
        name="brand"
        required
        defaultValue={product?.brand ?? "HomeFix"}
        placeholder="Brand / ব্র্যান্ড *"
        className="min-h-11 border border-border px-3"
      />
      <input
        name="price"
        required
        type="number"
        min="0"
        defaultValue={product?.price}
        placeholder="Price BDT / দাম *"
        className="min-h-11 border border-border px-3"
      />
      <input
        name="compareAtPrice"
        type="number"
        min="0"
        defaultValue={product?.compareAtPrice}
        placeholder="Compare-at price (optional)"
        className="min-h-11 border border-border px-3"
      />

      <ImageUpload
        name="image"
        defaultValue={product?.image}
        label="Product photo / পণ্যের ছবি *"
        required
      />

      <textarea
        name="description"
        required
        defaultValue={product?.description}
        placeholder="Description / বর্ণনা *"
        className="min-h-28 border border-border p-3 sm:col-span-2"
      />

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground sm:col-span-2"
      >
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showAdvanced ? "Hide advanced options" : "Show advanced options / আরো অপশন"}
      </button>

      {showAdvanced && (
        <>
          <input
            name="descriptionBn"
            defaultValue={(product as any)?.descriptionBn}
            placeholder="Description বাংলা"
            className="min-h-11 border border-border px-3 sm:col-span-2"
          />
          <select
            name="badge"
            defaultValue={product?.badge ?? ""}
            className="min-h-11 border border-border px-3"
          >
            <option value="">No badge</option>
            <option value="new">New</option>
            <option value="hot">Hot</option>
            <option value="sale">Sale</option>
          </select>
          <input
            name="installServiceSlug"
            defaultValue={product?.installServiceSlug}
            placeholder="Install service slug (optional)"
            className="min-h-11 border border-border px-3"
          />

          <ImageUpload
            name="hoverImage"
            defaultValue={product?.hoverImage}
            label="Hover image (optional)"
          />

          <textarea
            name="features"
            defaultValue={product?.features?.join("\n")}
            placeholder="Features, one per line"
            className="min-h-24 border border-border p-3"
          />
          <textarea
            name="materials"
            defaultValue={(product as any)?.materials?.join("\n")}
            placeholder="Materials, one per line"
            className="min-h-24 border border-border p-3"
          />

          <input
            name="sku"
            defaultValue={(product as any)?.sku}
            placeholder="SKU (auto if empty)"
            className="min-h-11 border border-border px-3"
          />
          <input
            name="slug"
            defaultValue={product?.slug}
            placeholder="Slug (auto if empty)"
            className="min-h-11 border border-border px-3"
          />

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm text-foreground/70">
              Colors &amp; Sizes (optional)
            </p>
            <VariantsEditor name="variants" initial={variants} />
          </div>

          <label className="flex items-center gap-2">
            <input
              name="published"
              type="checkbox"
              defaultChecked={product?.published ?? true}
            />
            Published / প্রকাশিত
          </label>
          <label className="flex items-center gap-2">
            <input
              name="installable"
              type="checkbox"
              defaultChecked={product?.installable}
            />
            Installable / ইনস্টলেশন
          </label>
        </>
      )}

      <SubmitButton
        pendingText={product ? "Saving..." : "Creating..."}
        className="sm:col-span-2"
      >
        {product ? "Save product / সংরক্ষণ" : "Create product / তৈরি করুন"}
      </SubmitButton>
    </form>
  );
}