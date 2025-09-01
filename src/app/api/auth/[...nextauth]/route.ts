import NextAuth, { SessionStrategy, type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import ldap from "ldapjs";

// Ensure this route runs on the Node.js runtime (ldapjs requires Node APIs)
export const runtime = "nodejs";

const ldapConfig = {
  url: "ldap://users.iitmandi.ac.in:389",
  baseDN: "dc=iitmandi,dc=ac,dc=in",
  ou: ["students_ug","Faculty", "Staff"],
};

type LdapUser = { uid: string; cn: string; mail: string; ou: string };

async function authenticateWithLDAP(username: string, password: string): Promise<LdapUser | null> {
  // Try OUs sequentially; add timeouts so we don't hang forever
  for (const ou of ldapConfig.ou) {
    const attempt = await new Promise<LdapUser | null>((resolve) => {
      const client = ldap.createClient({
        url: ldapConfig.url,
        timeout: 5000,
        connectTimeout: 5000,
      });

      const dn = `uid=${username},ou=${ou},${ldapConfig.baseDN}`;

      let settled = false;

      const done = (result: LdapUser | null) => {
        if (settled) return;
        settled = true;
        try {
          client.unbind();
        } catch {}
        resolve(result);
      };

      // Safety timeout in case the server doesn't respond
      const safetyTimer = setTimeout(() => done(null), 6000);

      client.bind(dn, password, (err: Error | null) => {
        clearTimeout(safetyTimer);
        if (err) return done(null);
        return done({ uid: username, cn: username, mail: `${username}@iitmandi.ac.in`, ou });
      });

      client.on("error", () => done(null));
    });

    if (attempt) return attempt;
  }
  return null;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "LDAP",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const user = await authenticateWithLDAP(credentials.username, credentials.password);
        if (!user) return null;
        return { id: user.uid, name: user.cn, email: user.mail, ou: user.ou };
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  jwt: {
    maxAge: 60 * 60 * 8, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.ou = user.ou;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id;
      session.user.ou = token.ou;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
