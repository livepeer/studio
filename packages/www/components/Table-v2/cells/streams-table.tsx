import { Stream } from "@livepeer.com/api";
import { Box } from "@theme-ui/components";
import { Flex } from "@theme-ui/components";
import ReactTooltip from "react-tooltip";
import { CellComponentProps, TableData } from "../types";
import Help from "../../../public/img/help.svg";

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

const Profile = ({
  id,
  i,
  rendition: { fps, name, width, height, bitrate },
}: ProfileProps) => {
  return (
    <Box
      id={`profile-${id}-${i}-${name}`}
      key={`profile-${id}-${i}-${name}`}
      sx={{
        padding: "0.5em",
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

export type WithStreamProps = {
  stream: Stream;
};

const RenditionsDetailsCell = <D extends TableData>({
  cell: {
    value: { stream },
  },
}: CellComponentProps<D, WithStreamProps>) => {
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
        <Flex sx={{ alignItems: "center" }}>
          <Flex>
            <ReactTooltip
              id={`tooltip-details-${stream.id}`}
              className="tooltip"
              place="top"
              type="dark"
              effect="solid">
              {detailsTooltip}
            </ReactTooltip>
            <Help
              data-tip
              data-for={`tooltip-details-${stream.id}`}
              sx={{
                color: "muted",
                cursor: "pointer",
                ml: 1,
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};

function dur2str(dur?: number) {
  if (!dur) {
    return "";
  }
  if (dur < 120) {
    return `${dur.toFixed(2)} sec`;
  }
  const min = dur / 60;
  if (min < 12) {
    return `${min.toFixed(2)} min`;
  }
  const hour = min / 60;
  return `${hour.toFixed(2)} hours`;
}

const SegmentsCell = <D extends TableData>({
  cell: {
    value: { stream },
  },
}: CellComponentProps<D, WithStreamProps>) => {
  const idpref = `segments-${stream.id}`;
  return (
    <Box id={idpref} key={idpref}>
      <ReactTooltip
        id={`tooltip-${idpref}`}
        className="tooltip"
        place="top"
        type="dark"
        effect="solid">
        Source segments / Transcoded segments
      </ReactTooltip>
      <span data-tip data-for={`tooltip-${idpref}`}>
        {stream.sourceSegments || 0}/{stream.transcodedSegments || 0}
      </span>
      <br />
      <span>
        {dur2str(stream.sourceSegmentsDuration || 0)}/
        {dur2str(stream.transcodedSegmentsDuration || 0)}
      </span>
    </Box>
  );
};

export { RenditionsDetailsCell, SegmentsCell };
