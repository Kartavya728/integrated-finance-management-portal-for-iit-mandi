import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// You can add GitHub, Google, etc. providers too

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 🔑 Example auth check (replace with your Supabase or DB check)
        if (
          credentials?.username === "testuser" &&
          credentials?.password === "password123"
        ) {
          return { id: "1", username: "testuser", name: "Test User" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
