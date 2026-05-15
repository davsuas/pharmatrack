import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getCampaigns } from "@/lib/campaigns/campaign-service";
import { getCycles } from "@/lib/cycles/cycle-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateCampaignForm } from "./create-campaign-form";
import { ActivateCampaignButton } from "./activate-campaign-button";

const statusVariant = {
  draft: "secondary",
  active: "default",
  closed: "outline",
} as const;

export default async function CampaignsPage() {
  const role = await getUserRole();
  if (role !== "pm") redirect("/dashboard");

  const [campaigns, cycles] = await Promise.all([getCampaigns(), getCycles()]);
  const activeCycles = cycles.filter((c) => c.status === "active");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create and manage promotional campaigns per cycle.
        </p>
      </div>

      <CreateCampaignForm cycles={activeCycles} />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">All campaigns</h2>
        {campaigns.length === 0 && (
          <p className="text-muted-foreground text-sm">No campaigns yet.</p>
        )}
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader className="flex flex-row items-center justify-between py-4 gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Campaign
                  <Badge variant={statusVariant[campaign.status]}>
                    {campaign.status}
                  </Badge>
                </CardTitle>
                <CardDescription>Cycle: {campaign.cycleId}</CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/pm/campaigns/${campaign.id}/grids`}>
                    Manage grids
                  </Link>
                </Button>
                {campaign.status === "draft" && (
                  <ActivateCampaignButton campaignId={campaign.id} />
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
