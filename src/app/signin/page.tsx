import SignInClient from "./SignInClient";

export default function SignInPage() {
  // The middleware now handles the redirection if the login is disabled.
  // If we reach here, the login must be enabled.
  return <SignInClient />;
}
