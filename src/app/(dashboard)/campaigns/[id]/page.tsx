import { notFound } from "next/navigation";
import { getCampaign } from "@/lib/data";
import { CampaignDetail } from "@/components/campaigns/campaign-detail";

export default function CampaignPage({ params }: { params: { id: string } }) {
  const campaign = getCampaign(params.id);
  if (!campaign) notFound();
  return <CampaignDetail campaignId={params.id} />;
}
