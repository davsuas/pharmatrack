import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getProductLines } from "@/lib/hcps/hcp-service";
import { ImportForm } from "./import-form";

export default async function HCPsPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/dashboard");

  const productLines = await getProductLines();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">HCP Panel Import</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a CSV per product line. Each row is geocoded automatically.
        </p>
      </div>
      <ImportForm productLines={productLines} />
    </div>
  );
}
