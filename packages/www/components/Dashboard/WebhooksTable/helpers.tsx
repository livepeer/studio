import { Webhook } from "@livepeer.studio/api";
import { Box, Link } from "@livepeer/design-system";
import StatusBadge, { Variant as StatusVariant } from "../StatusBadge";
import DateCell, { DateCellProps } from "../Table/cells/date";
import TextCell, { TextCellProps } from "../Table/cells/text";
import TableEmptyState from "../Table/components/TableEmptyState";
import { stringSort, dateSort } from "../Table/sorts";
import { RowsPageFromStateResult, SortTypeArgs } from "../Table/types";

// 1 hour
const WARNING_TIMEFRAME = 1000 * 60 * 60;

export type WebhooksTableData = {
  name: TextCellProps;
  url: TextCellProps;
  created: DateCellProps;
  status: TextCellProps;
};

export const makeColumns = () => [
  {
    Header: "URL",
    accessor: "url",
    Cell: TextCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.url.value", ...params),
  },
  {
    Header: "Name",
    accessor: "name",
    Cell: TextCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.children", ...params),
  },
  {
    Header: "Created at",
    accessor: "created",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.created.date", ...params),
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: TextCell,
    disableSortBy: true,
  },
];

export const rowsPageFromState = async (
  state,
  getWebhooks: Function
): Promise<RowsPageFromStateResult<WebhooksTableData>> => {
  const [webhooks, nextCursor, _res, count] = await getWebhooks(
    false,
    false,
    state.order,
    null,
    state.pageSize,
    state.cursor,
    true
  );

  return {
    nextCursor,
    count,
    rows: webhooks.map((webhook: Webhook) => {
      return {
        id: webhook.id,
        name: {
          children: webhook.name,
          href: `/dashboard/developers/webhooks/${webhook.id}`,
          css: {
            cursor: "pointer",
            overflow: "hidden",
            "text-overflow": "ellipsis",
          },
        },
        url: {
          value: webhook.url,
          children: (
            <Link
              as="div"
              variant="primary"
              css={{
                overflow: "hidden",
                "text-overflow": "ellipsis",
              }}>
              {webhook.url}
            </Link>
          ),
          href: `/dashboard/developers/webhooks/${webhook.id}`,
          css: {
            cursor: "pointer",
          },
        },
        created: {
          date: new Date(webhook.createdAt),
          fallback: <i>unseen</i>,
          href: `/dashboard/developers/webhooks/${webhook.id}`,
          css: {
            cursor: "pointer",
          },
        },
        status: {
          children: (
            <Box>
              {!webhook.status ? (
                <StatusBadge
                  variant={StatusVariant.Idle}
                  tooltipText="No triggers yet"
                />
              ) : (webhook.status.lastFailure &&
                  +Date.now() - webhook.status.lastFailure?.timestamp <
                    WARNING_TIMEFRAME) ||
                webhook.status.lastFailure?.timestamp >=
                  webhook.status.lastTriggeredAt ? (
                <StatusBadge
                  variant={StatusVariant.Unhealthy}
                  timestamp={webhook.status.lastFailure.timestamp}
                  tooltipText="Last failure"
                />
              ) : (
                <StatusBadge
                  variant={StatusVariant.Healthy}
                  timestamp={webhook.status.lastTriggeredAt}
                  tooltipText="Last triggered"
                />
              )}
            </Box>
          ),
          href: `/dashboard/developers/webhooks/${webhook.id}`,
          css: {
            cursor: "pointer",
          },
        },
      };
    }),
  };
};

export const makeEmptyState = (actionToggleState) => (
  <TableEmptyState
    title="Create your first webhook"
    description="Listen for events on your Livepeer Studio account so your integration can automatically trigger reactions."
    learnMoreUrl="https://docs.livepeer.studio/guides/listen-for-webhooks"
    actionTitle="Create webhook"
    actionToggleState={actionToggleState}
  />
);
