"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="email">
          E-mailadres
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
          placeholder="jij@studioprins.nl"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••••"
        />
      </div>

      {state.error && (
        <p
          className="text-sm rounded-[10px] px-3 py-2"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-1" disabled={pending}>
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}
