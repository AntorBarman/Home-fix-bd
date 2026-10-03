import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12"><div className="w-full max-w-md"><Link href="/" className="display block text-center text-3xl font-bold">HomeFix <span className="text-sale">BD</span></Link><div className="mt-8 bg-background p-6 shadow-sm sm:p-8">{children}</div></div></main>;
}
