import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import { RouteSuggestion } from "./route-suggestion";

export default async function MSRRoutePage() {
  const role = await getUserRole();
  if (role !== "msr") redirect("/dashboard");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Today's Route</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
      <RouteSuggestion mapsApiKey={apiKey} />
    </div>
  );
}
