"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { subscribeNewsletterAction } from "@/lib/actions/contact";
export function NewsletterForm() { const [pending, setPending] = useState(false); async function submit(formData: FormData) { setPending(true); const result = await subscribeNewsletterAction(formData); setPending(false); if (result?.success) toast.success("ধন্যবাদ! সাবস্ক্রাইব হয়েছে।"); else if (result?.alreadySubscribed) toast.info("আপনি ইতিমধ্যে সাবস্ক্রাইব করেছেন।"); else toast.error(result?.error ?? "ইমেইলটি সঠিক নয়।"); } return <form action={submit} className="mt-4 flex border-b border-foreground/40 py-2 text-sm"><input name="email" type="email" required aria-label="Newsletter email" placeholder="আপনার ইমেইল" className="min-w-0 flex-1 bg-transparent outline-none" /><button disabled={pending} aria-label="Subscribe"><ArrowRight size={18} /></button></form>; }
