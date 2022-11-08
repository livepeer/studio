import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { useApi } from "hooks";
import AssetDetail from "layouts/assetDetail";
import AssetOverviewTab from "@components/Dashboard/AssetDetails/AssetOverviewTab";
import AssetEventLogTab from "@components/Dashboard/AssetDetails/AssetEventLogTab";
import { Asset } from "livepeer";

const refetchInterval = 5 * 1000;

const AssetDetails = () => {
  const router = useRouter();
  const { getAsset, getTotalViews } = useApi();
  const [currentTab, setCurrentTab] = useState<"Overview" | "Event Logs">(
    "Overview"
  );
  const [editAssetDialogOpen, setEditAssetDialogOpen] = useState(false);
  const [embedVideoDialogOpen, setEmbedVideoDialogOpen] = useState(false);
  const [mintNftDialogOpen, setMintNftDialogOpen] = useState(false);

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
      breadcrumbs={[
        { title: "Assets", href: "/dashboard/assets" },
        { title: asset?.name },
      ]}
      asset={asset as Asset}
      totalViews={totalViews}
      setSwitchTab={setCurrentTab}
      activeTab={currentTab}
      refetchAsset={refetchAsset}
      editAssetDialogOpen={editAssetDialogOpen}
      setEditAssetDialogOpen={setEditAssetDialogOpen}
      embedVideoDialogOpen={embedVideoDialogOpen}
      setEmbedVideoDialogOpen={setEmbedVideoDialogOpen}
      mintNftDialogOpen={mintNftDialogOpen}
      setMintNftDialogOpen={setMintNftDialogOpen}>
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
