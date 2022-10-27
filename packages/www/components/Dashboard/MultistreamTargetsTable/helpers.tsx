import TextCell, { TextCellProps } from "../Table/cells/text";
import { stringSort } from "../Table/sorts";
import { SortTypeArgs } from "../Table/types";
import { TableData } from "components/Dashboard/Table";
import TargetStatusBadge from "./TargetStatusBadge";
import Toolbox from "./Toolbox";
import { Tooltip, Label } from "@livepeer/design-system";
import { Stream } from "@livepeer.studio/api";
import { HealthStatus } from "hooks/use-analyzer";

export type TargetsTableData = {
  id: string;
  name: TextCellProps;
  profile: TextCellProps;
  status: TextCellProps;
  toolbox: TextCellProps;
};

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: TextCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.children", ...params),
  },
  {
    Header: "Profile",
    accessor: "profile",
    Cell: TextCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.profile.children", ...params),
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: TextCell,
    disableSortBy: true,
  },
  {
    Header: "",
    accessor: "toolbox",
    Cell: TextCell,
    disableSortBy: true,
  },
];

export const makeTableData = (
  stream: Stream,
  streamHealth: HealthStatus,
  streamActiveSince,
  targets,
  targetRefs,
  invalidateStream: (optm?: Stream) => Promise<void>,
  invalidateTargetId
): TableData<TargetsTableData> => {
  return {
    isLoading: false,
    data: {
      count: targets.length,
      nextCursor: null,
      rows: targets.map((target, idx) => {
        const ref = targetRefs[idx];
        const status = streamHealth?.multistream?.find(
          (m) => m.target.id === ref.id && m.target.profile === ref.profile
        );
        return {
          id: ref.id,
          name: {
            children: (
              <Tooltip content={ref.id}>
                <Label>{target?.name ?? "..."}</Label>
              </Tooltip>
            ),
          },
          profile: {
            children: ref.profile + (ref.videoOnly ? " (video-only)" : ""),
          },
          status: {
            children: (
              <TargetStatusBadge
                stream={stream}
                target={target}
                status={status}
                streamActiveSince={streamActiveSince}
              />
            ),
          },
          toolbox: {
            children: (
              <Toolbox
                target={target}
                stream={stream}
                invalidateTargetId={invalidateTargetId}
                invalidateStream={invalidateStream}
              />
            ),
          },
        };
      }),
    },
  };
};
