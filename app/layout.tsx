import type { Metadata } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: { default: "HomeFix BD", template: "%s | HomeFix BD" },
  description: "বাসার সব প্রয়োজন, এক প্ল্যাটফর্মে। Every home need, one platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${inter.variable} ${hind.variable}`}>
      <body className="min-h-screen"><Providers>{children}</Providers></body>
    </html>
  );
}
