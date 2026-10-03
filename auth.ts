import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { users } from "@/lib/mongodb";

const providers = [
  Credentials({
    name: "Credentials",
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password) return null;
      const user = await (await users()).findOne({ email });
      if (!user?.passwordHash || !(await compare(password, user.passwordHash))) return null;
      return { id: user.id ?? user._id.toString(), name: user.name, email: user.email, image: user.image, role: user.role };
    },
  }),
  ...(process.env.AUTH_GOOGLE_ID ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "" })] : []),
  ...(process.env.AUTH_GITHUB_ID ? [GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET ?? "" })] : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: { signIn: "/signin", error: "/signin" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "customer" | "technician" | "seller" | "admin";
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        const email = user.email.toLowerCase();
        await (await users()).updateOne(
          { email },
          { $set: { email, name: user.name ?? email, image: user.image ?? undefined, updatedAt: new Date().toISOString() }, $setOnInsert: { role: "customer", addresses: [], createdAt: new Date().toISOString() } },
          { upsert: true },
        );
      }
      return true;
    },
  },
});
