import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { useApi } from "hooks";
import AssetDetail from "layouts/assetDetail";
import AssetOverviewTab from "@components/Dashboard/AssetDetails/AssetOverviewTab";
import AssetEventLogTab from "@components/Dashboard/AssetDetails/AssetEventLogTab";

const refetchInterval = 5 * 1000;

const AssetDetails = () => {
  const router = useRouter();
  const { getAsset } = useApi();
  const [currentTab, setCurrentTab] = useState<"Overview" | "Event Logs">(
    "Overview"
  );
  const [editAssetDialogOpen, setEditAssetDialogOpen] = useState(false);

  const { query } = router;
  const id = query.id as string;

  const { data: asset, refetch: refetchAsset } = useQuery(
    [id],
    () => getAsset(id),
    {
      refetchInterval,
      enabled: Boolean(id),
    }
  );

  return (
    <AssetDetail
      activeTab={currentTab}
      asset={asset}
      setSwitchTab={setCurrentTab}
      editAssetDialogOpen={editAssetDialogOpen}
      setEditAssetDialogOpen={setEditAssetDialogOpen}
      refetchAsset={() => refetchAsset()}
      breadcrumbs={[
        { title: "Assets", href: "/dashboard/assets" },
        { title: asset?.name },
      ]}>
      {currentTab === "Overview" ? (
        <AssetOverviewTab asset={asset} />
      ) : (
        <AssetEventLogTab asset={asset} />
      )}
    </AssetDetail>
  );
};

export default AssetDetails;
