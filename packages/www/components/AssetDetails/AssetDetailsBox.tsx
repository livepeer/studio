import { Box, Flex, Heading } from "@livepeer/design-system";
import { Asset, getStreamSession } from "livepeer";
import { Asset as ApiAsset, Task } from "@livepeer.studio/api";
import numeral from "numeral";
import RelativeTime from "../RelativeTime";
import ShowURL from "../ShowURL";
import { useMemo } from "react";
import ClipButton from "../Clipping/ClipButton";

const Cell = ({ children, css = {} }) => {
  return (
    <Flex align="center" css={{ height: 22, mb: "$3", ...css }}>
      {children}
    </Flex>
  );
};

export type AssetDetailsBoxProps = {
  asset?: ApiAsset;
};

const AssetDetailsBox = ({ asset }: AssetDetailsBoxProps) => {
  const videoTrack = useMemo(
    () => asset?.videoSpec?.tracks?.find((t) => t?.type === "video"),
    [asset?.videoSpec]
  );

  const isClip = asset.source?.type ? asset.source.type === "clip" : false;
  let sourceSessionId: string;
  let sourceAssetId: string;
  if (asset.source?.type === "clip") {
    if (asset.source?.sessionId) {
      sourceSessionId = asset.source?.sessionId;
    }
    if (asset.source?.assetId) {
      sourceAssetId = asset.source?.assetId;
    }
  }

  return (
    <>
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
          <Cell css={{ color: "$hiContrast" }}>Name</Cell>
          <Cell>{asset.name}</Cell>
          {asset?.playbackUrl && (
            <>
              <Cell css={{ color: "$hiContrast" }}>Playback ID</Cell>
              <Cell>
                <ClipButton value={asset.playbackId} text={asset.playbackId} />
              </Cell>
              <Cell css={{ color: "$hiContrast" }}>Playback URL</Cell>
              <Cell>
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
          <Cell css={{ color: "$hiContrast" }}>Asset ID</Cell>
          <Cell>
            <ClipButton value={asset.id} text={asset.id} />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Created at</Cell>
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
              <Cell css={{ color: "$hiContrast" }}>Codec</Cell>
              <Cell>{videoTrack.codec}</Cell>
            </>
          )}
          {asset?.videoSpec?.format && (
            <>
              <Cell css={{ color: "$hiContrast" }}>Container</Cell>
              <Cell>{asset.videoSpec.format}</Cell>
            </>
          )}
          {asset.size && (
            <>
              <Cell css={{ color: "$hiContrast" }}>File size</Cell>
              <Cell>
                {numeral(asset.size).format("0,0.00 b").toLowerCase()}
              </Cell>
            </>
          )}

          {(asset?.videoSpec?.bitrate ?? videoTrack?.bitrate) && (
            <>
              <Cell css={{ color: "$hiContrast" }}>Bitrate</Cell>
              <Cell>
                {numeral(asset?.videoSpec?.bitrate ?? videoTrack?.bitrate)
                  .format("0,0.00 b")
                  .toLowerCase()}
                {"ps"}
              </Cell>
            </>
          )}
          {videoTrack?.width && videoTrack?.height && (
            <>
              <Cell css={{ color: "$hiContrast" }}>Resolution</Cell>
              <Cell>
                {videoTrack.width}
                {"x"}
                {videoTrack.height}
              </Cell>
            </>
          )}
          {isClip && sourceSessionId && (
            <>
              <Cell css={{ color: "$hiContrast" }}>Type</Cell>
              <Cell>Clip</Cell>
              <Cell css={{ color: "$hiContrast" }}>Parent session</Cell>
              <Cell>
                <ClipButton value={sourceSessionId} text={sourceSessionId} />
              </Cell>
            </>
          )}
          {isClip && sourceAssetId && (
            <>
              <Cell css={{ color: "$hiContrast" }}>Parent asset</Cell>
              <Cell>{sourceAssetId}</Cell>
            </>
          )}
        </Box>
      </Flex>
    </>
  );
};

export default AssetDetailsBox;
