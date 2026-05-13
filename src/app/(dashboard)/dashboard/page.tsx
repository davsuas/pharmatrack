import { redirect } from "next/navigation";
import { getUserRole } from "@/src/lib/auth/get-user-role";

export default async function DashboardPage() {
  const role = await getUserRole();

  if (!role) redirect("/sign-in");

  redirect(`/dashboard/${role}`);
}
