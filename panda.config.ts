import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],

  theme: {
    extend: {
      tokens: {
        colors: {
          brand: {
            50:  { value: "#eff6ff" },
            100: { value: "#dbeafe" },
            200: { value: "#bfdbfe" },
            500: { value: "#3b82f6" },
            600: { value: "#2563eb" },
            700: { value: "#1d4ed8" },
            900: { value: "#1e3a8a" },
          },
          tier: {
            1: { value: "#dc2626" },
            2: { value: "#d97706" },
            3: { value: "#16a34a" },
          },
        },
        fonts: {
          sans: { value: "var(--font-geist-sans), system-ui, sans-serif" },
          mono: { value: "var(--font-geist-mono), monospace" },
        },
        radii: {
          sm:  { value: "4px" },
          md:  { value: "8px" },
          lg:  { value: "12px" },
          full: { value: "9999px" },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            default:  { value: { base: "#ffffff", _dark: "#0a0a0a" } },
            subtle:   { value: { base: "#f9fafb", _dark: "#111827" } },
            muted:    { value: { base: "#f3f4f6", _dark: "#1f2937" } },
          },
          fg: {
            default:  { value: { base: "#111827", _dark: "#f9fafb" } },
            muted:    { value: { base: "#6b7280", _dark: "#9ca3af" } },
            subtle:   { value: { base: "#9ca3af", _dark: "#6b7280" } },
          },
          border: {
            default: { value: { base: "#e5e7eb", _dark: "#374151" } },
          },
        },
      },
    },
  },

  outdir: "styled-system",
});
