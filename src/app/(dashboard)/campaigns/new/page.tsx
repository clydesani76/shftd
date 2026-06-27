import { Suspense } from "react";
import { CampaignWizard } from "@/components/campaigns/campaign-wizard";

// /campaigns/new — campaign builder wizard. Reads ?path=proven|original|both
// when arriving from the Strategy Engine.
export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading builder…</div>}>
      <CampaignWizard />
    </Suspense>
  );
}
