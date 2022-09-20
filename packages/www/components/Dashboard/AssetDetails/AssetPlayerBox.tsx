import { Badge, Box, Status } from "@livepeer/design-system"
import { Asset } from "livepeer"
import Player from "../Player"

export type AssetPlayerBoxProps = {
  asset?: Asset;
}

const AssetPlayerBox = ({ asset }: AssetPlayerBoxProps) => {
  return (
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
  )
}

export default AssetPlayerBox;
