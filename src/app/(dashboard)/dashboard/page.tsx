import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";

export default async function DashboardPage() {
  const role = await getUserRole();

  if (!role) redirect("/login");

  redirect(`/dashboard/${role}`);
}
