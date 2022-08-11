import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Box,
  Button,
  Flex,
  styled,
  Heading,
  Promo,
  Text,
  useSnackbar,
} from "@livepeer/design-system";

import { Asset } from "@livepeer.studio/api";
import { CopyIcon } from "@radix-ui/react-icons";
import { useCallback, useMemo, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import IpfsIcon from "../../../public/img/icons/ipfs-logo.svg";
import { useApi } from "hooks";
import Spinner from "../Spinner";

const StyledIpfsIcon = styled(IpfsIcon, {
  color: "$gray",
  mr: "$2",
});

const AssetOverviewTab = ({ asset }: { asset?: Asset | null }) => {
  const { patchAsset } = useApi();

  // uploading state will exist until the asset is refetched by polling & ipfs CID exists
  const [isUploading, setIsUploading] = useState(false);

  const onClickUploadIpfs = useCallback(async () => {
    setIsUploading(true);

    if (asset?.id) {
      await patchAsset(asset.id, {
        storage: {
          ipfs: true,
        },
      });
    }
  }, [asset, patchAsset]);

  const [openSnackbar] = useSnackbar();

  const metadataStringified = useMemo(
    () => (asset?.meta ? JSON.stringify(asset.meta, null, 4) : ""),
    [asset?.meta]
  );

  return (
    <>
      <Box>
        {metadataStringified && (
          <>
            <Box
              css={{
                borderBottom: "1px solid",
                borderColor: "$neutral6",
                pb: "$2",
                mb: "$3",
                width: "100%",
              }}>
              <Heading size="1" css={{ fontWeight: 500, mb: "$1" }}>
                Overview
              </Heading>
            </Box>
            <Promo size="2" css={{ mb: "$5" }}>
              <CopyToClipboard
                text={metadataStringified}
                onCopy={() => openSnackbar("Copied metadata to clipboard")}>
                <Flex css={{ cursor: "pointer" }}>
                  <Box>
                    <Flex align="center">
                      <Text
                        size="2"
                        css={{
                          fontSize: "14px",
                          mr: "$1",
                          fontWeight: 500,
                        }}>
                        Metadata
                      </Text>
                      <CopyIcon />
                    </Flex>
                    <Text variant="gray" size="2" css={{ mt: "$1" }}>
                      {metadataStringified}
                    </Text>
                  </Box>
                </Flex>
              </CopyToClipboard>
            </Promo>
          </>
        )}
        <Box
          css={{
            borderBottom: "1px solid",
            borderColor: "$neutral6",
            pb: "$2",
            mb: "$3",
            width: "100%",
          }}>
          <Heading size="1" css={{ fontWeight: 500, mb: "$1" }}>
            Decentralized Storage Providers
          </Heading>
        </Box>
        <Promo size="2">
          <Flex css={{ justifyContent: "space-between" }}>
            <Flex align="center">
              <StyledIpfsIcon />

              <Text size="3">IPFS</Text>
            </Flex>

            {!asset?.storage?.ipfs?.cid && (
              <>
                <Button
                  onClick={onClickUploadIpfs}
                  css={{
                    display: "inline-flex",
                    ai: "center",
                  }}
                  size="2"
                  disabled={
                    Boolean(asset?.status?.phase !== "ready") || isUploading
                  }
                  variant="primary">
                  {isUploading && (
                    <Spinner
                      css={{
                        color: "$hiContrast",
                        width: 16,
                        height: 16,
                        mr: "$2",
                      }}
                    />
                  )}
                  <Box>Upload to IPFS</Box>
                </Button>
              </>
            )}
          </Flex>
          {asset?.storage?.ipfs?.cid && (
            <Box css={{ mt: "$3" }}>
              <CopyToClipboard
                text={`ipfs://${asset.storage.ipfs.cid}`}
                onCopy={() => openSnackbar("Copied IPFS CID to clipboard")}>
                <Flex css={{ cursor: "pointer" }}>
                  <Box>
                    <Flex align="center">
                      <Text
                        size="2"
                        css={{
                          fontSize: "14px",
                          mr: "$1",
                          fontWeight: 500,
                        }}>
                        Content Hash
                      </Text>
                      <CopyIcon />
                    </Flex>
                    <Text
                      variant="gray"
                      size="2"
                      css={{ mt: "$1", lineHeight: 1.4 }}>
                      ipfs://{asset?.storage?.ipfs?.cid}
                    </Text>
                  </Box>
                </Flex>
              </CopyToClipboard>
            </Box>
          )}
        </Promo>
      </Box>
    </>
  );
};

export default AssetOverviewTab;
