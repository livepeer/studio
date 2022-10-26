import { SigningKey } from "@livepeer.studio/api";
import { Box } from "@livepeer/design-system";
import DateCell, { DateCellProps } from "../Table/cells/date";
import NameCell, { NameCellProps } from "../Table/cells/name";
import TextCell, { TextCellProps } from "../Table/cells/text";
import { formatFiltersForApiRequest } from "../Table/filters";
import { stringSort, dateSort } from "../Table/sorts";
import { SortTypeArgs } from "../Table/types";

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: NameCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.value", ...params),
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
  },
];

export type SigningKeysTableData = {
  id: string;
  name: NameCellProps;
  publicKey: TextCellProps;
  createdAt: DateCellProps;
};

export type RowsPageFromStateResult = {
  rows: SigningKeysTableData[];
  nextCursor: any;
  count: any;
};

export const rowsPageFromState = async (
  state,
  getSigningKeys: Function
): Promise<RowsPageFromStateResult> => {
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
    })
  );
  return { rows, nextCursor, count };
};
