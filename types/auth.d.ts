import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "technician" | "seller" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "customer" | "technician" | "seller" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "customer" | "technician" | "seller" | "admin";
  }
}
