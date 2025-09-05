import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      ou: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    ou: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    ou: string;
  }
}
