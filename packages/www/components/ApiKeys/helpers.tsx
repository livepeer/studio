import { ApiToken } from "@livepeer.studio/api";
import { Box } from "@livepeer/design-system";
import DateCell, { DateCellProps } from "../Table/cells/date";
import TextCell, { TextCellProps } from "../Table/cells/text";
import TableEmptyState from "../Table/components/TableEmptyState";
import { stringSort, dateSort } from "../Table/sorts";
import { RowsPageFromStateResult, SortTypeArgs } from "../Table/types";
import CorsCell from "./CorsCell";
import KeyCell from "./KeyCell";

export type ApiKeysTableData = {
  id: string;
  name: TextCellProps;
  token: TextCellProps;
  lastUsed: DateCellProps;
  createdAt: DateCellProps;
  cors: TextCellProps;
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
    Header: "Token",
    accessor: "token",
    width: 400,
    disableSortBy: true,
    Cell: TextCell,
  },
  {
    Header: "Last Used",
    accessor: "lastUsed",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.lastUsed.date", ...params),
  },
  {
    Header: "Created",
    accessor: "createdAt",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.createdAt.date", ...params),
  },
  {
    Header: "CORS Access",
    accessor: "cors",
    Cell: TextCell,
    disableSortBy: true,
  },
];

export const rowsPageFromState = async (
  userId: string,
  getApiTokens: Function
): Promise<RowsPageFromStateResult<ApiKeysTableData>> => {
  const [tokens, nextCursor, resp, count] = await getApiTokens(userId, {
    count: true,
  });

  if (!resp.ok || !Array.isArray(tokens)) {
    throw resp;
  }

  const rows: ApiKeysTableData[] = tokens.map(
    (token: ApiToken): ApiKeysTableData => ({
      id: token.id,
      token: {
        children: <KeyCell token={token} />,
      },
      name: {
        children: token.name,
      },
      createdAt: {
        date: new Date(token.createdAt),
        fallback: <Box css={{ color: "$primary8" }}>—</Box>,
      },
      lastUsed: {
        date: new Date(token.lastSeen),
        fallback: <i>unused</i>,
      },
      cors: {
        children: <CorsCell cors={token.access?.cors} />,
      },
    })
  );

  return {
    rows,
    nextCursor,
    count,
  };
};

export const makeEmptyState = (actionToggleState) => (
  <TableEmptyState
    title="Create an API key"
    description="API keys allow you to authenticate API requests in your app"
    learnMoreUrl="https://docs.livepeer.org/guides/developing/quickstart"
    secondaryActionTitle="See the developer guide"
    primaryActionTitle="Create an API key"
    actionToggleState={actionToggleState}
  />
);
