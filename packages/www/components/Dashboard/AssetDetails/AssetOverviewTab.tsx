import {
  Link as A,
  Box,
  Button,
  Flex,
  styled,
  Heading,
  Promo,
  Text,
} from "@livepeer/design-system";

import { Asset } from "@livepeer.studio/api";
import { useCallback, useMemo, useState } from "react";

import IpfsIcon from "../../../public/img/icons/ipfs-logo.svg";
import CurlyBracesIcon from "../../../public/img/icons/curly-braces.svg";
import DatabaseIcon from "../../../public/img/icons/database.svg";
import { useApi } from "hooks";
import Spinner from "../Spinner";
import moment from "moment";
import ClipButton from "../ClipButton";

const StyledIpfsIcon = styled(IpfsIcon, {
  color: "$gray",
  mr: "$2",
});

const StyledCurlyBracesIcon = styled(CurlyBracesIcon, {
  color: "$gray",
  mr: "$2",
});

const StyledDatabaseIcon = styled(DatabaseIcon, {
  color: "$gray",
  mr: "$2",
});

const AssetOverviewTab = ({
  asset,
  onEditAsset,
}: {
  asset?: Asset | null;
  onEditAsset: () => void;
}) => {
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

  const tagsStringified = useMemo(
    () => (asset?.tags ? JSON.stringify(asset.tags, null, 4) : ""),
    [asset?.tags]
  );

  return (
    <>
      <Box>
        <Box
          css={{
            mb: "$3",
            width: "100%",
          }}>
          <Flex css={{ mb: "$2" }} align="center">
            <StyledCurlyBracesIcon />
            <Heading size="1" css={{ fontWeight: 500 }}>
              Tags
            </Heading>
          </Flex>
          <Text variant="gray" size="2">
            A list of key value pairs that you use to add information to your
            video.{" "}
            <A css={{ cursor: "pointer" }} onClick={onEditAsset}>
              Edit asset
            </A>{" "}
            to add tags.
          </Text>
        </Box>
        <Promo size="2" css={{ mb: "$5" }}>
          {tagsStringified ? (
            <Flex
              align="center"
              css={{
                cursor: "pointer",
                justifyContent: "space-between",
              }}>
              <Text variant="gray" size="2">
                {tagsStringified}
              </Text>

              <Box>
                <ClipButton
                  value={tagsStringified}
                  successMessage="Copied tags to clipboard"
                />
              </Box>
            </Flex>
          ) : (
            <Text
              size="3"
              css={{
                mr: "$1",
              }}>
              No tags set yet
            </Text>
          )}
        </Promo>

        <Box
          css={{
            mb: "$3",
            width: "100%",
          }}>
          <Flex css={{ mb: "$2" }} align="center">
            <StyledDatabaseIcon />
            <Heading size="1" css={{ fontWeight: 500 }}>
              Decentralized Storage Providers
            </Heading>
          </Flex>
          <Text variant="gray" size="2">
            By default video assets are stored in the Livepeer Studio database,
            but you may also replicate them to the following decentralized
            storage providers.
          </Text>
        </Box>
        <Promo size="2">
          <Flex css={{ justifyContent: "space-between" }}>
            <Flex align="center">
              <StyledIpfsIcon />
              <Text size="3">IPFS</Text>
            </Flex>

            {asset?.storage?.ipfs?.updatedAt && (
              <Text size="3" variant="gray">
                Uploaded on{" "}
                {moment
                  .unix(asset?.storage?.ipfs?.updatedAt / 1000)
                  .format("LLL")}
              </Text>
            )}

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
                  <Box>Save to IPFS</Box>
                </Button>
              </>
            )}
          </Flex>
          {asset?.storage?.ipfs?.cid && (
            <Box css={{ mt: "$3" }}>
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
                    <ClipButton
                      value={`ipfs://${asset.storage.ipfs.cid}`}
                      successMessage="Copied IPFS CID to clipboard"
                    />
                  </Flex>
                  <Text
                    variant="gray"
                    size="2"
                    css={{ mt: "$1", lineHeight: 1.4 }}>
                    ipfs://{asset?.storage?.ipfs?.cid}
                  </Text>
                </Box>
              </Flex>
            </Box>
          )}
        </Promo>
      </Box>
    </>
  );
};

export default AssetOverviewTab;
