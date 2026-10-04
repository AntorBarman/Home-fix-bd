"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type SizeStock = { size: string; qty: number };
type Variant = {
  color: string;
  colorHex: string;
  image: string;
  sizes: SizeStock[];
};

type Props = {
  name: string;
  initial?: Variant[];
};

export function VariantsEditor({ name, initial = [] }: Props) {
  const [variants, setVariants] = useState<Variant[]>(
    initial.length > 0
      ? initial
      : [{ color: "", colorHex: "#111111", image: "", sizes: [{ size: "", qty: 0 }] }]
  );

  function updateVariant(index: number, patch: Partial<Variant>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v))
    );
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { color: "", colorHex: "#111111", image: "", sizes: [{ size: "", qty: 0 }] },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSize(vIndex: number, sIndex: number, patch: Partial<SizeStock>) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIndex
          ? {
              ...v,
              sizes: v.sizes.map((s, j) => (j === sIndex ? { ...s, ...patch } : s)),
            }
          : v
      )
    );
  }

  function addSize(vIndex: number) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIndex ? { ...v, sizes: [...v.sizes, { size: "", qty: 0 }] } : v
      )
    );
  }

  function removeSize(vIndex: number, sIndex: number) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vIndex ? { ...v, sizes: v.sizes.filter((_, j) => j !== sIndex) } : v
      )
    );
  }

  const totalStock = variants.reduce(
    (sum, v) => sum + v.sizes.reduce((s, size) => s + (size.qty || 0), 0),
    0
  );

  return (
    <div className="sm:col-span-2 grid gap-4 border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Colors &amp; Sizes / রং ও সাইজ
        </h3>
        <span className="text-xs text-foreground/60">
          মোট stock: {totalStock}
        </span>
      </div>

      {/* Hidden input serializes the full state */}
      <input type="hidden" name={name} value={JSON.stringify(variants)} />

      {variants.map((variant, vIndex) => (
        <div
          key={vIndex}
          className="grid gap-3 border border-border/60 bg-muted/30 p-3"
        >
          <div className="flex items-start gap-2">
            <input
              type="text"
              value={variant.color}
              onChange={(e) => updateVariant(vIndex, { color: e.target.value })}
              placeholder="Color name / রঙের নাম"
              className="min-h-10 flex-1 border border-border px-3 text-sm"
            />
            <input
              type="color"
              value={variant.colorHex}
              onChange={(e) => updateVariant(vIndex, { colorHex: e.target.value })}
              className="h-10 w-12 cursor-pointer border border-border"
              aria-label="Color hex"
            />
            <button
              type="button"
              onClick={() => removeVariant(vIndex)}
              className="flex h-10 w-10 items-center justify-center border border-border text-sale hover:bg-sale hover:text-white"
              aria-label="Remove color"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-2 pl-4">
            {variant.sizes.map((size, sIndex) => (
              <div key={sIndex} className="flex items-center gap-2">
                <input
                  type="text"
                  value={size.size}
                  onChange={(e) =>
                    updateSize(vIndex, sIndex, { size: e.target.value })
                  }
                  placeholder="Size / সাইজ"
                  className="min-h-10 flex-1 border border-border px-3 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={size.qty}
                  onChange={(e) =>
                    updateSize(vIndex, sIndex, {
                      qty: parseInt(e.target.value || "0", 10),
                    })
                  }
                  placeholder="Qty"
                  className="min-h-10 w-24 border border-border px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeSize(vIndex, sIndex)}
                  className="flex h-10 w-10 items-center justify-center border border-border text-sale hover:bg-sale hover:text-white"
                  aria-label="Remove size"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addSize(vIndex)}
              className="flex items-center gap-1 self-start px-2 py-1 text-xs text-foreground/70 hover:text-foreground"
            >
              <Plus size={14} /> Add size / নতুন সাইজ
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addVariant}
        className="flex min-h-11 items-center justify-center gap-2 border border-dashed border-border text-sm hover:bg-muted"
      >
        <Plus size={16} /> Add color / নতুন রং
      </button>
    </div>
  );
}