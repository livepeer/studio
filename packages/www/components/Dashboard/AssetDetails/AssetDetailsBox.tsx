import { Box, Flex, Heading, HoverCardContent, HoverCardRoot, HoverCardTrigger, Text, useSnackbar } from "@livepeer/design-system"
import { Asset } from "livepeer"
import numeral from "numeral"
import RelativeTime from "../RelativeTime"
import ShowURL from "../ShowURL"
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useEffect, useMemo, useState } from "react"
import { CopyIcon } from "@radix-ui/react-icons"

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
              <CopyIcon
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

export type AssetDetailsBoxProps = {
  asset?: Asset;
}

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
              <Cell css={{ color: "$hiContrast" }}>
                Playback ID
              </Cell>
              <Cell>
                <ClipBut text={asset.playbackId} />
              </Cell>
              <Cell css={{ color: "$hiContrast" }}>
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
          <Cell css={{ color: "$hiContrast" }}>Asset ID</Cell>
          <Cell>
            <ClipBut text={asset.id} />
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
              <Cell css={{ color: "$hiContrast" }}>
                Container
              </Cell>
              <Cell>{asset.videoSpec.format}</Cell>
            </>
          )}
          {asset.size && (
            <>
              <Cell css={{ color: "$hiContrast" }}>
                File size
              </Cell>
              <Cell>
                {numeral(asset.size)
                  .format("0,0.00 b")
                  .toLowerCase()}
              </Cell>
            </>
          )}

          {(asset?.videoSpec?.format ?? videoTrack?.bitrate) && (
            <>
              <Cell css={{ color: "$hiContrast" }}>Bitrate</Cell>
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
              <Cell css={{ color: "$hiContrast" }}>
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
    </>
  )
}

export default AssetDetailsBox;
