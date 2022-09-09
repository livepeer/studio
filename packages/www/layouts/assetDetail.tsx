import EditAssetDialog, {
  EditAssetReturnValue,
} from "@components/Dashboard/AssetDetails/EditAssetDialog";
import ShowURL from "@components/Dashboard/ShowURL";
import { Asset } from "@livepeer.studio/api";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
  Link as A,
  Status,
  Text,
  Tooltip,
  useSnackbar,
} from "@livepeer/design-system";
import {
  CopyIcon as Copy,
  DownloadIcon,
  Pencil1Icon,
  PlayIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import Player from "components/Dashboard/Player";
import RelativeTime from "components/Dashboard/RelativeTime";
import Spinner from "components/Dashboard/Spinner";
import { useApi, useLoggedIn } from "hooks";
import Layout, { Breadcrumb } from "layouts/dashboard";
import numeral from "numeral";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Cell = ({ children, css = {} }) => {
  return (
    <Flex align="center" css={{ height: 22, mb: "$3", ...css }}>
      {children}
    </Flex>
  );
};

const ClipBut = ({ text }) => {
  const [isCopied, setCopied] = useState(0);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  return (
    <HoverCardRoot openDelay={200}>
      <HoverCardTrigger>
        <Flex css={{ ai: "center" }}>
          <CopyToClipboard
            text={text}
            onCopy={() => {
              openSnackbar("Copied to clipboard");
              setCopied(2000);
            }}>
            <Flex
              css={{
                alignItems: "center",
                cursor: "pointer",
                ml: 0,
                mr: 0,
              }}>
              <Box css={{ mr: "$1" }}>{text}</Box>
              <Copy
                css={{
                  mr: "$2",
                  width: 14,
                  height: 14,
                  color: "$hiContrast",
                }}
              />
            </Flex>
          </CopyToClipboard>
        </Flex>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text
          variant="gray"
          css={{
            backgroundColor: "$panel",
            borderRadius: 6,
            px: "$3",
            py: "$1",
            fontSize: "$1",
            display: "flex",
            ai: "center",
          }}>
          <Box>{isCopied ? "Copied" : "Copy to Clipboard"}</Box>
        </Text>
      </HoverCardContent>
    </HoverCardRoot>
  );
};

export type AssetDetailProps = {
  asset: Asset;
  children: React.ReactNode;
  totalViews: number;
  breadcrumbs: Breadcrumb[];
  activeTab: "Overview" | "Event Logs";
  setSwitchTab: Dispatch<SetStateAction<"Overview" | "Event Logs">>;

  refetchAsset: () => void;

  editAssetDialogOpen: boolean;
  setEditAssetDialogOpen: Dispatch<SetStateAction<boolean>>;
};

const AssetDetail = ({
  breadcrumbs,
  children,
  asset,
  totalViews,
  setSwitchTab,
  activeTab = "Overview",
  editAssetDialogOpen,
  setEditAssetDialogOpen,
  refetchAsset,
}: AssetDetailProps) => {
  useLoggedIn();
  const { user, patchAsset } = useApi();

  const [isCopied, setCopied] = useState(0);

  const videoTrack = useMemo(
    () => asset?.videoSpec?.tracks?.find((t) => t?.type === "video"),
    [asset?.videoSpec]
  );

  const onEditAsset = useCallback(
    async (v: EditAssetReturnValue) => {
      if (asset?.id && (v?.name || v?.metadata)) {
        await patchAsset(asset.id, {
          ...(v?.name ? { name: v.name } : {}),
          ...(v?.metadata
            ? { meta: v.metadata as Record<string, string> }
            : {}),
        });
        await refetchAsset();
      }
    },
    [asset, patchAsset, refetchAsset]
  );

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
      <Layout id="assets" breadcrumbs={breadcrumbs}>
        <Box css={{ px: "$6", py: "$7" }}>
          {asset != undefined && totalViews != undefined ? (
            <>
              <Flex>
                <Box
                  css={{
                    minWidth: 424,
                    flex: "0 0 33%",
                  }}>
                  <Box
                    css={{
                      mb: "$5",
                      width: "100%",
                    }}>
                    <Heading size="2" css={{ mb: "$3" }}>
                      <Flex css={{ ai: "center" }}>
                        <Box
                          css={{
                            fontWeight: 600,
                            letterSpacing: "0",
                            mr: "$2",
                          }}>
                          {asset.name.length > 26
                            ? `${asset.name.slice(0, 26)}...`
                            : asset.name}
                        </Box>
                      </Flex>
                    </Heading>
                    <Flex align="center">
                      <Tooltip
                        css={{ bc: "$neutral3", color: "$neutral3" }}
                        content={
                          <Box css={{ color: "$hiContrast" }}>
                            Views are defined as at least 1 second of watch
                            time.
                          </Box>
                        }>
                        <Flex align="center" css={{ mr: "$3", fontSize: "$2" }}>
                          <Box as={PlayIcon} css={{ mr: "$1" }} /> {totalViews}{" "}
                          views
                        </Flex>
                      </Tooltip>
                      <Flex align="center" css={{ fontSize: "$2" }}>
                        <Box as={CalendarIcon} css={{ mr: "$1" }} />
                        <RelativeTime
                          id="cat"
                          prefix="createdat"
                          tm={asset.createdAt}
                          swap={true}
                        />
                      </Flex>
                    </Flex>
                  </Box>

                  <Box>
                    <Box
                      css={{
                        maxWidth: "470px",
                        justifySelf: "flex-end",
                        width: "100%",
                      }}>
                      <Box
                        css={{
                          borderRadius: "$3",
                          overflow: "hidden",
                          position: "relative",
                          mb: "$5",
                        }}>
                        {asset?.status?.phase === "ready" &&
                        asset.playbackUrl ? (
                          <Player src={asset.playbackUrl} autoPlay={false} />
                        ) : asset?.status?.phase === "failed" ? (
                          <Box
                            css={{
                              width: "100%",
                              height: 265,
                              borderRadius: "$2",
                              overflow: "hidden",
                              position: "relative",
                              bc: "#28282c",
                            }}>
                            <Badge
                              size="2"
                              variant="red"
                              css={{
                                position: "absolute",
                                zIndex: 1,
                                left: 10,
                                top: 10,
                                letterSpacing: 0,
                              }}>
                              <Box css={{ mr: 5 }}>
                                <Status variant="red" size="1" />
                              </Box>
                              Failed
                            </Badge>
                          </Box>
                        ) : (
                          <Box
                            css={{
                              width: "100%",
                              height: 265,
                              borderRadius: "$2",
                              overflow: "hidden",
                              position: "relative",
                              bc: "#28282c",
                            }}>
                            <Badge
                              size="2"
                              css={{
                                backgroundColor: "$primary7",
                                position: "absolute",
                                zIndex: 1,
                                left: 10,
                                top: 10,
                                letterSpacing: 0,
                              }}>
                              <Box css={{ mr: 5 }}>
                                <Status
                                  css={{ backgroundColor: "$primary9" }}
                                  size="1"
                                />
                              </Box>
                              Processing
                            </Badge>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box
                      css={{
                        borderBottom: "1px solid",
                        borderColor: "$neutral6",
                        pb: "$2",
                        mb: "$4",
                        width: "100%",
                      }}>
                      <Heading size="1" css={{ fontWeight: 600 }}>
                        Details
                      </Heading>
                    </Box>
                    <Flex
                      css={{
                        justifyContent: "flex-start",
                        alignItems: "baseline",
                        flexDirection: "column",
                      }}>
                      <Box
                        css={{
                          display: "grid",
                          alignItems: "center",
                          gridTemplateColumns: "10em auto",
                          width: "100%",
                          fontSize: "$2",
                          position: "relative",
                        }}>
                        <Cell css={{ color: "$primary11" }}>Name</Cell>
                        <Cell>{asset.name}</Cell>
                        {asset?.playbackUrl && (
                          <>
                            <Cell css={{ color: "$primary11" }}>
                              Playback URL
                            </Cell>
                            <Cell css={{ cursor: "pointer" }}>
                              <ShowURL
                                url={asset.playbackUrl}
                                shortendUrl={asset.playbackUrl.replace(
                                  asset.playbackUrl.slice(29, 70),
                                  "…"
                                )}
                                anchor={false}
                              />
                            </Cell>
                          </>
                        )}
                        <Cell css={{ color: "$primary11" }}>Asset ID</Cell>
                        <Cell>
                          <ClipBut text={asset.id} />
                        </Cell>
                        <Cell css={{ color: "$primary11" }}>Created at</Cell>
                        <Cell>
                          <RelativeTime
                            id="cat"
                            prefix="createdat"
                            tm={asset.createdAt}
                            swap={true}
                          />
                        </Cell>
                        {videoTrack?.codec && (
                          <>
                            <Cell css={{ color: "$primary11" }}>Codec</Cell>
                            <Cell>{videoTrack.codec}</Cell>
                          </>
                        )}
                        {asset?.videoSpec?.format && (
                          <>
                            <Cell css={{ color: "$primary11" }}>Container</Cell>
                            <Cell>{asset.videoSpec.format}</Cell>
                          </>
                        )}
                        {asset.size && (
                          <>
                            <Cell css={{ color: "$primary11" }}>File size</Cell>
                            <Cell>
                              {numeral(asset.size)
                                .format("0,0.00 b")
                                .toLowerCase()}
                            </Cell>
                          </>
                        )}

                        {(asset?.videoSpec?.format ?? videoTrack?.bitrate) && (
                          <>
                            <Cell css={{ color: "$primary11" }}>Bitrate</Cell>
                            <Cell>
                              {numeral(
                                asset?.videoSpec?.bitrate ?? videoTrack?.bitrate
                              )
                                .format("0,0.00 b")
                                .toLowerCase()}
                              {"ps"}
                            </Cell>
                          </>
                        )}
                        {videoTrack?.width && videoTrack?.height && (
                          <>
                            <Cell css={{ color: "$primary11" }}>
                              Resolution
                            </Cell>
                            <Cell>
                              {videoTrack.width}
                              {"x"}
                              {videoTrack.height}
                            </Cell>
                          </>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                </Box>
                <Box css={{ flexGrow: 1, ml: "$8" }}>
                  <Flex
                    justify="between"
                    css={{
                      borderBottom: "1px solid",
                      borderColor: "$neutral6",
                      mb: "$4",
                      width: "100%",
                    }}>
                    <Box css={{ display: "flex" }}>
                      <Box
                        as="div"
                        onClick={() => setSwitchTab("Overview")}
                        css={{
                          pb: "$2",
                          width: "100%",
                          cursor: "pointer",
                          textDecoration: "none",
                          borderBottom: "2px solid",
                          borderColor:
                            activeTab === "Overview" ? "$blue9" : "transparent",
                          mr: "$5",
                          "&:hover": {
                            textDecoration: "none",
                          },
                        }}>
                        Overview
                      </Box>

                      <Box
                        as="div"
                        onClick={() => setSwitchTab("Event Logs")}
                        css={{
                          textDecoration: "none",
                          pb: "$2",
                          width: "100%",
                          cursor: "pointer",
                          borderBottom: "2px solid",
                          borderColor:
                            activeTab === "Event Logs"
                              ? "$blue9"
                              : "transparent",
                          whiteSpace: "nowrap",
                          "&:hover": {
                            textDecoration: "none",
                          },
                        }}>
                        Event Logs
                      </Box>
                    </Box>
                    <Box css={{ position: "relative", top: "-8px" }}>
                      <Flex align="center">
                        {asset?.downloadUrl && (
                          <A target="_blank" href={asset?.downloadUrl}>
                            <Button
                              size="2"
                              css={{
                                mr: "$1",
                              }}>
                              <Box
                                as={DownloadIcon}
                                css={{
                                  mr: "$1",
                                }}
                              />
                              Download
                            </Button>
                          </A>
                        )}
                        <Button
                          size="2"
                          onClick={() => setEditAssetDialogOpen(true)}
                          variant="primary">
                          <Box
                            as={Pencil1Icon}
                            css={{
                              mr: "$1",
                            }}
                          />
                          Edit Asset
                        </Button>
                      </Flex>
                    </Box>
                  </Flex>
                  <Box css={{ py: "$2" }}>{children}</Box>
                </Box>
              </Flex>
            </>
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
