"use client";

import { redirect } from "next/navigation";
import SignInClient from "./SignInClient";
import { useEffect } from "react";
import { useAuthMode } from "@/components/AuthSessionProvider";

export default function SignInPage() {
  const { loginEnabled } = useAuthMode();

  useEffect(() => {
    if (!loginEnabled) {
      redirect("/");
    }
  }, [loginEnabled]);

  return <SignInClient />;
}
