"use server";

import { redirect } from "next/navigation";
import { login as doLogin, logout as doLogout } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const ok = await doLogin(email, password);
  if (!ok) return { error: "Onjuiste combinatie van e-mail en wachtwoord." };

  redirect("/");
}

export async function logoutAction() {
  await doLogout();
  redirect("/login");
}
