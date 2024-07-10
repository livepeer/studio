import { Stream } from "@livepeer.studio/api";
import { Box, Flex, styled } from "@livepeer/design-system";
import { Tooltip } from "react-tooltip";
import { CellComponentProps, TableData } from "../types";
import { QuestionMarkIcon } from "@radix-ui/react-icons";

type ProfileProps = {
  id: string;
  i: number;
  rendition: Rendition;
};

type Rendition = {
  width: number;
  name: string;
  height: number;
  bitrate: number;
  fps: number;
};

const StyledQuestionMarkIcon = styled(QuestionMarkIcon, {
  color: "$gray8",

  ml: "$1",
});

const Profile = ({
  id,
  i,
  rendition: { fps, name, width, height, bitrate },
}: ProfileProps) => {
  return (
    <Box
      id={`profile-${id}-${i}-${name}`}
      key={`profile-${id}-${i}-${name}`}
      css={{
        display: "grid",
        alignItems: "space-around",
        gridTemplateColumns: "auto auto",
      }}>
      <Box>name:</Box>
      <Box>{name}</Box>
      <Box>fps:</Box>
      <Box>{fps}</Box>
      <Box>width:</Box>
      <Box>{width}</Box>
      <Box>height:</Box>
      <Box>{height}</Box>
      <Box>bitrate:</Box>
      <Box>{bitrate}</Box>
    </Box>
  );
};

export type RenditionDetailsCellProps = {
  stream: Stream;
};

const RenditionsDetailsCell = <D extends TableData>({
  cell: {
    value: { stream },
  },
}: CellComponentProps<D, RenditionDetailsCellProps>) => {
  let details = "";
  let detailsTooltip;
  if (stream.presets?.length) {
    details = `${stream.presets}`;
  }
  if (stream.profiles?.length) {
    if (details) {
      details += "/";
    }
    details += stream.profiles
      .map(({ height, fps }) => {
        if (fps === 0) {
          return `${height}pSourceFPS`;
        }
        return `${height}p${fps}`;
      })
      .join(",\u{200B}");
    detailsTooltip = (
      <Flex>
        {stream.profiles.map((p, i) => (
          <Profile key={i} id={stream.id} i={i} rendition={p} />
        ))}
      </Flex>
    );
    detailsTooltip = null; // remove for now, will be back later
  }
  return (
    <Flex>
      <Box>{details}</Box>
      {detailsTooltip ? (
        <Flex css={{ alignItems: "center" }}>
          <Flex>
            <Tooltip id={`tooltip-details-${stream.id}`} />
            <StyledQuestionMarkIcon
              data-tooltip-id={`tooltip-details-${stream.id}`}
              data-tooltip-content={detailsTooltip}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};

export { RenditionsDetailsCell };
