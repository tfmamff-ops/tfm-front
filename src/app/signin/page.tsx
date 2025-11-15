import { redirect } from "next/navigation";
import { isLoginEnabled } from "@/config/auth";
import SignInClient from "./SignInClient";

export default function SignInPage() {
  if (!isLoginEnabled()) {
    redirect("/");
  }
  return <SignInClient />;
}
