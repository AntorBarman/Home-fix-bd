import Link from "next/link";

export default function TechnicianNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-[.2em] text-sale">
        404 · Not found
      </p>
      <h1 className="display mt-4 text-4xl font-semibold">
        এই পেজটি খুঁজে পাওয়া গেল না
      </h1>
      <p className="mt-3 text-sm text-foreground/60">
        এই booking হয়তো আপনার অধীনে নেই, অথবা সম্প্রতি পরিবর্তিত হয়েছে।
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/technician/dashboard"
          className="bg-foreground px-6 py-3 text-sm font-semibold text-background"
        >
          Dashboard-এ ফিরে যান
        </Link>
        <Link
          href="/technician/requests"
          className="border border-border px-6 py-3 text-sm"
        >
          View requests
        </Link>
      </div>
    </div>
  );
}