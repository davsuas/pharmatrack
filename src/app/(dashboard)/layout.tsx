import { redirect } from "next/navigation";
import { getUserRole } from "@/src/lib/auth/get-user-role";
import { signOut } from "@/src/app/(auth)/sign-in/actions";
import { css } from "@/styled-system/css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();

  if (!role) redirect("/sign-in");

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    dm: "District Manager",
    pm: "Product Manager",
    msr: "Medical Sales Representative",
  };

  return (
    <div className={css({ display: "flex", flexDir: "column", minH: "100vh", bg: "bg.subtle" })}>
      <header className={css({ bg: "bg.default", borderBottom: "1px solid", borderColor: "border.default", px: "6", py: "3", display: "flex", alignItems: "center", justifyContent: "space-between" })}>
        <span className={css({ fontWeight: "semibold", color: "fg.default", fontFamily: "sans" })}>PharmaTrack</span>
        <div className={css({ display: "flex", alignItems: "center", gap: "4" })}>
          <span className={css({ fontSize: "sm", color: "fg.muted" })}>{roleLabel[role]}</span>
          <form action={signOut}>
            <button
              type="submit"
              className={css({ fontSize: "sm", color: "brand.600", cursor: "pointer", bg: "transparent", border: "none", _hover: { color: "brand.700" } })}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className={css({ flex: "1", p: "6" })}>{children}</main>
    </div>
  );
}
