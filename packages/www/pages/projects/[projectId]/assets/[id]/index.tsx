import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { useApi } from "hooks";
import AssetDetail from "layouts/assetDetail";
import AssetOverviewTab from "components/AssetDetails/AssetOverviewTab";
import AssetEventLogTab from "components/AssetDetails/AssetEventLogTab";
import { Asset } from "@livepeer.studio/api";
<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/assets/[id]/index.tsx
import Ripe, { categories, pages } from "lib/ripe";
import useProject from "hooks/use-project";

Ripe.trackPage({
  category: categories.DASHBOARD,
  name: pages.ASSET,
});
========
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/assets/[id]/index.tsx

const refetchInterval = 5 * 1000;

const AssetDetails = () => {
  const router = useRouter();
  const { getAsset, getTotalViews } = useApi();
  const [currentTab, setCurrentTab] = useState<"Overview" | "Event Logs">(
    "Overview"
  );
  const [editAssetDialogOpen, setEditAssetDialogOpen] = useState(false);
  const [embedVideoDialogOpen, setEmbedVideoDialogOpen] = useState(false);
  const { appendProjectId } = useProject();

  const { query } = router;
  const id = query.id as string;

  const { data: asset, refetch: refetchAsset } = useQuery(
    ["asset", id],
    () => getAsset(id),
    {
      refetchInterval,
      enabled: Boolean(id),
    }
  );

  const { data: totalViews } = useQuery(
    ["totalViews", id],
    () => getTotalViews(id),
    {
      refetchInterval,
      enabled: Boolean(id),
    }
  );

  return (
    <AssetDetail
      activeTab={currentTab}
      asset={asset as Asset}
      totalViews={totalViews}
      setSwitchTab={setCurrentTab}
      editAssetDialogOpen={editAssetDialogOpen}
      setEditAssetDialogOpen={setEditAssetDialogOpen}
      embedVideoDialogOpen={embedVideoDialogOpen}
      setEmbedVideoDialogOpen={setEmbedVideoDialogOpen}
      refetchAsset={() => refetchAsset()}
      breadcrumbs={[
<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/assets/[id]/index.tsx
        { title: "Assets", href: appendProjectId("/assets") },
========
        { title: "Assets", href: "/assets" },
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/assets/[id]/index.tsx
        { title: asset?.name },
      ]}>
      {currentTab === "Overview" ? (
        <AssetOverviewTab
          asset={asset}
          onEditAsset={() => setEditAssetDialogOpen(true)}
        />
      ) : (
        <AssetEventLogTab asset={asset} />
      )}
    </AssetDetail>
  );
};

export default AssetDetails;
