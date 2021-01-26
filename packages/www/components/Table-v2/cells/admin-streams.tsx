import { Stream, User } from "@livepeer.com/api";
import { Flex } from "@theme-ui/components";
import { Box } from "@theme-ui/components";
import Link from "next/link";
import ReactTooltip from "react-tooltip";
import { CellComponentProps, TableData } from "../types";
import Help from "../../../public/img/help.svg";

export interface StreamNameCellProps {
  stream: Stream;
  admin?: boolean;
}

const StreamNameCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, StreamNameCellProps>) => {
  const pid = `stream-name-${cell.value.stream.id}-${name}`;
  const query = cell.value.admin ? { admin: true } : {};
  return (
    <Box>
      {cell.value.stream.createdByTokenName ? (
        <ReactTooltip
          id={pid}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid">
          Created by token <b>{cell.value.stream.createdByTokenName}</b>
        </ReactTooltip>
      ) : null}
      <Box data-tip data-for={pid}>
        <Link
          href={{ pathname: "/app/stream/[id]", query }}
          as={`/app/stream/${cell.value.stream.id}`}>
          <a>{cell.value.stream.name}</a>
        </Link>
      </Box>
    </Box>
  );
};

export interface UserNameCellProps {
  id: string;
  users: User[];
}

const UserNameCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, UserNameCellProps>) => {
  const user = cell.value.users.find((o) => o.id === cell.value.id);
  const tid = `tooltip-name-${cell.value.id}`;
  return (
    <Box
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
      <ReactTooltip
        id={tid}
        className="tooltip"
        place="top"
        type="dark"
        effect="solid">
        {user ? user.email : cell.value.id}
      </ReactTooltip>
      <span data-tip data-for={tid}>
        {user
          ? user.email.includes("@")
            ? user.email.split("@").join("@\u{200B}")
            : user.email
          : cell.value.id}
      </span>
    </Box>
  );
};

type Rendition = {
  width: number;
  name: string;
  height: number;
  bitrate: number;
  fps: number;
};

type ProfileProps = {
  id: string;
  i: number;
  rendition: Rendition;
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

export interface RenditionsDetailsCellProps {
  stream: Stream;
}

const RenditionsDetailsCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, RenditionsDetailsCellProps>) => {
  let details = "";
  let detailsTooltip;
  if (cell.value.stream.presets?.length) {
    details = `${cell.value.stream.presets}`;
  }
  if (cell.value.stream.profiles?.length) {
    if (details) {
      details += "/";
    }
    details += cell.value.stream.profiles
      .map(({ height, fps }) => {
        if (fps === 0) {
          return `${height}pSourceFPS`;
        }
        return `${height}p${fps}`;
      })
      .join(",\u{200B}");
    detailsTooltip = (
      <Flex>
        {cell.value.stream.profiles.map((p, i) => (
          <Profile key={i} id={cell.value.stream.id} i={i} rendition={p} />
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
              id={`tooltip-details-${cell.value.stream.id}`}
              className="tooltip"
              place="top"
              type="dark"
              effect="solid">
              {detailsTooltip}
            </ReactTooltip>
            <Help
              data-tip
              data-for={`tooltip-details-${cell.value.stream.id}`}
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

export interface SegmentsCellProps {
  stream: Stream;
}

const SegmentsCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, SegmentsCellProps>) => {
  const idpref = `segments-${cell.value.stream.id}`;
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
        {cell.value.stream.sourceSegments || 0}/
        {cell.value.stream.transcodedSegments || 0}
      </span>
      <br />
      <span>
        {dur2str(cell.value.stream.sourceSegmentsDuration || 0)}/
        {dur2str(cell.value.stream.transcodedSegmentsDuration || 0)}
      </span>
    </Box>
  );
};

export { StreamNameCell, UserNameCell, RenditionsDetailsCell, SegmentsCell };
