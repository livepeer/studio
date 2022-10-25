import { SigningKey } from "@livepeer.studio/api";
import { Box } from "@livepeer/design-system";
import DateCell, { DateCellProps } from "../Table/cells/date";
import TextCell, { TextCellProps } from "../Table/cells/text";
import { stringSort, dateSort } from "../Table/sorts";
import { SortTypeArgs } from "../Table/types";

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: TextCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.children", ...params),
  },
  {
    Header: "Public Key",
    accessor: "token",
    width: 400,
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
  name: TextCellProps;
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
  const [signingKeys, nextCursor, count] = await getSigningKeys();
  const rows: SigningKeysTableData[] = signingKeys.map(
    (signingKey: SigningKey): SigningKeysTableData => {
      return {
        id: signingKey.id,
        name: {
          children: <Box>{signingKey.name}</Box>,
        },
        publicKey: {
          children: <Box>{signingKey.publicKey}</Box>,
        },
        createdAt: {
          date: new Date(signingKey.createdAt),
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
        },
      };
    }
  );
  console.log("rows", rows, nextCursor, count);
  return { rows, nextCursor, count };
};
