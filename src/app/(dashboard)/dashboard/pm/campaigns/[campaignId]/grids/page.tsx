import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getGridsForCampaign } from "@/lib/campaigns/grid-service";
import { getProductLines } from "@/lib/hcps/hcp-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GridForm } from "./grid-form";

export default async function GridsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const role = await getUserRole();
  if (role !== "pm") redirect("/dashboard");

  const [grids, productLines] = await Promise.all([
    getGridsForCampaign(campaignId),
    getProductLines(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Promotional Grids</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Define call frequency, visit duration, and product positioning per tier.
        </p>
      </div>

      <GridForm campaignId={campaignId} productLines={productLines} />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Current grid rows</h2>
        {grids.length === 0 && (
          <p className="text-muted-foreground text-sm">No grid rows yet.</p>
        )}
        {grids.map((grid) => (
          <Card key={grid.id}>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                {productLines.find((pl) => pl.id === grid.productLineId)?.name ?? grid.productLineId}
                <Badge variant="outline">Tier {grid.tier}</Badge>
              </CardTitle>
              <CardDescription>
                {grid.callsPerCycle} calls/cycle · {grid.minVisitDurationMinutes} min ·{" "}
                {grid.position1Product}
                {grid.position2Product && ` / ${grid.position2Product}`}
                {grid.message && ` — "${grid.message}"`}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
