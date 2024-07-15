import StatusBadge, { Variant as StatusVariant } from "../../StatusBadge";
import { TableData } from "components/Table";
import TextCell, { TextCellProps } from "components/Table/cells/text";
import { Box } from "@livepeer/design-system";
import { Condition } from "hooks/use-analyzer";
import { Stream } from "@livepeer.studio/api";

export type HealthChecksTableData = {
  id: string;
  name: TextCellProps;
  status: TextCellProps;
};

export const conditionTypes = [
  "Transcoding",
  "TranscodeRealTime",
  "Multistreaming",
] as const;

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: TextCell,
    disableSortBy: true,
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: TextCell,
    disableSortBy: true,
  },
];

export const makeTableData = (
  conditionsMap: Record<string, Condition>,
  stream: Stream,
  streamActiveSince: number,
): TableData<HealthChecksTableData> => ({
  isLoading: false,
  data: {
    count: conditionTypes.length,
    nextCursor: null,
    rows: conditionTypes.map((condType) => {
      const cond = conditionsMap[condType];
      const condValid =
        cond && cond.status != null && cond.lastProbeTime >= streamActiveSince;
      return {
        id: condType,
        name: {
          children: (
            <Box>
              {condType === "TranscodeRealTime" ? "Realtime" : condType}
            </Box>
          ),
        },
        status: {
          children: (
            <Box>
              {!stream.isActive || !condValid ? (
                "-"
              ) : (
                <StatusBadge
                  variant={
                    cond.status
                      ? StatusVariant.Healthy
                      : StatusVariant.Unhealthy
                  }
                  timestamp={cond?.lastProbeTime}
                />
              )}
            </Box>
          ),
        },
      };
    }),
  },
});
