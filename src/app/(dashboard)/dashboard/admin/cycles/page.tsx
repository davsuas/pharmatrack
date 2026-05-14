import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getCycles } from "@/lib/cycles/cycle-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateCycleForm } from "./create-cycle-form";
import { CloseCycleButton } from "./close-cycle-button";

const statusVariant = {
  active: "default",
  completed: "secondary",
} as const;

export default async function CyclesPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/dashboard");

  const cycles = await getCycles();
  const activeCycle = cycles.find((c) => c.status === "active");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Cycles</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage 22-business-day promotional cycles.
        </p>
      </div>

      {!activeCycle && <CreateCycleForm />}

      {activeCycle && (
        <Card className="border-primary">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Active cycle
                <Badge variant="default">active</Badge>
              </CardTitle>
              <CardDescription>
                {activeCycle.startDate} → {activeCycle.endDate} · {activeCycle.workingDayCount} working days
              </CardDescription>
            </div>
            <CloseCycleButton cycleId={activeCycle.id} />
          </CardHeader>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">All cycles</h2>
        {cycles.length === 0 && (
          <p className="text-muted-foreground text-sm">No cycles yet.</p>
        )}
        {cycles.map((cycle) => (
          <Card key={cycle.id}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {cycle.startDate} → {cycle.endDate}
                  <Badge variant={statusVariant[cycle.status]}>
                    {cycle.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{cycle.workingDayCount} working days</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
