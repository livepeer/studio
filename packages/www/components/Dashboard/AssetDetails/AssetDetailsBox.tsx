import { Box, Flex, Heading } from "@livepeer/design-system";
import { Asset } from "livepeer";
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
  asset?: Asset;
};

const AssetDetailsBox = ({ asset }: AssetDetailsBoxProps) => {
  const videoTrack = useMemo(
    () => asset?.videoSpec?.tracks?.find((t) => t?.type === "video"),
    [asset?.videoSpec]
  );

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

          {(asset?.videoSpec?.format ?? videoTrack?.bitrate) && (
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
        </Box>
      </Flex>
    </>
  );
};

export default AssetDetailsBox;
