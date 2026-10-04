"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  name: string;
  defaultValue?: string;
  label?: string;
  required?: boolean;
  resetSignal?: number;  // Change this number to reset
};

export function ImageUpload({
  name,
  defaultValue = "",
  label = "Image",
  required = false,
  resetSignal = 0,
}: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Reset when resetSignal changes (after successful submit)
  useEffect(() => {
    setUrl(defaultValue);
    if (inputRef.current) inputRef.current.value = "";
  }, [resetSignal, defaultValue]);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল ৫MB-এর চেয়ে বড়");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "আপলোড ব্যর্থ");
        return;
      }
      setUrl(data.url);
      toast.success("ছবি আপলোড হয়েছে");
    } catch {
      toast.error("আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={url} required={required} />

      <div className="mt-2 flex items-start gap-3">
        {url ? (
          <div className="relative">
            <img
              src={url}
              alt="preview"
              className="h-24 w-24 rounded border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setUrl("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sale text-white"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded border border-dashed border-border text-foreground/40">
            <Upload size={24} />
          </div>
        )}

        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-10 items-center gap-2 border border-border bg-background px-4 text-sm hover:bg-muted disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                আপলোড হচ্ছে...
              </>
            ) : (
              <>
                <Upload size={16} />
                {url ? "পরিবর্তন করুন" : "ছবি নির্বাচন করুন"}
              </>
            )}
          </button>
          <p className="mt-1 text-xs text-foreground/50">
            JPG, PNG, WebP · max 5MB
          </p>
        </div>
      </div>
    </div>
  );
}