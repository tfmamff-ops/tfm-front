import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADB2CProvider from "next-auth/providers/azure-ad-b2c";

interface AzureB2CProfile {
  name?: string;
  displayName?: string;
  email?: string;
  jobTitle?: string;
  [key: string]: any;
}

// Normalize a job title string into a simple role slug.
// Example: "QA Operator" -> "qa_operator"
function normalizeJobTitle(jobTitle?: string | null): string {
  if (!jobTitle) return "unknown";
  return jobTitle
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_]/g, "");
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADB2CProvider({
      tenantId: process.env.AZURE_AD_B2C_TENANT_NAME!,
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
      primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW!,
      // authorization: { params: { scope: "openid profile email offline_access" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    // Runs when token is created or updated.
    async jwt({ token, profile }) {
      if (profile) {
        const p = profile as AzureB2CProfile;
        token.name = p.name || p.displayName || token.name;
        token.email = p.email || token.email;
        token.jobTitle = p.jobTitle || null;
      }
      return token;
    },
    // Shapes what the client receives.
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = normalizeJobTitle(token.jobTitle || null);
      }
      return session;
    },
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
