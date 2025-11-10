import { NextResponse } from "next/server";

// This endpoint redirects the user to Azure AD B2C end_session endpoint to clear
// their federated SSO session. After logout we bounce back to /signin which will
// auto-trigger a fresh login.
//
// NOTE: end_session requires the policy (user flow) and the application client ID.
// We use post_logout_redirect_uri to bring the user back.
export async function GET() {
  const tenant = process.env.AZURE_AD_B2C_TENANT_NAME;
  const policy = process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW;
  const clientId = process.env.AZURE_AD_B2C_CLIENT_ID;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (!tenant || !policy || !clientId) {
    return NextResponse.json(
      { error: "Missing Azure AD B2C env variables for logout" },
      { status: 500 }
    );
  }

  // B2C end session URL pattern:
  // https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/logout
  const endSession = new URL(
    `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${policy}/oauth2/v2.0/logout`
  );

  endSession.searchParams.set("client_id", clientId);
  endSession.searchParams.set(
    "post_logout_redirect_uri",
    `${nextAuthUrl}/signin`
  );

  return NextResponse.redirect(endSession);
}
