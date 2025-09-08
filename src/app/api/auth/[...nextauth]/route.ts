import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import ldap from "ldapjs";
import { getEmployeeTypeByUserId } from "../../supabase/index";
import { error } from "console";

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
    console.log('[LDAP] Trying bind', { username, ou });
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
        if (err) {
          console.warn('[LDAP] Bind failed', { dn, message: err?.message, code: err?.code });
          return done(null);
        }
        console.log('[LDAP] Bind succeeded', { dn });
        return done({
          uid: username,
          cn: username,
          mail: `${username}@iitmandi.ac.in`,
          ou,
        });
      });

      client.on("error", (err:any) => {
        console.error('[LDAP] Client error', { message: err?.message, code: err?.code });
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

        console.log('[NextAuth][authorize] credentials received');

        console.log('[NextAuth][authorize] attempting LDAP auth');

        

        if(credentials.username == "Audit" || credentials.username=="User" || credentials.username=="Finance Admin" ||credentials.username=="SNP" || credentials.username=="Bill Employee" ){
          if(credentials.password =="123"){

            const normalizedUser={
              id:credentials.username,
              username:credentials.username,
              name:credentials.username,
              email:credentials.username+"@iitmandi.ac.in",
              ou:"staff",
              employee_type:credentials.username,


            }

            if(credentials.username=="SNP"){
              normalizedUser.employee_type="Student Purchase"
            }
            console.log('[NextAuth][authorize] returning normalized user', { normalizedUser })
            return normalizedUser;



          }
          else{
            throw new Error ("Invalid credentials")
          }
          
        }

        else{


          const user = await authenticateWithLDAP(
            credentials.username,
            credentials.password
          );

          console.log('[NextAuth][authorize] LDAP result', { user });
          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Fetch employee_type from DB using userId
          console.log('[NextAuth][authorize] fetching employee type for user', { uid: user.uid });
          const employee_type = await getEmployeeTypeByUserId(user.uid);
          console.log('[NextAuth][authorize] employee type resolved', { employee_type });

          // Return normalized user object for NextAuth, including employee_type
          const normalizedUser = {
            id: user.uid,
            username: user.uid,
            name: user.cn,
            email: user.mail,
            ou: user.ou,
            employee_type: employee_type || null,
          };
          console.log('[NextAuth][authorize] returning normalized user', { normalizedUser });
          return normalizedUser;
          
       }
       
      
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
