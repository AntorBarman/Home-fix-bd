"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  acceptBookingAction,
  rejectBookingAction,
} from "@/lib/actions/technician";

type Result = { success?: boolean; error?: string };

export default function RequestActions({
  bookingNumber,
}: {
  bookingNumber: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<Result>) {
    setMsg(null);
    start(async () => {
      const fd = new FormData();
      fd.set("bookingNumber", bookingNumber);
      const res = await action(fd);
      if (res?.error) setMsg(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(acceptBookingAction)}
          className="bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {pending ? "..." : "Accept"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(rejectBookingAction)}
          className="border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          Reject
        </button>
        <Link
          href={`/technician/active/${bookingNumber}`}
          className="border border-border px-4 py-2 text-sm"
        >
          View
        </Link>
      </div>
      {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
    </div>
  );
}