import AssetChildrenHeadingBox from "components/AssetDetails/AssetChildrenHeadingBox";
import AssetDetailsBox from "components/AssetDetails/AssetDetailsBox";
import AssetHeadingBox from "components/AssetDetails/AssetHeadingBox";
import AssetPlayerBox from "components/AssetDetails/AssetPlayerBox/";
import EditAssetDialog, {
  EditAssetReturnValue,
} from "components/AssetDetails/EditAssetDialog";
import EmbedVideoDialog from "components/AssetDetails/EmbedVideoDialog";
import { Box, Flex } from "@livepeer/design-system";
import Spinner from "components/Spinner";
import { useApi, useLoggedIn } from "hooks";
import Layout, { Breadcrumb } from "layouts/dashboard";
import { Asset } from "@livepeer.studio/api";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { Clock10, TriangleAlert } from "lucide-react";
import { useRouter } from "next/router";
import { useSnackbar } from "@livepeer/design-system";
import { useProjectContext } from "context/ProjectContext";

export type AssetDetailProps = {
  asset?: Asset;
  children: React.ReactNode;
  totalViews: number;
  breadcrumbs: Breadcrumb[];
  activeTab: "Overview" | "Event Logs";
  setSwitchTab: Dispatch<SetStateAction<"Overview" | "Event Logs">>;
  refetchAsset: () => void;
  editAssetDialogOpen: boolean;
  setEditAssetDialogOpen: Dispatch<SetStateAction<boolean>>;
  embedVideoDialogOpen: boolean;
  setEmbedVideoDialogOpen: Dispatch<SetStateAction<boolean>>;
};

const AssetDetail = ({
  breadcrumbs,
  children,
  asset,
  totalViews,
  setSwitchTab,
  activeTab = "Overview",
  refetchAsset,
  editAssetDialogOpen,
  setEditAssetDialogOpen,
  embedVideoDialogOpen,
  setEmbedVideoDialogOpen,
}: AssetDetailProps) => {
  useLoggedIn();
  const { user, patchAsset, deleteAsset } = useApi();
  const [isCopied, setCopied] = useState(0);
  const router = useRouter();
  const [openSnackbar] = useSnackbar();
  const { appendProjectId } = useProjectContext();

  const onEditAsset = useCallback(
    async (v: EditAssetReturnValue) => {
      if (asset?.id && v?.name) {
        await patchAsset(asset.id, {
          ...(v?.name ? { name: v.name } : {}),
          // ...(v?.metadata
          //   ? { meta: v.metadata as Record<string, string> }
          //   : {}),
        });
        await refetchAsset();
      }
    },
    [asset, patchAsset, refetchAsset],
  );

  const onDeleteAsset = useCallback(async () => {
    if (!asset?.id) return;

    try {
      await deleteAsset(asset.id);
      openSnackbar("Asset deleted successfully");
      router.push(appendProjectId("/assets"));
    } catch (error) {
      console.error(error);
      openSnackbar("Error deleting asset. Please try again.");
    }
  }, [asset?.id, deleteAsset, openSnackbar, router, appendProjectId]);

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  if (!user) {
    return <Layout />;
  }

  return (
    <>
      <EditAssetDialog
        isOpen={editAssetDialogOpen}
        onOpenChange={setEditAssetDialogOpen}
        onEdit={onEditAsset}
        asset={asset}
      />
      <EmbedVideoDialog
        isOpen={embedVideoDialogOpen}
        onOpenChange={setEmbedVideoDialogOpen}
        playbackId={asset?.playbackId}
      />
      <Layout id="assets" breadcrumbs={breadcrumbs}>
        <Box css={{ px: "$6", py: "$4" }}>
          {asset?.status?.phase === "failed" ? (
            <Alert variant="destructive">
              <TriangleAlert size={18} />
              <AlertTitle>Internal error processing file</AlertTitle>
              <AlertDescription>{asset.status.errorMessage}</AlertDescription>
            </Alert>
          ) : asset?.status?.phase === "processing" ||
            asset?.status?.phase === "uploading" ? (
            <Alert variant="default">
              <Clock10 size={18} />
              <AlertTitle>
                <span className="capitalize">{asset.status.phase}</span> the
                asset
                {asset.status.progress
                  ? ` (${asset.status.progress * 100}%)`
                  : ""}
              </AlertTitle>
              <AlertDescription>
                Please wait while the asset is {asset.status.phase}. This might
                take a while.
              </AlertDescription>
            </Alert>
          ) : (
            <></>
          )}

          {asset !== undefined ? (
            <Flex
              css={{
                mt: "$4",
              }}>
              <Box
                css={{
                  minWidth: 424,
                  flex: "0 0 33%",
                }}>
                <AssetHeadingBox asset={asset} totalViews={totalViews} />
                <Box>
                  <AssetPlayerBox
                    asset={asset}
                    onEmbedVideoClick={() => setEmbedVideoDialogOpen(true)}
                  />
                  <AssetDetailsBox asset={asset} />
                </Box>
              </Box>
              <AssetChildrenHeadingBox
                children={children}
                activeTab={activeTab}
                setSwitchTab={setSwitchTab}
                setEditAssetDialogOpen={setEditAssetDialogOpen}
                onDeleteAsset={onDeleteAsset}
              />
            </Flex>
          ) : (
            <Flex
              css={{
                height: "calc(100vh - 300px)",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Spinner />
            </Flex>
          )}
        </Box>
      </Layout>
    </>
  );
};

export default AssetDetail;
