import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import ldap from "ldapjs";
import { getEmployeeTypeByUserId } from "../../supabase/index";

export const runtime = "nodejs";

const ldapConfig = {
  url: "ldap://users.iitmandi.ac.in:389",
  baseDN: "dc=iitmandi,dc=ac,dc=in",
  ou: ["students_ug", "Faculty", "Staff"],
};

// ---------------- LDAP Authentication ----------------
async function authenticateWithLDAP(
  username: string,
  password: string
): Promise<null | { uid: string; cn: string; mail: string; ou: string }> {
  for (const ou of ldapConfig.ou) {
    const attempt = await new Promise<any>((resolve) => {
      const client = ldap.createClient({
        url: ldapConfig.url,
        timeout: 5000,
        connectTimeout: 5000,
      });

      const dn = `uid=${username},ou=${ou},${ldapConfig.baseDN}`;

      let settled = false;
      const done = (result: any) => {
        if (settled) return;
        settled = true;
        try {
          client.unbind();
        } catch {
          /* ignore */
        }
        resolve(result);
      };

      // Fail-safe timeout
      const timer = setTimeout(() => done(null), 6000);

      client.bind(dn, password, (err: any) => {
        clearTimeout(timer);
        if (err) return done(null);
        return done({
          uid: username,
          cn: username,
          mail: `${username}@iitmandi.ac.in`,
          ou,
        });
      });

      client.on("error", (err:any) => {
        done(null);
      });
    });

    if (attempt) return attempt;
  }
  return null;
}

// ---------------- NextAuth Configuration ----------------
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

        const user = await authenticateWithLDAP(
          credentials.username,
          credentials.password
        );

        if (!user) {
          throw new Error("Invalid credentials");
        }

        // Fetch employee_type from DB using userId
        const employee_type = await getEmployeeTypeByUserId(user.uid);

        // Return normalized user object for NextAuth, including employee_type
        return {
          id: user.uid,
          username: user.uid,
          name: user.cn,
          email: user.mail,
          ou: user.ou,
          employee_type: employee_type || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  jwt: {
    maxAge: 60 * 60 * 8, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
        token.ou = (user as any).ou;
        token.employee_type = (user as any).employee_type;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        username: token.username as string,
        ou: token.ou as string,
        employee_type: token.employee_type as string,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
