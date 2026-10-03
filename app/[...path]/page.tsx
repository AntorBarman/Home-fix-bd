import Link from "next/link";
import { Storefront } from "@/components/storefront";
import { auth } from "@/auth";

const labels: Record<string, { title: string; intro: string }> = {
  technicians: { title: "ভরসার মিস্ত্রি খুঁজুন", intro: "আপনার এলাকার ভেরিফাইড টেকনিশিয়ানরা কাজের জন্য প্রস্তুত।" },
  booking: { title: "টেকনিশিয়ান বুক করুন", intro: "সার্ভিস, ঠিকানা ও সময় বেছে নিলে আমরা পরের ধাপ দেখাব।" },
  blog: { title: "HomeFix Journal", intro: "ঘর নিরাপদ, আরামদায়ক ও গুছিয়ে রাখার ব্যবহারিক লেখা।" },
  about: { title: "আমাদের কথা", intro: "HomeFix BD ঘরের পণ্য আর দক্ষ মানুষের মধ্যে সহজ সংযোগ তৈরি করে।" },
  contact: { title: "যোগাযোগ করুন", intro: "আপনার প্রশ্ন লিখুন। আমরা 9:00am–9:00pm এর মধ্যে উত্তর দেব।" },
  faq: { title: "সাধারণ প্রশ্ন", intro: "ডেলিভারি, বুকিং, পেমেন্ট ও ওয়ারেন্টি সম্পর্কে জানুন।" },
  checkout: { title: "Checkout", intro: "Checkout করতে সাইন ইন করা প্রয়োজন। আপনার কার্ট ঠিক আছে—সাইন ইন করে এগিয়ে যান।" },
  signin: { title: "সাইন ইন", intro: "আপনার অর্ডার, বুকিং ও ওয়ারেন্টি এক জায়গায় দেখুন।" },
  register: { title: "অ্যাকাউন্ট তৈরি করুন", intro: "HomeFix BD-তে আপনার ঘরের জার্নি শুরু করুন।" },
  wishlist: { title: "আপনার Wishlist", intro: "পছন্দের পণ্যগুলো এখানে রেখে দিন।" },
  compare: { title: "Compare products", intro: "দুটি পণ্যের বৈশিষ্ট্য পাশাপাশি দেখে সিদ্ধান্ত নিন।" },
  admin: { title: "Admin workspace", intro: "অর্ডার, পণ্য, বুকিং ও টেকনিশিয়ান এক জায়গা থেকে পরিচালনা করুন।" },
  technician: { title: "Technician dashboard", intro: "আজকের কাজ, অনুরোধ ও আয়ের সারাংশ।" },
  seller: { title: "Seller dashboard", intro: "পণ্য, স্টক ও অর্ডারের কাজের জায়গা।" },
  account: { title: "আপনার অ্যাকাউন্ট", intro: "অর্ডার, বুকিং, ঠিকানা ও ওয়ারেন্টি।" },
};

export default async function GenericPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path[0] ?? "home";
  if (key === "admin") {
    const session = await auth();
    console.log("[admin-debug] session.user:", session?.user ?? null);
  }
  const label = labels[key] ?? { title: "HomeFix BD", intro: "আপনার ঘরের কাজ একটু সহজ হোক।" };
  return <Storefront><main className="mx-auto flex min-h-[55vh] max-w-4xl flex-col justify-center px-4 py-16 sm:px-6"><p className="text-xs uppercase tracking-[.2em] text-sale">HomeFix BD · {path.join(" / ")}</p><h1 className="display mt-4 text-5xl font-semibold">{label.title}</h1><p className="mt-5 max-w-xl text-lg leading-8 text-foreground/60">{label.intro}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="bg-foreground px-5 py-3 text-sm font-semibold text-background">Browse products</Link><Link href="/services" className="border border-foreground px-5 py-3 text-sm font-semibold">Explore services</Link></div></main></Storefront>;
}
