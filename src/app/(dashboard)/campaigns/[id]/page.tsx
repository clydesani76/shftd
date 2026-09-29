import { CampaignDetail } from "@/components/campaigns/campaign-detail";

// The detail component fetches the campaign from the API (real DB, with mock
// fallback) so both newly created and sample campaigns resolve.
export default function CampaignPage({ params }: { params: { id: string } }) {
  return <CampaignDetail campaignId={params.id} />;
}
