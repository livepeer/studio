import { SigningKey } from "@livepeer.studio/api";
import { Box } from "@livepeer/design-system";
import { State } from "../Table";
import DateCell, { DateCellProps } from "../Table/cells/date";
import NameCell, { NameCellProps } from "../Table/cells/name";
import TextCell, { TextCellProps } from "../Table/cells/text";
import TableEmptyState from "../Table/components/TableEmptyState";
import { formatFiltersForApiRequest } from "../Table/filters";
import { stringSort, dateSort } from "../Table/sorts";
import { RowsPageFromStateResult, SortTypeArgs } from "../Table/types";

export type SigningKeysTableData = {
  id: string;
  name: NameCellProps;
  publicKey: TextCellProps;
  createdAt: DateCellProps;
};

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: NameCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.value", ...params),
    width: "$9",
  },
  {
    Header: "Public Key",
    accessor: "publicKey",
    disableSortBy: true,
    Cell: TextCell,
  },
  {
    Header: "Created",
    accessor: "createdAt",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.createdAt.date", ...params),
    width: "$9",
  },
];

export const rowsPageFromState = async (
  state: State<SigningKeysTableData>,
  getSigningKeys: Function,
): Promise<RowsPageFromStateResult<SigningKeysTableData>> => {
  const [signingKeys, nextCursor, _, count] = await getSigningKeys({
    filters: formatFiltersForApiRequest(state.filters),
    limit: state.pageSize.toString(),
    cursor: state.cursor,
    order: state.order,
    count: true,
  });
  const rows = signingKeys.map(
    (signingKey: SigningKey): SigningKeysTableData => ({
      id: signingKey.id,
      name: {
        name: signingKey.name,
        isStatusFailed: false,
      },
      publicKey: {
        children: (
          <Box css={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {signingKey.publicKey}
          </Box>
        ),
      },
      createdAt: {
        date: new Date(signingKey.createdAt),
        fallback: <Box css={{ color: "$primary8" }}>—</Box>,
      },
    }),
  );
  return { rows, nextCursor, count };
};

export const makeEmptyState = (actionToggleState) => (
  <TableEmptyState
    title="Create a signing key"
    description="Signing keys allow you to use playback policies with your streams to restrict access to them"
    learnMoreUrl="https://docs.livepeer.org/guides/developing/access-control"
    secondaryActionTitle="See the developer guide"
    primaryActionTitle="Create a signing key"
    actionToggleState={actionToggleState}
  />
);
