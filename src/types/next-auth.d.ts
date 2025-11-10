import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      ou: string;
      employee_type?: string | null;
      employee_code?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    ou: string;
    employee_type?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    ou: string;
    employee_type?: string | null;
  }
}
