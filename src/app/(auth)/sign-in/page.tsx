"use client";

import { useActionState } from "react";
import { signIn } from "./actions";
import { css } from "@/styled-system/css";

const initialState = null;

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div className={css({ display: "flex", minH: "100vh", alignItems: "center", justifyContent: "center", bg: "bg.subtle" })}>
      <div className={css({ w: "full", maxW: "400px", p: "8", bg: "bg.default", rounded: "lg", shadow: "sm", border: "1px solid", borderColor: "border.default" })}>
        <h1 className={css({ fontSize: "xl", fontWeight: "semibold", mb: "6", color: "fg.default", fontFamily: "sans" })}>
          PharmaTrack
        </h1>

        <form action={formAction} className={css({ display: "flex", flexDir: "column", gap: "4" })}>
          <div className={css({ display: "flex", flexDir: "column", gap: "1" })}>
            <label
              htmlFor="email"
              className={css({ fontSize: "sm", fontWeight: "medium", color: "fg.default" })}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={css({
                px: "3",
                py: "2",
                fontSize: "sm",
                border: "1px solid",
                borderColor: "border.default",
                rounded: "md",
                outline: "none",
                _focus: { borderColor: "brand.500", ring: "2px", ringColor: "brand.200" },
                color: "fg.default",
                bg: "bg.default",
              })}
            />
          </div>

          <div className={css({ display: "flex", flexDir: "column", gap: "1" })}>
            <label
              htmlFor="password"
              className={css({ fontSize: "sm", fontWeight: "medium", color: "fg.default" })}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={css({
                px: "3",
                py: "2",
                fontSize: "sm",
                border: "1px solid",
                borderColor: "border.default",
                rounded: "md",
                outline: "none",
                _focus: { borderColor: "brand.500", ring: "2px", ringColor: "brand.200" },
                color: "fg.default",
                bg: "bg.default",
              })}
            />
          </div>

          {state?.error && (
            <p className={css({ fontSize: "sm", color: "red.600" })}>{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={css({
              mt: "2",
              py: "2",
              px: "4",
              bg: "brand.600",
              color: "white",
              fontSize: "sm",
              fontWeight: "medium",
              rounded: "md",
              cursor: "pointer",
              _hover: { bg: "brand.700" },
              _disabled: { opacity: "0.6", cursor: "not-allowed" },
            })}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
