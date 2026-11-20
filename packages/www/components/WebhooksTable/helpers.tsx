import { Webhook } from "@livepeer.studio/api";
import { Box, Button, Link, Tooltip } from "@livepeer/design-system";
import DateCell, { DateCellProps } from "../Table/cells/date";
import TextCell, { TextCellProps } from "../Table/cells/text";
import TableEmptyState from "../Table/components/TableEmptyState";
import { stringSort, dateSort } from "../Table/sorts";
import { RowsPageFromStateResult, SortTypeArgs } from "../Table/types";
import moment from "moment";

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
    Cell: ({ cell }) => {
      const url = cell.value.value;
      const truncatedUrl = url.length > 40 ? url.substring(0, 40) + "..." : url;

      const updatedCell = {
        ...cell,
        value: {
          ...cell.value,
          children: truncatedUrl,
        },
      };
      // @ts-ignore - it is valid, just not typed - will check back later
      return <TextCell cell={updatedCell} />;
    },
    disableSortBy: true,
  },
  {
    Header: "Listening for",
    accessor: "events",
    Cell: TextCell,
    disableSortBy: true,
  },
  {
    Header: "Last failure",
    accessor: "lastFailure",
    Cell: DateCell,
    disableSortBy: true,
  },
  {
    Header: "Last trigger",
    accessor: "lastTriggeredAt",
    Cell: DateCell,
    disableSortBy: true,
  },
];

export const rowsPageFromState = async (
  state,
  getWebhooks: Function,
  appendProjectId: Function,
): Promise<RowsPageFromStateResult<WebhooksTableData>> => {
  const [webhooks, nextCursor, _res, count] = await getWebhooks(
    false,
    false,
    state.order,
    null,
    state.pageSize,
    state.cursor,
    true,
  );

  return {
    nextCursor,
    count,
    rows: webhooks.map((webhook: Webhook) => {
      return {
        id: webhook.id,
        name: {
          children: webhook.name,
          href: appendProjectId(`/developers/webhooks/${webhook.id}`),
          css: {
            overflow: "hidden",
            "text-overflow": "ellipsis",
          },
        },
        url: {
          value: webhook.url,
          children: (
            <Link
              as="div"
              css={{
                overflow: "hidden",
                "text-overflow": "ellipsis",
                fontSize: "$3",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "none",
              }}>
              {webhook.url}
            </Link>
          ),
          href: appendProjectId(`/developers/webhooks/${webhook.id}`),
          css: {},
        },
        events: {
          children: (
            <Tooltip
              multiline
              //@ts-ignore
              content={webhook.events.map((event) => (
                <Box key={event}>{event}</Box>
              ))}>
              <Button
                css={{
                  fontWeight: 500,
                }}>
                {webhook.events.length} events
              </Button>
            </Tooltip>
          ),
          href: appendProjectId(`/developers/webhooks/${webhook.id}`),
          css: {},
        },

        lastFailure: {
          date: new Date(webhook?.status?.lastFailure?.timestamp),
          fallback: <p>-</p>,
          href: appendProjectId(`/developers/webhooks/${webhook.id}`),
          css: {},
        },
        lastTriggeredAt: {
          date: new Date(webhook?.status?.lastTriggeredAt),
          fallback: <p>-</p>,
          href: appendProjectId(`/developers/webhooks/${webhook.id}`),
          css: {},
        },
      };
    }),
  };
};

export const makeEmptyState = (actionToggleState) => (
  <TableEmptyState
    title="Create your first webhook"
    description="Webhooks let your application know when things happen outside of an API request cycle. After a webhook is configured it will receive a notification for all events."
    learnMoreUrl="https://docs.livepeer.org/guides/developing/listen-for-webhooks"
    primaryActionTitle="Create webhook"
    secondaryActionTitle="See the developer guide"
    actionToggleState={actionToggleState}
  />
);
